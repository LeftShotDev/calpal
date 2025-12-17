/**
 * Calendar Auth Service for minimal scheduling application
 *
 * Handles OAuth2 flow for Google Calendar integration:
 * - Generate authorization URLs
 * - Exchange authorization codes for tokens
 * - Store encrypted tokens
 * - Refresh expired tokens
 */

import { OAuth2Client } from "googleapis-common";
import { prisma } from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma";
import logger from "@calcom/lib/logger";
import { symmetricEncrypt, symmetricDecrypt } from "@calcom/lib/crypto";
import { getGoogleAppKeys } from "@calcom/app-store/googlecalendar/lib/getGoogleAppKeys";
import { GOOGLE_CALENDAR_SCOPES } from "@calcom/lib/constants";

const log = logger.getSubLogger({ prefix: ["CalendarAuthService"] });

const CALENDSO_ENCRYPTION_KEY = process.env.CALENDSO_ENCRYPTION_KEY;

if (!CALENDSO_ENCRYPTION_KEY) {
	throw new Error("CALENDSO_ENCRYPTION_KEY environment variable is required");
}

// Type assertion: we've checked above that it exists
const ENCRYPTION_KEY: string = CALENDSO_ENCRYPTION_KEY;

export interface OAuthTokens {
	access_token: string;
	refresh_token?: string;
	expiry_date?: number;
	token_type?: string;
	scope?: string;
}

export class CalendarAuthService {
	constructor(private readonly prismaClient: PrismaClient = prisma) {}

	/**
	 * Generate OAuth authorization URL
	 * @param userId - User ID
	 * @param redirectUri - OAuth callback redirect URI
	 * @param state - Optional state parameter for CSRF protection
	 * @returns Authorization URL
	 */
	async generateAuthUrl(
		userId: number,
		redirectUri: string,
		state?: string
	): Promise<string> {
		try {
			const { client_id, client_secret } = await getGoogleAppKeys();
			const oAuth2Client = new OAuth2Client(client_id, client_secret, redirectUri);

			const authUrl = oAuth2Client.generateAuthUrl({
				access_type: "offline",
				scope: GOOGLE_CALENDAR_SCOPES,
				prompt: "consent", // Force consent to get refresh token
				state: state || `user-${userId}-${Date.now()}`,
			});

			return authUrl;
		} catch (error) {
			log.error("Error generating auth URL", { error, userId });
			throw error;
		}
	}

	/**
	 * Exchange authorization code for tokens and store encrypted
	 * @param userId - User ID
	 * @param code - Authorization code from OAuth callback
	 * @param redirectUri - OAuth callback redirect URI
	 * @returns CalendarIntegration ID
	 */
	async exchangeCodeForTokens(
		userId: number,
		code: string,
		redirectUri: string
	): Promise<string> {
		try {
			const { client_id, client_secret } = await getGoogleAppKeys();
			const oAuth2Client = new OAuth2Client(client_id, client_secret, redirectUri);

			// Exchange code for tokens
			const { tokens } = await oAuth2Client.getToken(code);

			if (!tokens.access_token) {
				throw new Error("No access token received from Google");
			}

			// Encrypt tokens
			const encryptedAccessToken = symmetricEncrypt(
				JSON.stringify({
					access_token: tokens.access_token,
					refresh_token: tokens.refresh_token,
					expiry_date: tokens.expiry_date,
					token_type: tokens.token_type,
					scope: tokens.scope,
				}),
				ENCRYPTION_KEY
			);

			const encryptedRefreshToken = tokens.refresh_token
				? symmetricEncrypt(tokens.refresh_token, ENCRYPTION_KEY)
				: null;

			// Calculate token expiry
			const tokenExpiresAt = tokens.expiry_date
				? new Date(tokens.expiry_date)
				: tokens.expiry_date === undefined
					? null
					: new Date(Date.now() + 3600 * 1000); // Default 1 hour

			// Create or update integration
			const integration = await this.prismaClient.calendarIntegration.upsert({
				where: {
					userId_type: {
						userId,
						type: "google-calendar",
					},
				},
				create: {
					userId,
					type: "google-calendar",
					accessToken: encryptedAccessToken,
					refreshToken: encryptedRefreshToken,
					tokenExpiresAt,
					calendarId: "primary",
					syncStatus: "disconnected", // Will be set to 'active' after first sync
				},
				update: {
					accessToken: encryptedAccessToken,
					refreshToken: encryptedRefreshToken,
					tokenExpiresAt,
					syncStatus: "disconnected",
					syncError: null,
				},
			});

			return integration.id;
		} catch (error) {
			log.error("Error exchanging code for tokens", { error, userId });
			throw error;
		}
	}

	/**
	 * Get OAuth2Client for a calendar integration
	 * @param integrationId - CalendarIntegration ID
	 * @returns OAuth2Client with credentials set
	 */
	async getOAuthClient(integrationId: string): Promise<OAuth2Client> {
		const integration = await this.prismaClient.calendarIntegration.findUnique({
			where: { id: integrationId },
			select: {
				accessToken: true,
				refreshToken: true,
				tokenExpiresAt: true,
				userId: true,
			},
		});

		if (!integration) {
			throw new Error(`Calendar integration not found: ${integrationId}`);
		}

		// Decrypt tokens
		const decryptedTokens = JSON.parse(
			symmetricDecrypt(integration.accessToken, ENCRYPTION_KEY)
		) as OAuthTokens;

		const { client_id, client_secret } = await getGoogleAppKeys();
		const oAuth2Client = new OAuth2Client(client_id, client_secret);

		// Set credentials
		oAuth2Client.setCredentials({
			access_token: decryptedTokens.access_token,
			refresh_token: decryptedTokens.refresh_token,
			expiry_date: decryptedTokens.expiry_date,
			token_type: decryptedTokens.token_type,
			scope: decryptedTokens.scope,
		});

		return oAuth2Client;
	}

	/**
	 * Refresh expired OAuth tokens
	 * @param integrationId - CalendarIntegration ID
	 * @returns Updated tokens
	 */
	async refreshTokens(integrationId: string): Promise<void> {
		try {
			const integration = await this.prismaClient.calendarIntegration.findUnique({
				where: { id: integrationId },
				select: {
					accessToken: true,
					refreshToken: true,
					userId: true,
				},
			});

			if (!integration) {
				throw new Error(`Calendar integration not found: ${integrationId}`);
			}

			if (!integration.refreshToken) {
				throw new Error("No refresh token available");
			}

			// Decrypt refresh token
			const refreshToken = symmetricDecrypt(integration.refreshToken, ENCRYPTION_KEY);

			const { client_id, client_secret } = await getGoogleAppKeys();
			const oAuth2Client = new OAuth2Client(client_id, client_secret);

			// Refresh token
			const { credentials } = await oAuth2Client.refreshAccessToken();
			const newTokens = credentials;

			if (!newTokens.access_token) {
				throw new Error("No access token received from refresh");
			}

			// Encrypt new tokens
			const encryptedAccessToken = symmetricEncrypt(
				JSON.stringify({
					access_token: newTokens.access_token,
					refresh_token: newTokens.refresh_token || refreshToken, // Keep old refresh token if not provided
					expiry_date: newTokens.expiry_date,
					token_type: newTokens.token_type,
					scope: newTokens.scope,
				}),
				ENCRYPTION_KEY
			);

			const encryptedRefreshToken = newTokens.refresh_token
				? symmetricEncrypt(newTokens.refresh_token, ENCRYPTION_KEY)
				: integration.refreshToken; // Keep old if not provided

			const tokenExpiresAt = newTokens.expiry_date
				? new Date(newTokens.expiry_date)
				: new Date(Date.now() + 3600 * 1000);

			// Update integration
			await this.prismaClient.calendarIntegration.update({
				where: { id: integrationId },
				data: {
					accessToken: encryptedAccessToken,
					refreshToken: encryptedRefreshToken,
					tokenExpiresAt,
				},
			});

			log.debug("Tokens refreshed successfully", { integrationId });
		} catch (error) {
			log.error("Error refreshing tokens", { error, integrationId });
			throw error;
		}
	}

	/**
	 * Check if token needs refresh and refresh if needed
	 * @param integrationId - CalendarIntegration ID
	 */
	async ensureValidToken(integrationId: string): Promise<void> {
		const integration = await this.prismaClient.calendarIntegration.findUnique({
			where: { id: integrationId },
			select: {
				tokenExpiresAt: true,
			},
		});

		if (!integration) {
			throw new Error(`Calendar integration not found: ${integrationId}`);
		}

		// Check if token is expired or expiring soon (within 5 minutes)
		if (integration.tokenExpiresAt) {
			const expiresAt = integration.tokenExpiresAt.getTime();
			const now = Date.now();
			const fiveMinutes = 5 * 60 * 1000;

			if (expiresAt - now < fiveMinutes) {
				log.debug("Token expiring soon, refreshing", { integrationId });
				await this.refreshTokens(integrationId);
			}
		}
	}
}


/**
 * Calendar router for minimal scheduling application
 *
 * Handles Google Calendar integration:
 * - Connect/disconnect calendar
 * - OAuth flow
 * - Manual sync trigger
 * - Get integration status
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { CalendarAuthService } from "@calcom/features/calendar/services/CalendarAuthService";
import { CalendarSyncService } from "@calcom/features/calendar/services/CalendarSyncService";
import { WEBAPP_URL_FOR_OAUTH } from "@calcom/lib/constants";
import { prisma } from "@calcom/prisma";

// Input schemas
const connectInputSchema = z.object({
	// No input needed - uses authenticated user
});

const callbackInputSchema = z.object({
	code: z.string().min(1, "Authorization code is required"),
	state: z.string().optional(),
});

const syncInputSchema = z.object({
	// No input needed - uses authenticated user
});

const disconnectInputSchema = z.object({
	// No input needed - uses authenticated user
});

export const calendarRouter = router({
	/**
	 * Generate OAuth authorization URL for Google Calendar
	 */
	connect: authedProcedure.input(connectInputSchema).mutation(async ({ ctx }) => {
		if (!ctx.user?.id) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Not authenticated",
			});
		}

		const authService = new CalendarAuthService();
		const redirectUri = `${WEBAPP_URL_FOR_OAUTH}/api/integrations/googlecalendar/callback`;
		const authUrl = await authService.generateAuthUrl(ctx.user.id, redirectUri);

		return {
			authUrl,
		};
	}),

	/**
	 * Handle OAuth callback - exchange code for tokens
	 */
	callback: authedProcedure.input(callbackInputSchema).mutation(async ({ ctx, input }) => {
		if (!ctx.user?.id) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Not authenticated",
			});
		}

		const authService = new CalendarAuthService();
		const redirectUri = `${WEBAPP_URL_FOR_OAUTH}/api/integrations/googlecalendar/callback`;

		try {
			const integrationId = await authService.exchangeCodeForTokens(
				ctx.user.id,
				input.code,
				redirectUri
			);

			// Perform initial sync
			const syncService = new CalendarSyncService();
			const oAuthClient = await authService.getOAuthClient(integrationId);
			await syncService.performFullSync(integrationId, oAuthClient);

			// Get updated integration
			const integration = await prisma.calendarIntegration.findUnique({
				where: { id: integrationId },
				select: {
					id: true,
					type: true,
					syncStatus: true,
				},
			});

			return {
				integration: integration
					? {
							id: integration.id,
							type: integration.type,
							syncStatus: integration.syncStatus,
						}
					: null,
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: error instanceof Error ? error.message : "Failed to connect calendar",
			});
		}
	}),

	/**
	 * Get calendar integration status for authenticated user
	 */
	getIntegration: authedProcedure.query(async ({ ctx }) => {
		if (!ctx.user?.id) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Not authenticated",
			});
		}

		const integration = await prisma.calendarIntegration.findUnique({
			where: {
				userId_type: {
					userId: ctx.user.id,
					type: "google-calendar",
				},
			},
			select: {
				id: true,
				type: true,
				calendarId: true,
				syncStatus: true,
				lastSyncAt: true,
				syncError: true,
			},
		});

		return {
			integration: integration
				? {
						id: integration.id,
						type: integration.type as "google-calendar",
						calendarId: integration.calendarId,
						syncStatus: integration.syncStatus as "active" | "error" | "disconnected",
						lastSyncAt: integration.lastSyncAt?.toISOString(),
						syncError: integration.syncError,
					}
				: null,
		};
	}),

	/**
	 * Disconnect calendar integration
	 */
	disconnect: authedProcedure.input(disconnectInputSchema).mutation(async ({ ctx }) => {
		if (!ctx.user?.id) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Not authenticated",
			});
		}

		const integration = await prisma.calendarIntegration.findUnique({
			where: {
				userId_type: {
					userId: ctx.user.id,
					type: "google-calendar",
				},
			},
			select: {
				id: true,
			},
		});

		if (!integration) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Calendar integration not found",
			});
		}

		// Delete integration and associated events
		await prisma.calendarEvent.deleteMany({
			where: {
				calendarIntegrationId: integration.id,
			},
		});

		await prisma.calendarIntegration.delete({
			where: { id: integration.id },
		});

		return {
			success: true,
		};
	}),

	/**
	 * Manually trigger calendar sync
	 */
	sync: authedProcedure.input(syncInputSchema).mutation(async ({ ctx }) => {
		if (!ctx.user?.id) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Not authenticated",
			});
		}

		const integration = await prisma.calendarIntegration.findUnique({
			where: {
				userId_type: {
					userId: ctx.user.id,
					type: "google-calendar",
				},
			},
			select: {
				id: true,
			},
		});

		if (!integration) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Calendar integration not found",
			});
		}

		const authService = new CalendarAuthService();
		const syncService = new CalendarSyncService();

		try {
			// Ensure token is valid
			await authService.ensureValidToken(integration.id);

			// Get OAuth client
			const oAuthClient = await authService.getOAuthClient(integration.id);

			// Perform incremental sync
			const result = await syncService.performIncrementalSync(integration.id, oAuthClient);

			return {
				success: !result.hasError,
				eventsSynced: result.eventsSynced,
				lastSyncAt: result.lastSyncAt.toISOString(),
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: error instanceof Error ? error.message : "Sync failed",
			});
		}
	}),
});


/**
 * Calendar Sync Service for minimal scheduling application
 *
 * Handles incremental and full sync of Google Calendar events
 * Uses syncToken pattern to avoid query loops
 */

import { OAuth2Client } from "googleapis-common";
import { prisma } from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma";
import logger from "@calcom/lib/logger";
import { GoogleCalendarClient, type GoogleCalendarEvent } from "@calcom/lib/calendar/GoogleCalendarClient";
import { subDays } from "date-fns";

const log = logger.getSubLogger({ prefix: ["CalendarSyncService"] });

export interface SyncResult {
	eventsSynced: number;
	nextSyncToken?: string;
	lastSyncAt: Date;
	hasError: boolean;
	errorMessage?: string;
}

export class CalendarSyncService {
	constructor(private readonly prismaClient: PrismaClient = prisma) {}

	/**
	 * Perform incremental sync using stored syncToken
	 * @param integrationId - CalendarIntegration ID
	 * @param authClient - OAuth2Client for Google Calendar API
	 * @returns Sync result with events synced count
	 */
	async performIncrementalSync(
		integrationId: string,
		authClient: OAuth2Client
	): Promise<SyncResult> {
		try {
			// Get integration with syncToken
			const integration = await this.prismaClient.calendarIntegration.findUnique({
				where: { id: integrationId },
				select: {
					id: true,
					userId: true,
					calendarId: true,
					syncToken: true,
					lastSyncAt: true,
				},
			});

			if (!integration) {
				throw new Error(`Calendar integration not found: ${integrationId}`);
			}

			if (!integration.syncToken) {
				// No syncToken means we need to do a full sync first
				log.debug("No syncToken found, performing full sync", { integrationId });
				return this.performFullSync(integrationId, authClient);
			}

			const client = new GoogleCalendarClient(authClient);
			const result = await client.listEvents(integration.calendarId, {
				syncToken: integration.syncToken,
			});

			// Process events: create new, update existing, delete removed
			const eventsSynced = await this.processSyncEvents(integrationId, result.events);

			// Update integration with new syncToken and lastSyncAt
			await this.prismaClient.calendarIntegration.update({
				where: { id: integrationId },
				data: {
					syncToken: result.nextSyncToken,
					lastSyncAt: new Date(),
					syncStatus: "active",
					syncError: null,
				},
			});

			return {
				eventsSynced,
				nextSyncToken: result.nextSyncToken,
				lastSyncAt: new Date(),
				hasError: false,
			};
		} catch (error) {
			log.error("Error performing incremental sync", { error, integrationId });
			const errorMessage = error instanceof Error ? error.message : "Unknown error";

			// Update integration with error status
			await this.prismaClient.calendarIntegration.update({
				where: { id: integrationId },
				data: {
					syncStatus: "error",
					syncError: errorMessage,
				},
			});

			return {
				eventsSynced: 0,
				lastSyncAt: new Date(),
				hasError: true,
				errorMessage,
			};
		}
	}

	/**
	 * Perform full sync (initial sync or when syncToken is invalid)
	 * @param integrationId - CalendarIntegration ID
	 * @param authClient - OAuth2Client for Google Calendar API
	 * @returns Sync result with events synced count
	 */
	async performFullSync(integrationId: string, authClient: OAuth2Client): Promise<SyncResult> {
		try {
			const integration = await this.prismaClient.calendarIntegration.findUnique({
				where: { id: integrationId },
				select: {
					id: true,
					userId: true,
					calendarId: true,
				},
			});

			if (!integration) {
				throw new Error(`Calendar integration not found: ${integrationId}`);
			}

			const client = new GoogleCalendarClient(authClient);

			// Sync last 90 days and next 90 days
			const now = new Date();
			const timeMin = subDays(now, 90).toISOString();
			const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

			const result = await client.listEvents(integration.calendarId, {
				timeMin,
				timeMax,
			});

			// Process events
			const eventsSynced = await this.processSyncEvents(integrationId, result.events);

			// Update integration with syncToken and lastSyncAt
			await this.prismaClient.calendarIntegration.update({
				where: { id: integrationId },
				data: {
					syncToken: result.nextSyncToken,
					lastSyncAt: new Date(),
					syncStatus: "active",
					syncError: null,
				},
			});

			return {
				eventsSynced,
				nextSyncToken: result.nextSyncToken,
				lastSyncAt: new Date(),
				hasError: false,
			};
		} catch (error) {
			log.error("Error performing full sync", { error, integrationId });
			const errorMessage = error instanceof Error ? error.message : "Unknown error";

			await this.prismaClient.calendarIntegration.update({
				where: { id: integrationId },
				data: {
					syncStatus: "error",
					syncError: errorMessage,
				},
			});

			return {
				eventsSynced: 0,
				lastSyncAt: new Date(),
				hasError: true,
				errorMessage,
			};
		}
	}

	/**
	 * Process synced events: create, update, or delete CalendarEvent records
	 * @param integrationId - CalendarIntegration ID
	 * @param events - Events from Google Calendar API
	 */
	private async processSyncEvents(
		integrationId: string,
		events: GoogleCalendarEvent[]
	): Promise<number> {
		let eventsProcessed = 0;

		for (const event of events) {
			if (!event.id || !event.start?.dateTime) {
				// Skip all-day events or events without ID
				continue;
			}

			const startTime = new Date(event.start.dateTime);
			const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : startTime;

			// Upsert event (create or update)
			await this.prismaClient.calendarEvent.upsert({
				where: {
					calendarIntegrationId_externalEventId: {
						calendarIntegrationId: integrationId,
						externalEventId: event.id,
					},
				},
				create: {
					calendarIntegrationId: integrationId,
					externalEventId: event.id,
					startTime,
					endTime,
					title: event.summary || "Untitled Event",
					isBusy: true, // Default to busy
				},
				update: {
					startTime,
					endTime,
					title: event.summary || "Untitled Event",
					syncedAt: new Date(),
				},
			});

			eventsProcessed++;
		}

		return eventsProcessed;
	}

	/**
	 * Handle syncToken - validate and update if needed
	 * @param integrationId - CalendarIntegration ID
	 * @param syncToken - Sync token to validate and store
	 */
	async handleSyncToken(integrationId: string, syncToken: string | null): Promise<void> {
		if (!syncToken) {
			return;
		}

		await this.prismaClient.calendarIntegration.update({
			where: { id: integrationId },
			data: { syncToken },
		});
	}

	/**
	 * Clean up calendar events older than 90 days
	 * @param integrationId - Optional: specific integration, or all if not provided
	 */
	async cleanupOldEvents(integrationId?: string): Promise<number> {
		const cutoffDate = subDays(new Date(), 90);

		const where = integrationId
			? {
					calendarIntegrationId: integrationId,
					startTime: { lt: cutoffDate },
				}
			: {
					startTime: { lt: cutoffDate },
				};

		const result = await this.prismaClient.calendarEvent.deleteMany({
			where,
		});

		log.debug("Cleaned up old calendar events", {
			integrationId,
			deletedCount: result.count,
		});

		return result.count;
	}
}


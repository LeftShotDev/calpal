/**
 * Calendar Sync Job
 *
 * Syncs calendar events for all active calendar integrations
 * Runs periodically (every 5 minutes) via cron
 */

import { prisma } from "@calcom/prisma";
import logger from "@calcom/lib/logger";
import { CalendarSyncService } from "../services/CalendarSyncService";
import { CalendarAuthService } from "../services/CalendarAuthService";

const log = logger.getSubLogger({ prefix: ["calendar/syncJob"] });

export interface SyncJobResult {
	integrationsProcessed: number;
	integrationsSynced: number;
	integrationsFailed: number;
	eventsSynced: number;
}

/**
 * Sync all active calendar integrations
 */
export async function syncAllCalendars(): Promise<SyncJobResult> {
	const result: SyncJobResult = {
		integrationsProcessed: 0,
		integrationsSynced: 0,
		integrationsFailed: 0,
		eventsSynced: 0,
	};

	try {
		// Get all active integrations
		const integrations = await prisma.calendarIntegration.findMany({
			where: {
				syncStatus: "active",
			},
			select: {
				id: true,
				userId: true,
				calendarId: true,
				syncToken: true,
			},
		});

		log.debug("Found active calendar integrations", { count: integrations.length });

		const syncService = new CalendarSyncService();
		const authService = new CalendarAuthService();

		for (const integration of integrations) {
			result.integrationsProcessed++;

			try {
				// Ensure token is valid (refresh if needed)
				await authService.ensureValidToken(integration.id);

				// Get OAuth client
				const oAuthClient = await authService.getOAuthClient(integration.id);

				// Perform incremental sync
				const syncResult = await syncService.performIncrementalSync(integration.id, oAuthClient);

				if (!syncResult.hasError) {
					result.integrationsSynced++;
					result.eventsSynced += syncResult.eventsSynced;
					log.debug("Successfully synced calendar", {
						integrationId: integration.id,
						eventsSynced: syncResult.eventsSynced,
					});
				} else {
					result.integrationsFailed++;
					log.error("Sync failed for integration", {
						integrationId: integration.id,
						error: syncResult.errorMessage,
					});
				}
			} catch (error) {
				result.integrationsFailed++;
				log.error("Error syncing calendar integration", {
					integrationId: integration.id,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		// Cleanup old events (run once per job execution)
		await syncService.cleanupOldEvents();

		log.info("Calendar sync job completed", result);
		return result;
	} catch (error) {
		log.error("Fatal error in calendar sync job", { error });
		throw error;
	}
}


/**
 * Data Retention Job
 *
 * Automatically deletes bookings older than 1 year
 * Runs periodically via cron
 */

import { prisma } from "@calcom/prisma";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["bookings/dataRetentionJob"] });

export interface DataRetentionJobResult {
	bookingsDeleted: number;
	bookingsProcessed: number;
}

/**
 * Delete bookings older than 1 year
 */
export async function cleanupOldBookings(): Promise<DataRetentionJobResult> {
	const result: DataRetentionJobResult = {
		bookingsDeleted: 0,
		bookingsProcessed: 0,
	};

	try {
		// Calculate cutoff date (1 year ago)
		const oneYearAgo = new Date();
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

		log.debug("Starting data retention cleanup", { cutoffDate: oneYearAgo });

		// Find bookings older than 1 year
		const oldBookings = await prisma.booking.findMany({
			where: {
				endTime: {
					lt: oneYearAgo,
				},
			},
			select: {
				id: true,
				uid: true,
				startTime: true,
				endTime: true,
			},
		});

		result.bookingsProcessed = oldBookings.length;

		if (oldBookings.length === 0) {
			log.debug("No old bookings to delete");
			return result;
		}

		// Delete bookings in batches to avoid overwhelming the database
		const batchSize = 100;
		for (let i = 0; i < oldBookings.length; i += batchSize) {
			const batch = oldBookings.slice(i, i + batchSize);
			const bookingIds = batch.map((b) => b.id);

			// Delete bookings (cascade will handle related records)
			const deleteResult = await prisma.booking.deleteMany({
				where: {
					id: {
						in: bookingIds,
					},
				},
			});

			result.bookingsDeleted += deleteResult.count;

			log.debug("Deleted batch of old bookings", {
				batchSize: batch.length,
				deleted: deleteResult.count,
			});
		}

		log.info("Data retention cleanup completed", result);
		return result;
	} catch (error) {
		log.error("Error in data retention cleanup", { error });
		throw error;
	}
}


/**
 * Availability Block Service for minimal scheduling application
 *
 * Manages availability blocks (time windows when admin is available):
 * - Create availability blocks
 * - Update availability blocks
 * - Delete availability blocks
 * - List availability blocks by user
 * - Validate availability block data
 */

import { prisma } from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["AvailabilityBlockService"] });

export interface CreateAvailabilityBlockInput {
	userId: number;
	dayOfWeek: number; // 0=Sunday, 6=Saturday
	startTime: Date; // Time only (HH:mm:ss)
	endTime: Date; // Time only (HH:mm:ss)
	timezone: string; // IANA timezone identifier
	isActive?: boolean;
}

export interface UpdateAvailabilityBlockInput {
	id: string;
	dayOfWeek?: number;
	startTime?: Date;
	endTime?: Date;
	timezone?: string;
	isActive?: boolean;
}

export class AvailabilityBlockService {
	constructor(private readonly prismaClient: PrismaClient = prisma) { }

	/**
	 * Create a new availability block
	 * @param input - Availability block data
	 * @returns Created availability block
	 */
	async create(input: CreateAvailabilityBlockInput) {
		this.validateAvailabilityBlock(input);

		const block = await this.prismaClient.availabilityBlock.create({
			data: {
				userId: input.userId,
				dayOfWeek: input.dayOfWeek,
				startTime: input.startTime,
				endTime: input.endTime,
				timezone: input.timezone,
				isActive: input.isActive ?? true,
			},
		});

		log.debug("Created availability block", { blockId: block.id, userId: input.userId });
		return block;
	}

	/**
	 * Update an existing availability block
	 * @param input - Update data
	 * @returns Updated availability block
	 */
	async update(input: UpdateAvailabilityBlockInput) {
		const { id, ...updateData } = input;

		// Get existing block to validate
		const existingBlock = await this.prismaClient.availabilityBlock.findUnique({
			where: { id },
		});

		if (!existingBlock) {
			throw new Error(`Availability block not found: ${id}`);
		}

		// Validate if time fields are being updated
		if (updateData.startTime || updateData.endTime || updateData.dayOfWeek || updateData.timezone) {
			const validationData: CreateAvailabilityBlockInput = {
				userId: existingBlock.userId,
				dayOfWeek: updateData.dayOfWeek ?? existingBlock.dayOfWeek,
				startTime: updateData.startTime ?? existingBlock.startTime,
				endTime: updateData.endTime ?? existingBlock.endTime,
				timezone: updateData.timezone ?? existingBlock.timezone,
			};
			this.validateAvailabilityBlock(validationData);
		}

		const block = await this.prismaClient.availabilityBlock.update({
			where: { id },
			data: updateData,
		});

		log.debug("Updated availability block", { blockId: block.id });
		return block;
	}

	/**
	 * Delete an availability block
	 * @param id - Availability block ID
	 * @param userId - User ID (for authorization)
	 */
	async delete(id: string, userId: number) {
		// Verify ownership
		const block = await this.prismaClient.availabilityBlock.findUnique({
			where: { id },
		});

		if (!block) {
			throw new Error(`Availability block not found: ${id}`);
		}

		if (block.userId !== userId) {
			throw new Error("Unauthorized: You can only delete your own availability blocks");
		}

		await this.prismaClient.availabilityBlock.delete({
			where: { id },
		});

		log.debug("Deleted availability block", { blockId: id, userId });
	}

	/**
	 * List availability blocks for a user
	 * @param userId - User ID
	 * @param includeInactive - Whether to include inactive blocks
	 * @returns List of availability blocks
	 */
	async listByUser(userId: number, includeInactive: boolean = false) {
		const blocks = await this.prismaClient.availabilityBlock.findMany({
			where: {
				userId,
				...(includeInactive ? {} : { isActive: true }),
			},
			orderBy: [
				{ dayOfWeek: "asc" },
				{ startTime: "asc" },
			],
		});

		return blocks;
	}

	/**
	 * Validate availability block data
	 * @param input - Availability block data to validate
	 */
	private validateAvailabilityBlock(input: CreateAvailabilityBlockInput) {
		// Validate dayOfWeek (0-6)
		if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
			throw new Error("dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
		}

		// Validate timezone (basic check - should be IANA timezone)
		if (!input.timezone || typeof input.timezone !== "string") {
			throw new Error("timezone is required and must be a valid IANA timezone identifier");
		}

		// Validate startTime and endTime are Date objects
		if (!(input.startTime instanceof Date) || !(input.endTime instanceof Date)) {
			throw new Error("startTime and endTime must be Date objects");
		}

		// Extract time components for comparison
		const startHours = input.startTime.getHours();
		const startMinutes = input.startTime.getMinutes();
		const startSeconds = input.startTime.getSeconds();
		const startTimeMs = startHours * 3600000 + startMinutes * 60000 + startSeconds * 1000;

		const endHours = input.endTime.getHours();
		const endMinutes = input.endTime.getMinutes();
		const endSeconds = input.endTime.getSeconds();
		const endTimeMs = endHours * 3600000 + endMinutes * 60000 + endSeconds * 1000;

		// Validate endTime is after startTime
		if (endTimeMs <= startTimeMs) {
			throw new Error("endTime must be after startTime");
		}

		// Validate time range is reasonable (not more than 24 hours)
		const durationMs = endTimeMs - startTimeMs;
		if (durationMs > 24 * 3600000) {
			throw new Error("Availability block duration cannot exceed 24 hours");
		}
	}
}


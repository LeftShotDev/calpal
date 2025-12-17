/**
 * Minimal Scheduler Availability Block Handlers
 *
 * Handlers for availability block management (User Story 3)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AvailabilityBlockService } from "@calcom/features/availability/services/AvailabilityBlockService";

// Input schemas
export const ZListAvailabilityBlocksInputSchema = z.object({
	includeInactive: z.boolean().optional().default(false),
});

export const ZCreateAvailabilityBlockInputSchema = z.object({
	dayOfWeek: z.number().int().min(0).max(6),
	startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "startTime must be in HH:MM:SS format"),
	endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "endTime must be in HH:MM:SS format"),
	timezone: z.string().min(1, "timezone is required"),
	isActive: z.boolean().optional().default(true),
});

export const ZUpdateAvailabilityBlockInputSchema = z.object({
	id: z.string().uuid(),
	dayOfWeek: z.number().int().min(0).max(6).optional(),
	startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "startTime must be in HH:MM:SS format").optional(),
	endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "endTime must be in HH:MM:SS format").optional(),
	timezone: z.string().min(1, "timezone is required").optional(),
	isActive: z.boolean().optional(),
});

export const ZDeleteAvailabilityBlockInputSchema = z.object({
	id: z.string().uuid(),
});

// Helper function to convert time string to Date
function timeStringToDate(timeString: string): Date {
	const [hours, minutes, seconds] = timeString.split(":").map(Number);
	const date = new Date();
	date.setHours(hours, minutes, seconds || 0, 0);
	return date;
}

// Handlers
export async function listAvailabilityBlocksHandler({
	ctx,
	input,
}: {
	ctx: { user: { id: number } | null };
	input: z.infer<typeof ZListAvailabilityBlocksInputSchema>;
}) {
	if (!ctx.user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const service = new AvailabilityBlockService();
	const blocks = await service.listByUser(ctx.user.id, input.includeInactive);

	return {
		blocks: blocks.map((block) => ({
			id: block.id,
			dayOfWeek: block.dayOfWeek,
			startTime: formatTime(block.startTime),
			endTime: formatTime(block.endTime),
			timezone: block.timezone,
			isActive: block.isActive,
			createdAt: block.createdAt.toISOString(),
			updatedAt: block.updatedAt.toISOString(),
		})),
	};
}

export async function createAvailabilityBlockHandler({
	ctx,
	input,
}: {
	ctx: { user: { id: number } | null };
	input: z.infer<typeof ZCreateAvailabilityBlockInputSchema>;
}) {
	if (!ctx.user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const service = new AvailabilityBlockService();

	try {
		const block = await service.create({
			userId: ctx.user.id,
			dayOfWeek: input.dayOfWeek,
			startTime: timeStringToDate(input.startTime),
			endTime: timeStringToDate(input.endTime),
			timezone: input.timezone,
			isActive: input.isActive,
		});

		return {
			block: {
				id: block.id,
				dayOfWeek: block.dayOfWeek,
				startTime: formatTime(block.startTime),
				endTime: formatTime(block.endTime),
				timezone: block.timezone,
				isActive: block.isActive,
				createdAt: block.createdAt.toISOString(),
				updatedAt: block.updatedAt.toISOString(),
			},
		};
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: error instanceof Error ? error.message : "Failed to create availability block",
		});
	}
}

export async function updateAvailabilityBlockHandler({
	ctx,
	input,
}: {
	ctx: { user: { id: number } | null };
	input: z.infer<typeof ZUpdateAvailabilityBlockInputSchema>;
}) {
	if (!ctx.user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const service = new AvailabilityBlockService();

	try {
		const updateData: {
			id: string;
			dayOfWeek?: number;
			startTime?: Date;
			endTime?: Date;
			timezone?: string;
			isActive?: boolean;
		} = {
			id: input.id,
		};

		if (input.dayOfWeek !== undefined) {
			updateData.dayOfWeek = input.dayOfWeek;
		}
		if (input.startTime !== undefined) {
			updateData.startTime = timeStringToDate(input.startTime);
		}
		if (input.endTime !== undefined) {
			updateData.endTime = timeStringToDate(input.endTime);
		}
		if (input.timezone !== undefined) {
			updateData.timezone = input.timezone;
		}
		if (input.isActive !== undefined) {
			updateData.isActive = input.isActive;
		}

		const block = await service.update(updateData);

		return {
			block: {
				id: block.id,
				dayOfWeek: block.dayOfWeek,
				startTime: formatTime(block.startTime),
				endTime: formatTime(block.endTime),
				timezone: block.timezone,
				isActive: block.isActive,
				createdAt: block.createdAt.toISOString(),
				updatedAt: block.updatedAt.toISOString(),
			},
		};
	} catch (error) {
		throw new TRPCError({
			code: error instanceof Error && error.message.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST",
			message: error instanceof Error ? error.message : "Failed to update availability block",
		});
	}
}

export async function deleteAvailabilityBlockHandler({
	ctx,
	input,
}: {
	ctx: { user: { id: number } | null };
	input: z.infer<typeof ZDeleteAvailabilityBlockInputSchema>;
}) {
	if (!ctx.user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const service = new AvailabilityBlockService();

	try {
		await service.delete(input.id, ctx.user.id);
		return { success: true };
	} catch (error) {
		throw new TRPCError({
			code: error instanceof Error && error.message.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST",
			message: error instanceof Error ? error.message : "Failed to delete availability block",
		});
	}
}

// Helper function to format Date to time string
function formatTime(date: Date): string {
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const seconds = date.getSeconds().toString().padStart(2, "0");
	return `${hours}:${minutes}:${seconds}`;
}


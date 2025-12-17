/**
 * Video router for minimal scheduling application
 *
 * Handles video conferencing link generation:
 * - Google Meet links (via calendar event creation)
 * - Zoom meeting links (via Zoom API)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { VideoService } from "@calcom/features/video/services/VideoService";

// Input schemas
const generateGoogleMeetLinkInputSchema = z.object({
	topic: z.string().min(1, "Topic is required"),
	startTime: z.string().datetime().optional(),
	duration: z.number().int().positive().optional(),
	timezone: z.string().optional(),
});

const generateZoomLinkInputSchema = z.object({
	topic: z.string().min(1, "Topic is required"),
	startTime: z.string().datetime().optional(),
	duration: z.number().int().positive().optional(),
	timezone: z.string().optional(),
	zoomAccountId: z.string().min(1, "Zoom account ID is required"),
	zoomClientId: z.string().min(1, "Zoom client ID is required"),
	zoomClientSecret: z.string().min(1, "Zoom client secret is required"),
});

export const videoRouter = router({
	/**
	 * Generate Google Meet link
	 * Note: Actual link generation happens during calendar event creation
	 * This endpoint returns a placeholder
	 */
	generateGoogleMeetLink: authedProcedure
		.input(generateGoogleMeetLinkInputSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Not authenticated",
				});
			}

			const videoService = new VideoService();

			try {
				const result = await videoService.generateLink({
					provider: "google-meet",
					topic: input.topic,
					startTime: input.startTime ? new Date(input.startTime) : undefined,
					duration: input.duration,
					timezone: input.timezone,
				});

				if (!result) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to generate Google Meet link",
					});
				}

				return {
					meetingUrl: result.meetingUrl,
					meetingId: result.meetingId,
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to generate Google Meet link",
				});
			}
		}),

	/**
	 * Generate Zoom meeting link
	 */
	generateZoomLink: authedProcedure.input(generateZoomLinkInputSchema).mutation(async ({ ctx, input }) => {
		if (!ctx.user?.id) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Not authenticated",
			});
		}

		const videoService = new VideoService();

		try {
			const result = await videoService.generateLink({
				provider: "zoom",
				topic: input.topic,
				startTime: input.startTime ? new Date(input.startTime) : undefined,
				duration: input.duration,
				timezone: input.timezone,
				zoomAccountId: input.zoomAccountId,
				zoomClientId: input.zoomClientId,
				zoomClientSecret: input.zoomClientSecret,
			});

			if (!result) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate Zoom link",
				});
			}

			return {
				meetingUrl: result.meetingUrl,
				meetingId: result.meetingId,
				password: result.password,
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: error instanceof Error ? error.message : "Failed to generate Zoom link",
			});
		}
	}),
});


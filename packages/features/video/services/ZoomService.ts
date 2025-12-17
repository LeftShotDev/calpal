/**
 * Zoom Service for minimal scheduling application
 *
 * Generates Zoom meeting links using Zoom API
 */

import { ZoomClient } from "@calcom/lib/video/ZoomClient";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["ZoomService"] });

export interface ZoomLinkResult {
	meetingUrl: string;
	meetingId?: string;
	password?: string;
}

export interface GenerateZoomLinkInput {
	topic: string;
	startTime?: Date;
	duration?: number; // minutes
	timezone?: string;
}

export class ZoomService {
	private zoomClient: ZoomClient | null = null;

	/**
	 * Initialize Zoom client with credentials
	 * @param accountId - Zoom account ID
	 * @param clientId - Zoom client ID
	 * @param clientSecret - Zoom client secret
	 */
	initialize(accountId: string, clientId: string, clientSecret: string) {
		this.zoomClient = new ZoomClient(accountId, clientId, clientSecret);
	}

	/**
	 * Generate Zoom meeting link
	 * @param input - Meeting details
	 * @returns Zoom meeting link result
	 */
	async generateLink(input: GenerateZoomLinkInput): Promise<ZoomLinkResult> {
		if (!this.zoomClient) {
			throw new Error("Zoom client not initialized. Call initialize() first.");
		}

		try {
			const meeting = await this.zoomClient.createMeeting({
				topic: input.topic,
				start_time: input.startTime?.toISOString(),
				duration: input.duration || 30,
				timezone: input.timezone || "UTC",
				settings: {
					host_video: true,
					participant_video: true,
					waiting_room: false,
				},
			});

			log.debug("Zoom meeting created", { meetingId: meeting.id });

			return {
				meetingUrl: meeting.join_url,
				meetingId: meeting.id,
				password: meeting.password,
			};
		} catch (error) {
			log.error("Error generating Zoom link", { error });
			throw error;
		}
	}

	/**
	 * Delete a Zoom meeting
	 * @param meetingId - Zoom meeting ID
	 */
	async deleteMeeting(meetingId: string): Promise<void> {
		if (!this.zoomClient) {
			throw new Error("Zoom client not initialized. Call initialize() first.");
		}

		try {
			await this.zoomClient.deleteMeeting(meetingId);
		} catch (error) {
			log.error("Error deleting Zoom meeting", { error, meetingId });
			throw error;
		}
	}
}


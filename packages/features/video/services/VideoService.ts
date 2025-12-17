/**
 * Video Service for minimal scheduling application
 *
 * Coordinates video conferencing link generation for Google Meet and Zoom
 */

import logger from "@calcom/lib/logger";
import { GoogleMeetService } from "./GoogleMeetService";
import { ZoomService } from "./ZoomService";

const log = logger.getSubLogger({ prefix: ["VideoService"] });

export type VideoProvider = "google-meet" | "zoom";

export interface VideoLinkResult {
	provider: VideoProvider;
	meetingUrl: string;
	meetingId?: string;
	password?: string;
}

export interface GenerateVideoLinkInput {
	provider: VideoProvider;
	topic: string;
	startTime?: Date;
	duration?: number; // minutes
	timezone?: string;
	// Zoom-specific credentials (if needed)
	zoomAccountId?: string;
	zoomClientId?: string;
	zoomClientSecret?: string;
}

export class VideoService {
	private googleMeetService: GoogleMeetService;
	private zoomService: ZoomService;

	constructor() {
		this.googleMeetService = new GoogleMeetService();
		this.zoomService = new ZoomService();
	}

	/**
	 * Generate video conferencing link
	 * @param input - Video link generation parameters
	 * @returns Video link result
	 */
	async generateLink(input: GenerateVideoLinkInput): Promise<VideoLinkResult | null> {
		try {
			switch (input.provider) {
				case "google-meet": {
					// Google Meet links are generated via calendar event creation
					// This method returns a placeholder that will be replaced
					const meetResult = await this.googleMeetService.generateLink();
					return {
						provider: "google-meet",
						meetingUrl: meetResult.meetingUrl,
						meetingId: meetResult.conferenceId,
					};
				}

				case "zoom": {
					// Initialize Zoom service if credentials provided
					if (input.zoomAccountId && input.zoomClientId && input.zoomClientSecret) {
						this.zoomService.initialize(
							input.zoomAccountId,
							input.zoomClientId,
							input.zoomClientSecret
						);
					}

					const zoomResult = await this.zoomService.generateLink({
						topic: input.topic,
						startTime: input.startTime,
						duration: input.duration,
						timezone: input.timezone,
					});

					return {
						provider: "zoom",
						meetingUrl: zoomResult.meetingUrl,
						meetingId: zoomResult.meetingId,
						password: zoomResult.password,
					};
				}

				default:
					log.warn("Unknown video provider", { provider: input.provider });
					return null;
			}
		} catch (error) {
			// Handle failures gracefully - booking can complete without video link
			log.error("Error generating video link", {
				error,
				provider: input.provider,
				topic: input.topic,
			});
			return null;
		}
	}

	/**
	 * Extract Google Meet link from calendar event
	 * @param hangoutLink - Hangout link from Google Calendar event
	 * @returns Video link result or null
	 */
	static extractGoogleMeetLink(hangoutLink?: string): VideoLinkResult | null {
		if (!hangoutLink) {
			return null;
		}

		const result = GoogleMeetService.extractLinkFromEvent(hangoutLink);
		if (!result) {
			return null;
		}

		return {
			provider: "google-meet",
			meetingUrl: result.meetingUrl,
			meetingId: result.conferenceId,
		};
	}

	/**
	 * Delete a Zoom meeting
	 * @param meetingId - Zoom meeting ID
	 * @param zoomAccountId - Zoom account ID
	 * @param zoomClientId - Zoom client ID
	 * @param zoomClientSecret - Zoom client secret
	 */
	async deleteZoomMeeting(
		meetingId: string,
		zoomAccountId: string,
		zoomClientId: string,
		zoomClientSecret: string
	): Promise<void> {
		try {
			this.zoomService.initialize(zoomAccountId, zoomClientId, zoomClientSecret);
			await this.zoomService.deleteMeeting(meetingId);
		} catch (error) {
			log.error("Error deleting Zoom meeting", { error, meetingId });
			// Don't throw - deletion failure shouldn't block booking cancellation
		}
	}
}


/**
 * Google Meet Service for minimal scheduling application
 *
 * Generates Google Meet links using Google Calendar API conferenceData
 */

import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["GoogleMeetService"] });

export interface GoogleMeetLinkResult {
	meetingUrl: string;
	conferenceId?: string;
}

export class GoogleMeetService {
	/**
	 * Generate Google Meet link
	 * Note: The actual link generation happens when creating a calendar event
	 * with conferenceData. This method returns a placeholder that will be
	 * replaced with the actual link from the calendar event.
	 *
	 * @returns Placeholder result (actual link comes from calendar event creation)
	 */
	async generateLink(): Promise<GoogleMeetLinkResult> {
		log.debug("Google Meet link will be generated via calendar event creation");

		// Return placeholder - actual link comes from calendar event creation
		// The GoogleCalendarClient.createEvent method handles conferenceData
		return {
			meetingUrl: "", // Will be populated from calendar event
		};
	}

	/**
	 * Extract Google Meet link from calendar event
	 * @param hangoutLink - Hangout link from Google Calendar event
	 * @returns Google Meet link result
	 */
	static extractLinkFromEvent(hangoutLink?: string): GoogleMeetLinkResult | null {
		if (!hangoutLink) {
			return null;
		}

		return {
			meetingUrl: hangoutLink,
		};
	}
}


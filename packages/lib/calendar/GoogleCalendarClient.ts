/**
 * Simplified Google Calendar API v3 client for minimal scheduling application
 *
 * This client provides essential operations for calendar integration:
 * - List events with incremental sync using syncToken
 * - Create events
 * - Delete events
 * - Generate Google Meet links via conferenceData
 */

import { calendar_v3 } from "@googleapis/calendar";
import type { OAuth2Client } from "googleapis-common";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["lib/calendar/GoogleCalendarClient"] });

export interface GoogleCalendarEvent {
	id: string;
	start: { dateTime?: string; date?: string; timeZone?: string };
	end: { dateTime?: string; date?: string; timeZone?: string };
	summary?: string;
	description?: string;
	hangoutLink?: string;
	iCalUID?: string;
}

export interface SyncEventsResult {
	events: GoogleCalendarEvent[];
	nextSyncToken?: string;
	hasMore: boolean;
}

export class GoogleCalendarClient {
	private calendar: calendar_v3.Calendar;
	private log: typeof logger;

	constructor(authClient: OAuth2Client) {
		this.calendar = new calendar_v3.Calendar({ auth: authClient });
		this.log = log.getSubLogger({ prefix: ["GoogleCalendarClient"] });
	}

	/**
	 * List calendar events with incremental sync support
	 * @param calendarId - Calendar ID (use "primary" for primary calendar)
	 * @param syncToken - Optional sync token for incremental sync
	 * @param timeMin - Optional minimum time for initial sync
	 * @param timeMax - Optional maximum time for initial sync
	 * @returns Events and next sync token
	 */
	async listEvents(
		calendarId: string = "primary",
		options?: {
			syncToken?: string;
			timeMin?: string;
			timeMax?: string;
			maxResults?: number;
		}
	): Promise<SyncEventsResult> {
		try {
			const params: calendar_v3.Params$Resource$Events$List = {
				calendarId,
				singleEvents: true,
				maxResults: options?.maxResults || 2500,
			};

			// Use syncToken for incremental sync, or timeMin/timeMax for initial sync
			if (options?.syncToken) {
				params.syncToken = options.syncToken;
			} else if (options?.timeMin && options?.timeMax) {
				params.timeMin = options.timeMin;
				params.timeMax = options.timeMax;
			} else {
				// Default: sync last 3 months and future 3 months
				const now = new Date();
				const threeMonthsAgo = new Date(now);
				threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
				const threeMonthsAhead = new Date(now);
				threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

				params.timeMin = threeMonthsAgo.toISOString();
				params.timeMax = threeMonthsAhead.toISOString();
			}

			const events: GoogleCalendarEvent[] = [];
			let pageToken: string | undefined;
			let nextSyncToken: string | undefined;

			do {
				if (pageToken) {
					params.pageToken = pageToken;
				}

				const response = await this.calendar.events.list(params);

				if (response.data.items) {
					events.push(...response.data.items.map(this.mapEvent));
				}

				// Store sync token for next incremental sync
				nextSyncToken = response.data.nextSyncToken || nextSyncToken;
				pageToken = response.data.nextPageToken || undefined;
			} while (pageToken);

			return {
				events,
				nextSyncToken,
				hasMore: false, // All pages fetched
			};
		} catch (error) {
			this.log.error("Error listing calendar events", { error, calendarId });
			throw error;
		}
	}

	/**
	 * Create a calendar event
	 * @param calendarId - Calendar ID (use "primary" for primary calendar)
	 * @param event - Event data
	 * @param generateMeetLink - Whether to generate Google Meet link
	 * @returns Created event with ID and hangout link
	 */
	async createEvent(
		calendarId: string = "primary",
		event: {
			summary: string;
			description?: string;
			start: { dateTime: string; timeZone: string };
			end: { dateTime: string; timeZone: string };
			attendees?: Array<{ email: string; displayName?: string }>;
		},
		generateMeetLink: boolean = false
	): Promise<GoogleCalendarEvent> {
		try {
			const payload: calendar_v3.Schema$Event = {
				summary: event.summary,
				description: event.description,
				start: {
					dateTime: event.start.dateTime,
					timeZone: event.start.timeZone,
				},
				end: {
					dateTime: event.end.dateTime,
					timeZone: event.end.timeZone,
				},
				attendees: event.attendees?.map((a) => ({
					email: a.email,
					displayName: a.displayName,
				})),
				reminders: {
					useDefault: true,
				},
			};

			// Generate Google Meet link if requested
			if (generateMeetLink) {
				payload.conferenceData = {
					createRequest: {
						requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
						conferenceSolutionKey: {
							type: "hangoutsMeet",
						},
					},
				};
			}

			const response = await this.calendar.events.insert({
				calendarId,
				requestBody: payload,
				conferenceDataVersion: generateMeetLink ? 1 : 0,
				sendUpdates: "none",
			});

			return this.mapEvent(response.data);
		} catch (error) {
			this.log.error("Error creating calendar event", { error, calendarId });
			throw error;
		}
	}

	/**
	 * Delete a calendar event
	 * @param calendarId - Calendar ID
	 * @param eventId - Event ID to delete
	 */
	async deleteEvent(calendarId: string = "primary", eventId: string): Promise<void> {
		try {
			await this.calendar.events.delete({
				calendarId,
				eventId,
				sendUpdates: "none",
			});
		} catch (error) {
			const err = error as { code?: number };
			// 404 means event already deleted, 410 means event was already deleted
			if (err.code === 404 || err.code === 410) {
				this.log.debug("Event already deleted", { calendarId, eventId });
				return;
			}
			this.log.error("Error deleting calendar event", { error, calendarId, eventId });
			throw error;
		}
	}

	/**
	 * Get primary calendar ID
	 * @returns Primary calendar ID
	 */
	async getPrimaryCalendarId(): Promise<string> {
		try {
			const response = await this.calendar.calendarList.list({
				minAccessRole: "owner",
			});

			const calendars = response.data.items || [];
			const primary = calendars.find((cal) => cal.primary) || calendars[0];

			if (!primary?.id) {
				throw new Error("No primary calendar found");
			}

			return primary.id;
		} catch (error) {
			this.log.error("Error getting primary calendar", { error });
			throw error;
		}
	}

	/**
	 * Map Google Calendar API event to our simplified format
	 */
	private mapEvent(event: calendar_v3.Schema$Event): GoogleCalendarEvent {
		return {
			id: event.id || "",
			start: event.start || {},
			end: event.end || {},
			summary: event.summary,
			description: event.description || undefined,
			hangoutLink: event.hangoutLink || undefined,
			iCalUID: event.iCalUID || undefined,
		};
	}
}


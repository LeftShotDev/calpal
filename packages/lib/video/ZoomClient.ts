/**
 * Zoom API Client for minimal scheduling application
 *
 * Handles Server-to-Server OAuth and meeting creation
 */

import axios, { AxiosInstance } from "axios";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["ZoomClient"] });

export interface ZoomMeeting {
	id: string;
	join_url: string;
	start_url: string;
	password?: string;
	settings?: {
		host_video?: boolean;
		participant_video?: boolean;
		waiting_room?: boolean;
	};
}

export interface CreateZoomMeetingInput {
	topic: string;
	start_time?: string; // ISO 8601 format
	duration?: number; // minutes
	timezone?: string;
	settings?: {
		host_video?: boolean;
		participant_video?: boolean;
		waiting_room?: boolean;
	};
}

export interface ZoomTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

export class ZoomClient {
	private axiosInstance: AxiosInstance;
	private accessToken?: string;
	private tokenExpiresAt?: Date;

	constructor(
		private readonly accountId: string,
		private readonly clientId: string,
		private readonly clientSecret: string
	) {
		this.axiosInstance = axios.create({
			baseURL: "https://api.zoom.us/v2",
		});
	}

	/**
	 * Get access token using Server-to-Server OAuth
	 */
	private async getAccessToken(): Promise<string> {
		// Check if token is still valid
		if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
			return this.accessToken;
		}

		try {
			const response = await axios.post<ZoomTokenResponse>(
				`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`,
				{},
				{
					auth: {
						username: this.clientId,
						password: this.clientSecret,
					},
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			);

			this.accessToken = response.data.access_token;
			// Set expiration 5 minutes before actual expiration for safety
			const expiresIn = response.data.expires_in - 300;
			this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

			log.debug("Zoom access token obtained", { expiresIn });
			return this.accessToken;
		} catch (error) {
			log.error("Error obtaining Zoom access token", { error });
			throw new Error("Failed to obtain Zoom access token");
		}
	}

	/**
	 * Create a Zoom meeting
	 * @param input - Meeting details
	 * @returns Created meeting with join URL
	 */
	async createMeeting(input: CreateZoomMeetingInput): Promise<ZoomMeeting> {
		try {
			const token = await this.getAccessToken();

			const response = await this.axiosInstance.post<ZoomMeeting>(
				"/users/me/meetings",
				{
					topic: input.topic,
					type: 2, // Scheduled meeting
					start_time: input.start_time,
					duration: input.duration || 30,
					timezone: input.timezone || "UTC",
					settings: {
						host_video: input.settings?.host_video ?? true,
						participant_video: input.settings?.participant_video ?? true,
						waiting_room: input.settings?.waiting_room ?? false,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			log.debug("Zoom meeting created", { meetingId: response.data.id });
			return response.data;
		} catch (error) {
			log.error("Error creating Zoom meeting", { error });
			throw error;
		}
	}

	/**
	 * Get meeting details
	 * @param meetingId - Zoom meeting ID
	 * @returns Meeting details
	 */
	async getMeeting(meetingId: string): Promise<ZoomMeeting> {
		try {
			const token = await this.getAccessToken();

			const response = await this.axiosInstance.get<ZoomMeeting>(`/meetings/${meetingId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			return response.data;
		} catch (error) {
			log.error("Error getting Zoom meeting", { error, meetingId });
			throw error;
		}
	}

	/**
	 * Delete a Zoom meeting
	 * @param meetingId - Zoom meeting ID
	 */
	async deleteMeeting(meetingId: string): Promise<void> {
		try {
			const token = await this.getAccessToken();

			await this.axiosInstance.delete(`/meetings/${meetingId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			log.debug("Zoom meeting deleted", { meetingId });
		} catch (error) {
			const err = error as { response?: { status?: number } };
			// 404 means meeting already deleted
			if (err.response?.status === 404) {
				log.debug("Zoom meeting already deleted", { meetingId });
				return;
			}
			log.error("Error deleting Zoom meeting", { error, meetingId });
			throw error;
		}
	}
}


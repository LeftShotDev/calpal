/**
 * Email notification service for minimal scheduling application
 *
 * Uses existing Cal.com email infrastructure (SMTP/Resend/SendGrid)
 * Provides simplified email sending for booking notifications
 */

import type BaseEmail from "@calcom/emails/templates/_base-email";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["lib/email/notifications"] });

/**
 * Send an email using Cal.com's BaseEmail infrastructure
 * @param emailInstance - Instance of BaseEmail subclass
 * @internal - Will be used when email templates are implemented
 */

async function _sendEmail(emailInstance: BaseEmail): Promise<void> {
	try {
		await emailInstance.sendEmail();
		log.debug("Email sent successfully", { emailType: emailInstance.name });
	} catch (error) {
		log.error("Failed to send email", { error, emailType: emailInstance.name });
		// Don't throw - email failures shouldn't break booking flow
		// Log error for monitoring but allow operation to continue
	}
}

/**
 * Send pending booking confirmation to user
 * @param attendeeEmail - Email address of the person who booked
 * @param attendeeName - Name of the person who booked
 * @param bookingDetails - Booking information
 */
export async function sendPendingBookingConfirmation(
	attendeeEmail: string,
	attendeeName: string,
	bookingDetails: {
		startTime: Date;
		endTime: Date;
		timezone: string;
		adminName: string;
	}
): Promise<void> {
	// TODO: Create PendingBookingConfirmationEmail template extending BaseEmail
	// For now, this is a placeholder that will be implemented when creating email templates
	log.info("Pending booking confirmation email would be sent", {
		attendeeEmail,
		attendeeName,
		bookingDetails,
	});

	// Placeholder - actual implementation will use BaseEmail template
	// await sendEmail(new PendingBookingConfirmationEmail({ ... }));
}

/**
 * Notify admin of pending booking requiring approval
 * @param adminEmail - Admin's email address
 * @param adminName - Admin's name
 * @param bookingDetails - Booking information
 */
export async function notifyAdminOfPendingBooking(
	adminEmail: string,
	adminName: string,
	bookingDetails: {
		bookingId: string;
		attendeeName: string;
		attendeeEmail: string;
		startTime: Date;
		endTime: Date;
		timezone: string;
		notes?: string;
	}
): Promise<void> {
	// TODO: Create AdminPendingBookingNotificationEmail template extending BaseEmail
	log.info("Admin notification email would be sent", {
		adminEmail,
		adminName,
		bookingDetails,
	});

	// Placeholder - actual implementation will use BaseEmail template
	// await sendEmail(new AdminPendingBookingNotificationEmail({ ... }));
}

/**
 * Send booking confirmation email when admin approves booking
 * @param attendeeEmail - Email address of the person who booked
 * @param attendeeName - Name of the person who booked
 * @param bookingDetails - Booking information including video link if applicable
 */
export async function sendBookingConfirmation(
	attendeeEmail: string,
	attendeeName: string,
	bookingDetails: {
		startTime: Date;
		endTime: Date;
		timezone: string;
		adminName: string;
		videoLink?: string;
		videoProvider?: "google-meet" | "zoom";
	}
): Promise<void> {
	// TODO: Create BookingConfirmationEmail template extending BaseEmail
	log.info("Booking confirmation email would be sent", {
		attendeeEmail,
		attendeeName,
		bookingDetails,
	});

	// Placeholder - actual implementation will use BaseEmail template
	// await sendEmail(new BookingConfirmationEmail({ ... }));
}

/**
 * Send booking rejection email when admin rejects booking
 * @param attendeeEmail - Email address of the person who booked
 * @param attendeeName - Name of the person who booked
 * @param bookingDetails - Booking information
 * @param rejectionReason - Optional reason for rejection
 */
export async function sendBookingRejection(
	attendeeEmail: string,
	attendeeName: string,
	bookingDetails: {
		startTime: Date;
		endTime: Date;
		timezone: string;
		adminName: string;
	},
	rejectionReason?: string
): Promise<void> {
	// TODO: Create BookingRejectionEmail template extending BaseEmail
	log.info("Booking rejection email would be sent", {
		attendeeEmail,
		attendeeName,
		bookingDetails,
		rejectionReason,
	});

	// Placeholder - actual implementation will use BaseEmail template
	// await sendEmail(new BookingRejectionEmail({ ... }));
}


/**
 * Email service utilities for minimal scheduling application
 *
 * Re-exports email notification functions
 */

export {
	sendPendingBookingConfirmation,
	notifyAdminOfPendingBooking,
	sendBookingConfirmation,
	sendBookingRejection,
} from "./notifications";


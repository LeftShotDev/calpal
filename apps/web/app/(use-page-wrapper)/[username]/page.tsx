"use client";

import { format, addDays, startOfDay } from "date-fns";
import { useEffect, useState } from "react";

import { trpc } from "app/_trpc/trpc";
import { AvailabilityDisplay, type TimeSlot } from "@calcom/ui/components/availability";
import { BookingConfirmation } from "@calcom/ui/components/booking";
import { BookingForm, type BookingFormValues } from "@calcom/ui/components/booking";
import { Alert } from "@calcom/ui/components/alert";

interface SchedulingPageProps {
	params: Promise<{ username: string }>;
}

export default function SchedulingPage({ params }: SchedulingPageProps) {
	const [resolvedParams, setResolvedParams] = useState<{ username: string } | null>(null);
	const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
	const [bookingResult, setBookingResult] = useState<{
		bookingId: string;
		status: "pending" | "confirmed" | "rejected";
		confirmationMessage: string;
	} | null>(null);
	const [userTimezone, setUserTimezone] = useState<string>("UTC");

	// Resolve params (Next.js 15+ requires async params)
	useEffect(() => {
		params.then(setResolvedParams);
	}, [params]);

	// Detect user timezone
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
				setUserTimezone(detectedTimezone);
			} catch (error) {
				console.warn("Failed to detect timezone, using UTC", error);
				setUserTimezone("UTC");
			}
		}
	}, []);

	const username = resolvedParams?.username;

	// Calculate date range (next 30 days)
	const today = startOfDay(new Date());
	const startDate = format(today, "yyyy-MM-dd");
	const endDate = format(addDays(today, 30), "yyyy-MM-dd");

	// Fetch availability
	const availabilityQuery = trpc.public.booking.getAvailability.useQuery(
		{
			username: username || "",
			startDate,
			endDate,
			timezone: userTimezone,
		},
		{
			enabled: !!username,
		}
	);

	// Create booking mutation
	const createBookingMutation = trpc.public.booking.createBooking.useMutation({
		onSuccess: (data) => {
			setBookingResult({
				bookingId: data.bookingId,
				status: data.status,
				confirmationMessage: data.confirmationMessage,
			});
			setSelectedSlot(null);
		},
		onError: (error) => {
			console.error("Booking creation failed:", error);
		},
	});

	const handleSlotSelect = (slot: TimeSlot) => {
		setSelectedSlot(slot);
		setBookingResult(null);
	};

	const handleBookingSubmit = (data: BookingFormValues, slot: TimeSlot) => {
		if (!username) return;

		createBookingMutation.mutate({
			username,
			startTime: slot.startTime,
			endTime: slot.endTime,
			attendeeName: data.attendeeName,
			attendeeEmail: data.attendeeEmail,
			notes: data.notes,
			videoProvider: data.videoProvider,
			timezone: userTimezone,
		});
	};

	const handleCloseConfirmation = () => {
		setBookingResult(null);
		setSelectedSlot(null);
	};

	if (!username) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Alert severity="error" message="Invalid username" />
			</div>
		);
	}

	if (bookingResult) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<BookingConfirmation
					bookingId={bookingResult.bookingId}
					status={bookingResult.status}
					confirmationMessage={bookingResult.confirmationMessage}
					onClose={handleCloseConfirmation}
				/>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-2">Schedule a Meeting</h1>
				<p className="text-subtle mb-8">Select an available time slot to book a meeting</p>

				{availabilityQuery.isLoading && (
					<div className="mb-8">
						<AvailabilityDisplay
							slots={[]}
							timezone={userTimezone}
							onSlotSelect={handleSlotSelect}
							isLoading={true}
						/>
					</div>
				)}

				{availabilityQuery.error && (
					<div className="mb-8">
						<Alert
							severity="error"
							message={availabilityQuery.error.message || "Failed to load availability"}
						/>
					</div>
				)}

				{availabilityQuery.data && (
					<div className="mb-8">
						<AvailabilityDisplay
							slots={availabilityQuery.data.slots}
							timezone={userTimezone}
							onSlotSelect={handleSlotSelect}
							emptyMessage={
								<div className="text-center">
									<p className="text-lg font-medium mb-2">No available time slots</p>
									<p className="text-sm text-subtle">
										Please try selecting a different date range or contact the admin directly.
									</p>
								</div>
							}
						/>
					</div>
				)}

				{selectedSlot && (
					<div className="mb-8">
						<BookingForm
							selectedSlot={selectedSlot}
							timezone={userTimezone}
							onSubmit={handleBookingSubmit}
							isSubmitting={createBookingMutation.isPending}
						/>
					</div>
				)}
			</div>
		</div>
	);
}


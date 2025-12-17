"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatInTimeZone } from "date-fns-tz";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../button";
import { Card } from "../card";
import { Form, InputField, Label, SelectField, TextAreaField } from "../form";
import type { TimeSlot } from "../availability";

const bookingFormSchema = z.object({
	attendeeName: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
	attendeeEmail: z.string().email("Invalid email address"),
	notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
	videoProvider: z.enum(["google-meet", "zoom"]).optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
	selectedSlot: TimeSlot | null;
	timezone: string;
	onSubmit: (data: BookingFormValues, slot: TimeSlot) => void;
	isSubmitting?: boolean;
}

export function BookingForm({ selectedSlot, timezone, onSubmit, isSubmitting = false }: BookingFormProps) {
	const form = useForm<BookingFormValues>({
		resolver: zodResolver(bookingFormSchema),
		defaultValues: {
			attendeeName: "",
			attendeeEmail: "",
			notes: "",
			videoProvider: undefined,
		},
	});

	if (!selectedSlot) {
		return null;
	}

	const formatDateTime = (isoString: string) => {
		const date = new Date(isoString);
		return formatInTimeZone(date, timezone, "EEEE, MMMM d, yyyy 'at' h:mm a");
	};

	const handleSubmit = (data: BookingFormValues) => {
		onSubmit(data, selectedSlot);
	};

	return (
		<Card className="p-6">
			<h2 className="text-xl font-semibold mb-4">Book Meeting</h2>
			<div className="mb-4 p-4 bg-subtle rounded-lg">
				<p className="text-sm text-subtle mb-1">Selected Time</p>
				<p className="font-medium">{formatDateTime(selectedSlot.displayStartTime)}</p>
			</div>

			<Form form={form} handleSubmit={handleSubmit}>
				<div className="space-y-4">
					<div>
						<Label htmlFor="attendeeName">
							Name <span className="text-red-500">*</span>
						</Label>
						<InputField
							{...form.register("attendeeName")}
							id="attendeeName"
							placeholder="Your name"
							required
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<Label htmlFor="attendeeEmail">
							Email <span className="text-red-500">*</span>
						</Label>
						<InputField
							{...form.register("attendeeEmail")}
							id="attendeeEmail"
							type="email"
							placeholder="your.email@example.com"
							required
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<Label htmlFor="notes">Notes (Optional)</Label>
						<TextAreaField
							{...form.register("notes")}
							id="notes"
							placeholder="Any additional information..."
							rows={4}
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<Label htmlFor="videoProvider">Video Conferencing (Optional)</Label>
						<SelectField
							{...form.register("videoProvider")}
							id="videoProvider"
							disabled={isSubmitting}
						>
							<option value="">None</option>
							<option value="google-meet">Google Meet</option>
							<option value="zoom">Zoom</option>
						</SelectField>
					</div>

					<div className="flex gap-3 pt-4">
						<Button
							type="submit"
							color="primary"
							disabled={isSubmitting}
							loading={isSubmitting}
						>
							{isSubmitting ? "Submitting..." : "Book Meeting"}
						</Button>
					</div>
				</div>
			</Form>
		</Card>
	);
}


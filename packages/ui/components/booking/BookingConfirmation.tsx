"use client";

import React from "react";

import { Card } from "../card";
import { Icon } from "../icon";

interface BookingConfirmationProps {
	bookingId: string;
	status: "pending" | "confirmed" | "rejected";
	confirmationMessage: string;
	onClose?: () => void;
}

export function BookingConfirmation({
	bookingId: _bookingId,
	status,
	confirmationMessage,
	onClose,
}: BookingConfirmationProps) {
	const getStatusConfig = () => {
		switch (status) {
			case "pending":
				return {
					icon: "clock" as const,
					title: "Booking Request Submitted",
					color: "text-yellow-600",
					bgColor: "bg-yellow-50",
				};
			case "confirmed":
				return {
					icon: "check" as const,
					title: "Booking Confirmed",
					color: "text-green-600",
					bgColor: "bg-green-50",
				};
			case "rejected":
				return {
					icon: "x" as const,
					title: "Booking Rejected",
					color: "text-red-600",
					bgColor: "bg-red-50",
				};
		}
	};

	const config = getStatusConfig();

	return (
		<Card className="p-6">
			<div className={`${config.bgColor} rounded-lg p-4 mb-4`}>
				<div className="flex items-center gap-3">
					<Icon name={config.icon} className={`${config.color} h-6 w-6`} />
					<h2 className={`text-xl font-semibold ${config.color}`}>{config.title}</h2>
				</div>
			</div>

			<div className="space-y-4">
				<p className="text-default">{confirmationMessage}</p>

				{status === "pending" && (
					<div className="p-4 bg-subtle rounded-lg">
						<p className="text-sm text-subtle">
							Your booking request is pending approval. You will receive an email confirmation
							once the admin approves your booking.
						</p>
					</div>
				)}

				{status === "confirmed" && (
					<div className="p-4 bg-subtle rounded-lg">
						<p className="text-sm text-subtle">
							Your booking has been confirmed! Check your email for meeting details and any video
							conferencing links.
						</p>
					</div>
				)}

				{status === "rejected" && (
					<div className="p-4 bg-subtle rounded-lg">
						<p className="text-sm text-subtle">
							Unfortunately, your booking request could not be approved at this time. Please try
							selecting a different time slot.
						</p>
					</div>
				)}

				{onClose && (
					<div className="pt-4">
						<button
							onClick={onClose}
							className="text-sm text-emphasis hover:text-default underline"
						>
							Book another meeting
						</button>
					</div>
				)}
			</div>
		</Card>
	);
}


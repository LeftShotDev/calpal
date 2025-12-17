"use client";

import { formatInTimeZone } from "date-fns-tz";
import type { ReactNode } from "react";
import React from "react";

import { Button } from "../button";
import { Card } from "../card";

export interface TimeSlot {
	startTime: string; // ISO datetime string (UTC)
	endTime: string; // ISO datetime string (UTC)
	displayStartTime: string; // ISO datetime string (user timezone)
	displayEndTime: string; // ISO datetime string (user timezone)
	isAvailable: boolean;
}

interface AvailabilityDisplayProps {
	slots: TimeSlot[];
	timezone: string;
	onSlotSelect: (slot: TimeSlot) => void;
	isLoading?: boolean;
	emptyMessage?: ReactNode;
}

export function AvailabilityDisplay({
	slots,
	timezone,
	onSlotSelect,
	isLoading = false,
	emptyMessage,
}: AvailabilityDisplayProps) {
	if (isLoading) {
		return (
			<Card className="p-6">
				<div className="text-center text-subtle">Loading available time slots...</div>
			</Card>
		);
	}

	if (slots.length === 0) {
		return (
			<Card className="p-6">
				{emptyMessage || (
					<div className="text-center text-subtle">
						<p className="text-lg font-medium mb-2">No available time slots</p>
						<p className="text-sm">Please try selecting a different date range.</p>
					</div>
				)}
			</Card>
		);
	}

	// Group slots by date
	const slotsByDate = slots.reduce((acc, slot) => {
		const date = new Date(slot.displayStartTime);
		const dateKey = formatInTimeZone(date, timezone, "yyyy-MM-dd");
		if (!acc[dateKey]) {
			acc[dateKey] = [];
		}
		acc[dateKey].push(slot);
		return acc;
	}, {} as Record<string, TimeSlot[]>);

	const formatTime = (isoString: string) => {
		const date = new Date(isoString);
		return formatInTimeZone(date, timezone, "h:mm a");
	};

	const formatDate = (isoString: string) => {
		const date = new Date(isoString);
		return formatInTimeZone(date, timezone, "EEEE, MMMM d, yyyy");
	};

	return (
		<div className="space-y-6">
			{Object.entries(slotsByDate).map(([dateKey, dateSlots]) => (
				<Card key={dateKey} className="p-6">
					<h3 className="text-lg font-semibold mb-4">
						{formatDate(dateSlots[0].displayStartTime)}
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
						{dateSlots.map((slot, index) => (
							<Button
								key={`${slot.startTime}-${index}`}
								color="secondary"
								variant="button"
								onClick={() => onSlotSelect(slot)}
								disabled={!slot.isAvailable}
								className="w-full"
							>
								{formatTime(slot.displayStartTime)}
							</Button>
						))}
					</div>
				</Card>
			))}
		</div>
	);
}


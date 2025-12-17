"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../button";
import { Card } from "../card";
import { Form, InputField, Label, SelectField } from "../form";

const availabilityBlockFormSchema = z.object({
	dayOfWeek: z.number().int().min(0).max(6),
	startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be in HH:MM:SS format"),
	endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be in HH:MM:SS format"),
	timezone: z.string().min(1, "Timezone is required"),
	isActive: z.boolean().optional(),
});

export type AvailabilityBlockFormValues = z.infer<typeof availabilityBlockFormSchema>;

interface AvailabilityBlockFormProps {
	initialValues?: {
		id?: string;
		dayOfWeek: number;
		startTime: string;
		endTime: string;
		timezone: string;
		isActive?: boolean;
	};
	onSubmit: (data: AvailabilityBlockFormValues) => void;
	onCancel?: () => void;
	isSubmitting?: boolean;
}

const DAYS_OF_WEEK = [
	{ value: 0, label: "Sunday" },
	{ value: 1, label: "Monday" },
	{ value: 2, label: "Tuesday" },
	{ value: 3, label: "Wednesday" },
	{ value: 4, label: "Thursday" },
	{ value: 5, label: "Friday" },
	{ value: 6, label: "Saturday" },
];

// Common timezones - can be expanded
const COMMON_TIMEZONES = [
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"America/Phoenix",
	"America/Anchorage",
	"America/Honolulu",
	"UTC",
	"Europe/London",
	"Europe/Paris",
	"Europe/Berlin",
	"Asia/Tokyo",
	"Asia/Shanghai",
	"Australia/Sydney",
];

export function AvailabilityBlockForm({
	initialValues,
	onSubmit,
	onCancel,
	isSubmitting = false,
}: AvailabilityBlockFormProps) {
	const form = useForm<AvailabilityBlockFormValues>({
		resolver: zodResolver(availabilityBlockFormSchema),
		defaultValues: initialValues || {
			dayOfWeek: 1,
			startTime: "09:00:00",
			endTime: "17:00:00",
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			isActive: true,
		},
	});

	const handleSubmit = (data: AvailabilityBlockFormValues) => {
		onSubmit(data);
	};

	return (
		<Card className="p-6">
			<h3 className="text-lg font-semibold mb-4">
				{initialValues?.id ? "Edit Availability Block" : "Create Availability Block"}
			</h3>
			<Form form={form} handleSubmit={handleSubmit}>
				<div className="space-y-4">
					<div>
						<Label htmlFor="dayOfWeek">
							Day of Week <span className="text-red-500">*</span>
						</Label>
						<SelectField {...form.register("dayOfWeek", { valueAsNumber: true })} id="dayOfWeek" required>
							{DAYS_OF_WEEK.map((day) => (
								<option key={day.value} value={day.value}>
									{day.label}
								</option>
							))}
						</SelectField>
					</div>

					<div>
						<Label htmlFor="startTime">
							Start Time <span className="text-red-500">*</span>
						</Label>
						<InputField
							{...form.register("startTime")}
							id="startTime"
							type="time"
							step="1"
							required
							disabled={isSubmitting}
							placeholder="09:00:00"
						/>
						<p className="text-xs text-subtle mt-1">Format: HH:MM:SS (e.g., 09:00:00)</p>
					</div>

					<div>
						<Label htmlFor="endTime">
							End Time <span className="text-red-500">*</span>
						</Label>
						<InputField
							{...form.register("endTime")}
							id="endTime"
							type="time"
							step="1"
							required
							disabled={isSubmitting}
							placeholder="17:00:00"
						/>
						<p className="text-xs text-subtle mt-1">Format: HH:MM:SS (e.g., 17:00:00)</p>
					</div>

					<div>
						<Label htmlFor="timezone">
							Timezone <span className="text-red-500">*</span>
						</Label>
						<SelectField {...form.register("timezone")} id="timezone" required disabled={isSubmitting}>
							{COMMON_TIMEZONES.map((tz) => (
								<option key={tz} value={tz}>
									{tz}
								</option>
							))}
						</SelectField>
					</div>

					<div className="flex items-center gap-2">
						<input
							{...form.register("isActive")}
							id="isActive"
							type="checkbox"
							disabled={isSubmitting}
							className="rounded border-subtle"
						/>
						<Label htmlFor="isActive" className="cursor-pointer">
							Active
						</Label>
					</div>

					<div className="flex gap-3 pt-4">
						<Button type="submit" color="primary" disabled={isSubmitting} loading={isSubmitting}>
							{isSubmitting ? "Saving..." : initialValues?.id ? "Update" : "Create"}
						</Button>
						{onCancel && (
							<Button type="button" color="secondary" onClick={onCancel} disabled={isSubmitting}>
								Cancel
							</Button>
						)}
					</div>
				</div>
			</Form>
		</Card>
	);
}


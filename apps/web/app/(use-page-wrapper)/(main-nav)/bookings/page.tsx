"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useState } from "react";

import { ShellMainAppDir } from "app/(use-page-wrapper)/(main-nav)/ShellMainAppDir";
import { trpc } from "app/_trpc/trpc";
import { BookingActions } from "@calcom/ui/components/bookings";
import { Card } from "@calcom/ui/components/card";
import { SelectField } from "@calcom/ui/components/form";
import {
	Table as TableNew,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@calcom/ui/components/table";

export default function BookingsPage() {
	const [statusFilter, setStatusFilter] = useState<"pending" | "confirmed" | "rejected" | "cancelled" | "all">(
		"all"
	);

	const bookingsQuery = trpc.viewer.bookings.list.useQuery({
		status: statusFilter !== "all" ? statusFilter : undefined,
	});

	const approveMutation = trpc.viewer.bookings.approve.useMutation({
		onSuccess: () => {
			bookingsQuery.refetch();
		},
	});

	const rejectMutation = trpc.viewer.bookings.reject.useMutation({
		onSuccess: () => {
			bookingsQuery.refetch();
		},
	});

	const handleApprove = (id: string) => {
		approveMutation.mutate({ id });
	};

	const handleReject = (id: string) => {
		rejectMutation.mutate({ id });
	};

	const formatDateTime = (isoString: string, timezone?: string) => {
		const date = new Date(isoString);
		const tz = timezone || "UTC";
		return formatInTimeZone(date, tz, "MMM d, yyyy 'at' h:mm a");
	};

	return (
		<ShellMainAppDir heading="Bookings" subtitle="Manage your booking requests">
			<div className="space-y-4">
				<Card className="p-4">
					<div className="flex items-center gap-4">
						<label htmlFor="status-filter" className="text-sm font-medium">
							Filter by status:
						</label>
						<SelectField
							id="status-filter"
							value={statusFilter}
							onChange={(e) =>
								setStatusFilter(
									e.target.value as "pending" | "confirmed" | "rejected" | "cancelled" | "all"
								)
							}
						>
							<option value="all">All</option>
							<option value="pending">Pending</option>
							<option value="confirmed">Confirmed</option>
							<option value="rejected">Rejected</option>
							<option value="cancelled">Cancelled</option>
						</SelectField>
					</div>
				</Card>

				{bookingsQuery.isLoading && (
					<Card className="p-6">
						<div className="text-center text-subtle">Loading bookings...</div>
					</Card>
				)}

				{bookingsQuery.error && (
					<Card className="p-6">
						<div className="text-center text-red-600">
							Error loading bookings: {bookingsQuery.error.message}
						</div>
					</Card>
				)}

				{bookingsQuery.data && bookingsQuery.data.bookings.length === 0 && (
					<Card className="p-6">
						<div className="text-center text-subtle">No bookings found</div>
					</Card>
				)}

				{bookingsQuery.data && bookingsQuery.data.bookings.length > 0 && (
					<Card className="p-0">
						<TableNew>
							<TableHeader>
								<TableRow>
									<TableHead>Time</TableHead>
									<TableHead>Attendee</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{bookingsQuery.data.bookings.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell>
											<div className="text-sm">
												<div>{formatDateTime(booking.startTime, booking.timezone)}</div>
												<div className="text-subtle text-xs">
													{booking.videoProvider && (
														<span className="capitalize">{booking.videoProvider}</span>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>{booking.attendeeName}</TableCell>
										<TableCell>{booking.attendeeEmail}</TableCell>
										<TableCell>
											<span
												className={`text-sm font-medium ${booking.status === "confirmed"
													? "text-green-600"
													: booking.status === "rejected"
														? "text-red-600"
														: booking.status === "pending"
															? "text-yellow-600"
															: "text-gray-600"
													}`}
											>
												{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
											</span>
										</TableCell>
										<TableCell>
											<BookingActions
												bookingId={booking.id}
												status={booking.status}
												onApprove={handleApprove}
												onReject={handleReject}
												isApproving={approveMutation.isPending}
												isRejecting={rejectMutation.isPending}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</TableNew>
					</Card>
				)}
			</div>
		</ShellMainAppDir>
	);
}


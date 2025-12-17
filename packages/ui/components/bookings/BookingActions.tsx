"use client";

import React from "react";

import { Button } from "../button";

interface BookingActionsProps {
	bookingId: string;
	status: "pending" | "confirmed" | "rejected" | "cancelled";
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	isApproving?: boolean;
	isRejecting?: boolean;
}

export function BookingActions({
	bookingId,
	status,
	onApprove,
	onReject,
	isApproving = false,
	isRejecting = false,
}: BookingActionsProps) {
	if (status !== "pending") {
		return (
			<div className="flex items-center gap-2">
				<span
					className={`text-sm font-medium ${
						status === "confirmed"
							? "text-green-600"
							: status === "rejected"
								? "text-red-600"
								: "text-gray-600"
					}`}
				>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Button
				color="primary"
				variant="button"
				size="sm"
				onClick={() => onApprove(bookingId)}
				disabled={isApproving || isRejecting}
				loading={isApproving}
			>
				Approve
			</Button>
			<Button
				color="destructive"
				variant="button"
				size="sm"
				onClick={() => onReject(bookingId)}
				disabled={isApproving || isRejecting}
				loading={isRejecting}
			>
				Reject
			</Button>
		</div>
	);
}


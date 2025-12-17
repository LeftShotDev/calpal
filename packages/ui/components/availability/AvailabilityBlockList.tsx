"use client";

import React from "react";

import { Button } from "../button";
import { Card } from "../card";
import {
	Table as TableNew,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../table";

interface AvailabilityBlock {
	id: string;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
	timezone: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface AvailabilityBlockListProps {
	blocks: AvailabilityBlock[];
	onEdit: (block: AvailabilityBlock) => void;
	onDelete: (id: string) => void;
	isDeleting?: boolean;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityBlockList({
	blocks,
	onEdit,
	onDelete,
	isDeleting = false,
}: AvailabilityBlockListProps) {
	if (blocks.length === 0) {
		return (
			<Card className="p-6">
				<div className="text-center text-subtle py-8">
					<p>No availability blocks configured.</p>
					<p className="text-sm mt-2">Create your first availability block to start accepting bookings.</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-0">
			<TableNew>
				<TableHeader>
					<TableRow>
						<TableHead>Day</TableHead>
						<TableHead>Start Time</TableHead>
						<TableHead>End Time</TableHead>
						<TableHead>Timezone</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{blocks.map((block) => (
						<TableRow key={block.id}>
							<TableCell>{DAYS_OF_WEEK[block.dayOfWeek]}</TableCell>
							<TableCell>{block.startTime}</TableCell>
							<TableCell>{block.endTime}</TableCell>
							<TableCell className="text-sm">{block.timezone}</TableCell>
							<TableCell>
								<span
									className={`text-sm font-medium ${
										block.isActive ? "text-green-600" : "text-gray-600"
									}`}
								>
									{block.isActive ? "Active" : "Inactive"}
								</span>
							</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<Button
										color="secondary"
										variant="button"
										size="sm"
										onClick={() => onEdit(block)}
										disabled={isDeleting}
									>
										Edit
									</Button>
									<Button
										color="destructive"
										variant="button"
										size="sm"
										onClick={() => {
											if (confirm("Are you sure you want to delete this availability block?")) {
												onDelete(block.id);
											}
										}}
										disabled={isDeleting}
									>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</TableNew>
		</Card>
	);
}


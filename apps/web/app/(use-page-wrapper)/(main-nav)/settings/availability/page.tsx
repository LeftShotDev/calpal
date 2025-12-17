"use client";

import { useState } from "react";

import { ShellMainAppDir } from "app/(use-page-wrapper)/(main-nav)/ShellMainAppDir";
import { trpc } from "app/_trpc/trpc";
import { AvailabilityBlockForm, AvailabilityBlockList } from "@calcom/ui/components/availability";
import { Alert } from "@calcom/ui/components/alert";
import { Button } from "@calcom/ui/components/button";

type AvailabilityBlock = {
	id: string;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
	timezone: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export default function AvailabilitySettingsPage() {
	const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);
	const [showForm, setShowForm] = useState(false);

	const blocksQuery = trpc.viewer.availability.listBlocks.useQuery({
		includeInactive: false,
	});

	const createMutation = trpc.viewer.availability.createBlock.useMutation({
		onSuccess: () => {
			blocksQuery.refetch();
			setShowForm(false);
			setEditingBlock(null);
		},
	});

	const updateMutation = trpc.viewer.availability.updateBlock.useMutation({
		onSuccess: () => {
			blocksQuery.refetch();
			setShowForm(false);
			setEditingBlock(null);
		},
	});

	const deleteMutation = trpc.viewer.availability.deleteBlock.useMutation({
		onSuccess: () => {
			blocksQuery.refetch();
		},
	});

	const handleCreate = () => {
		setEditingBlock(null);
		setShowForm(true);
	};

	const handleEdit = (block: AvailabilityBlock) => {
		setEditingBlock(block);
		setShowForm(true);
	};

	const handleCancel = () => {
		setShowForm(false);
		setEditingBlock(null);
	};

	const handleSubmit = (data: {
		dayOfWeek: number;
		startTime: string;
		endTime: string;
		timezone: string;
		isActive?: boolean;
	}) => {
		// Convert time input (HH:MM) to HH:MM:SS format
		const formatTime = (time: string) => {
			if (time.length === 5) {
				// HH:MM format
				return `${time}:00`;
			}
			return time;
		};

		if (editingBlock) {
			updateMutation.mutate({
				id: editingBlock.id,
				...data,
				startTime: formatTime(data.startTime),
				endTime: formatTime(data.endTime),
			});
		} else {
			createMutation.mutate({
				...data,
				startTime: formatTime(data.startTime),
				endTime: formatTime(data.endTime),
			});
		}
	};

	const handleDelete = (id: string) => {
		deleteMutation.mutate({ id });
	};

	return (
		<ShellMainAppDir heading="Availability" subtitle="Manage your availability blocks">
			<div className="space-y-4">
				{createMutation.error && (
					<Alert
						severity="error"
						message={createMutation.error.message || "Failed to create availability block"}
					/>
				)}

				{updateMutation.error && (
					<Alert
						severity="error"
						message={updateMutation.error.message || "Failed to update availability block"}
					/>
				)}

				{deleteMutation.error && (
					<Alert
						severity="error"
						message={deleteMutation.error.message || "Failed to delete availability block"}
					/>
				)}

				{!showForm && (
					<div className="flex justify-end">
						<Button color="primary" variant="button" onClick={handleCreate}>
							Create Availability Block
						</Button>
					</div>
				)}

				{showForm && (
					<AvailabilityBlockForm
						initialValues={editingBlock || undefined}
						onSubmit={handleSubmit}
						onCancel={handleCancel}
						isSubmitting={createMutation.isPending || updateMutation.isPending}
					/>
				)}

				{blocksQuery.isLoading && (
					<div className="text-center text-subtle py-8">Loading availability blocks...</div>
				)}

				{blocksQuery.data && !showForm && (
					<AvailabilityBlockList
						blocks={blocksQuery.data.blocks}
						onEdit={handleEdit}
						onDelete={handleDelete}
						isDeleting={deleteMutation.isPending}
					/>
				)}
			</div>
		</ShellMainAppDir>
	);
}


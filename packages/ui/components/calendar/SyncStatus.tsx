"use client";

import { formatInTimeZone } from "date-fns-tz";
import React from "react";

import { Badge } from "../badge";
import { Icon } from "../icon";

interface SyncStatusProps {
	syncStatus: "active" | "error" | "disconnected";
	lastSyncAt?: string | null;
	syncError?: string | null;
	onSync?: () => void;
	isSyncing?: boolean;
}

export function SyncStatus({
	syncStatus,
	lastSyncAt,
	syncError,
	onSync,
	isSyncing = false,
}: SyncStatusProps) {
	const getStatusConfig = () => {
		switch (syncStatus) {
			case "active":
				return {
					variant: "success" as const,
					icon: "check" as const,
					label: "Active",
					bgColor: "bg-green-50",
					textColor: "text-green-700",
				};
			case "error":
				return {
					variant: "error" as const,
					icon: "x" as const,
					label: "Error",
					bgColor: "bg-red-50",
					textColor: "text-red-700",
				};
			case "disconnected":
				return {
					variant: "gray" as const,
					icon: "x-circle" as const,
					label: "Disconnected",
					bgColor: "bg-gray-50",
					textColor: "text-gray-700",
				};
		}
	};

	const config = getStatusConfig();

	const formatLastSync = (isoString: string) => {
		const date = new Date(isoString);
		return formatInTimeZone(date, Intl.DateTimeFormat().resolvedOptions().timeZone, "MMM d, yyyy 'at' h:mm a");
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Badge variant={config.variant}>
					<div className="flex items-center gap-1">
						<Icon name={config.icon} className="h-3 w-3" />
						<span>{config.label}</span>
					</div>
				</Badge>
				{onSync && (
					<button
						onClick={onSync}
						disabled={isSyncing}
						className="text-sm text-emphasis hover:text-default underline disabled:opacity-50"
					>
						{isSyncing ? "Syncing..." : "Sync Now"}
					</button>
				)}
			</div>

			{lastSyncAt && (
				<p className="text-sm text-subtle">Last synced: {formatLastSync(lastSyncAt)}</p>
			)}

			{syncError && (
				<div className={`rounded-lg p-3 ${config.bgColor}`}>
					<p className={`text-sm ${config.textColor}`}>
						<strong>Error:</strong> {syncError}
					</p>
				</div>
			)}
		</div>
	);
}


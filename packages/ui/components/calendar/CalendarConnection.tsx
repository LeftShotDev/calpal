"use client";

import React from "react";

import { Button } from "../button";
import { Card } from "../card";
import { SyncStatus } from "./SyncStatus";

interface CalendarConnectionProps {
	integration: {
		id: string;
		type: "google-calendar";
		calendarId: string;
		syncStatus: "active" | "error" | "disconnected";
		lastSyncAt?: string | null;
		syncError?: string | null;
	} | null;
	onConnect: () => void;
	onDisconnect: () => void;
	onSync: () => void;
	isConnecting?: boolean;
	isDisconnecting?: boolean;
	isSyncing?: boolean;
}

export function CalendarConnection({
	integration,
	onConnect,
	onDisconnect,
	onSync,
	isConnecting = false,
	isDisconnecting = false,
	isSyncing = false,
}: CalendarConnectionProps) {
	if (!integration) {
		return (
			<Card className="p-6">
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-semibold mb-2">Google Calendar Integration</h3>
						<p className="text-sm text-subtle">
							Connect your Google Calendar to automatically sync your busy times and prevent
							double-bookings.
						</p>
					</div>
					<Button
						color="primary"
						variant="button"
						onClick={onConnect}
						disabled={isConnecting}
						loading={isConnecting}
					>
						{isConnecting ? "Connecting..." : "Connect Google Calendar"}
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold mb-2">Google Calendar Integration</h3>
					<p className="text-sm text-subtle">
						Connected to: <strong>{integration.calendarId}</strong>
					</p>
				</div>

				<SyncStatus
					syncStatus={integration.syncStatus}
					lastSyncAt={integration.lastSyncAt}
					syncError={integration.syncError}
					onSync={onSync}
					isSyncing={isSyncing}
				/>

				<div className="pt-4 border-t">
					<Button
						color="destructive"
						variant="button"
						onClick={onDisconnect}
						disabled={isDisconnecting}
						loading={isDisconnecting}
					>
						{isDisconnecting ? "Disconnecting..." : "Disconnect"}
					</Button>
				</div>
			</div>
		</Card>
	);
}


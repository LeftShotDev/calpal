"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { ShellMainAppDir } from "app/(use-page-wrapper)/(main-nav)/ShellMainAppDir";
import { trpc } from "app/_trpc/trpc";
import { CalendarConnection } from "@calcom/ui/components/calendar";
import { Alert } from "@calcom/ui/components/alert";

export default function CalendarIntegrationPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const integrationQuery = trpc.viewer.calendar.getIntegration.useQuery();
	const connectMutation = trpc.viewer.calendar.connect.useMutation();
	const disconnectMutation = trpc.viewer.calendar.disconnect.useMutation();
	const syncMutation = trpc.viewer.calendar.sync.useMutation();

	// Handle OAuth callback result from URL params
	useEffect(() => {
		const success = searchParams.get("success");
		const error = searchParams.get("error");

		if (success) {
			// Remove success from URL and refresh
			router.replace("/settings/integrations/calendar");
			integrationQuery.refetch();
		}

		if (error) {
			console.error("OAuth error:", error);
			// Remove error from URL
			router.replace("/settings/integrations/calendar");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const handleConnect = async () => {
		try {
			const result = await connectMutation.mutateAsync({});
			// Redirect to OAuth URL
			window.location.href = result.authUrl;
		} catch (error) {
			console.error("Failed to initiate OAuth:", error);
		}
	};

	const handleDisconnect = async () => {
		if (confirm("Are you sure you want to disconnect your Google Calendar? This will stop syncing your calendar events.")) {
			try {
				await disconnectMutation.mutateAsync({});
				integrationQuery.refetch();
			} catch (error) {
				console.error("Failed to disconnect:", error);
			}
		}
	};

	const handleSync = async () => {
		try {
			await syncMutation.mutateAsync({});
			integrationQuery.refetch();
		} catch (error) {
			console.error("Failed to sync:", error);
		}
	};

	return (
		<ShellMainAppDir heading="Calendar Integration" subtitle="Connect and manage your Google Calendar">
			<div className="space-y-4">
				{connectMutation.error && (
					<Alert severity="error" message={connectMutation.error.message || "Failed to connect calendar"} />
				)}

				{disconnectMutation.error && (
					<Alert
						severity="error"
						message={disconnectMutation.error.message || "Failed to disconnect calendar"}
					/>
				)}

				{syncMutation.error && (
					<Alert severity="error" message={syncMutation.error.message || "Failed to sync calendar"} />
				)}

				{integrationQuery.isLoading && (
					<div className="text-center text-subtle py-8">Loading calendar integration...</div>
				)}

				{integrationQuery.data && (
					<CalendarConnection
						integration={integrationQuery.data.integration}
						onConnect={handleConnect}
						onDisconnect={handleDisconnect}
						onSync={handleSync}
						isConnecting={connectMutation.isPending}
						isDisconnecting={disconnectMutation.isPending}
						isSyncing={syncMutation.isPending}
					/>
				)}
			</div>
		</ShellMainAppDir>
	);
}


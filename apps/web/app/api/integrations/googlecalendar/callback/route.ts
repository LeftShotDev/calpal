import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { CalendarAuthService } from "@calcom/features/calendar/services/CalendarAuthService";
import { CalendarSyncService } from "@calcom/features/calendar/services/CalendarSyncService";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { WEBAPP_URL, WEBAPP_URL_FOR_OAUTH } from "@calcom/lib/constants";
import { defaultResponderForAppDir } from "@calcom/web/app/api/defaultResponderForAppDir";

/**
 * OAuth callback handler for Google Calendar integration
 * Handles the redirect from Google OAuth and exchanges code for tokens
 */
async function getHandler(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	const error = request.nextUrl.searchParams.get("error");

	const _headers = await headers();
	const _cookies = await cookies();
	const legacyReq = buildLegacyRequest(_headers, _cookies);
	const session = await getServerSession({ req: legacyReq });

	if (!session?.user?.id) {
		return NextResponse.redirect(`${WEBAPP_URL}/auth/login`, { status: 302 });
	}

	// Handle OAuth errors
	if (error) {
		return NextResponse.redirect(
			`${WEBAPP_URL}/settings/integrations/calendar?error=${encodeURIComponent(error)}`,
			{ status: 302 }
		);
	}

	if (!code) {
		return NextResponse.redirect(
			`${WEBAPP_URL}/settings/integrations/calendar?error=${encodeURIComponent("No authorization code received")}`,
			{ status: 302 }
		);
	}

	try {
		// Exchange code for tokens server-side
		const authService = new CalendarAuthService();
		const redirectUri = `${WEBAPP_URL_FOR_OAUTH}/api/integrations/googlecalendar/callback`;
		const integrationId = await authService.exchangeCodeForTokens(
			session.user.id,
			code,
			redirectUri
		);

		// Perform initial sync
		const syncService = new CalendarSyncService();
		const oAuthClient = await authService.getOAuthClient(integrationId);
		await syncService.performFullSync(integrationId, oAuthClient);

		// Redirect to settings page with success
		return NextResponse.redirect(
			`${WEBAPP_URL}/settings/integrations/calendar?success=true`,
			{ status: 302 }
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Failed to connect calendar";
		return NextResponse.redirect(
			`${WEBAPP_URL}/settings/integrations/calendar?error=${encodeURIComponent(errorMessage)}`,
			{ status: 302 }
		);
	}
}

export const GET = defaultResponderForAppDir(getHandler);


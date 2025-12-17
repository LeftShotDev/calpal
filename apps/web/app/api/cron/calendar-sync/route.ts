import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { syncAllCalendars } from "@calcom/features/calendar/jobs/syncJob";
import { defaultResponderForAppDir } from "@calcom/web/app/api/defaultResponderForAppDir";

/**
 * Cron endpoint for calendar sync
 * Runs every 5 minutes to sync all active calendar integrations
 *
 * @param request
 * @returns
 */
async function getHandler(request: NextRequest) {
	const apiKey = request.headers.get("authorization") || request.nextUrl.searchParams.get("apiKey");

	if (![process.env.CRON_API_KEY, `Bearer ${process.env.CRON_SECRET}`].includes(`${apiKey}`)) {
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });
	}

	try {
		const result = await syncAllCalendars();
		return NextResponse.json({
			ok: true,
			...result,
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : "Unknown error";
		return NextResponse.json({ message }, { status: 500 });
	}
}

export const GET = defaultResponderForAppDir(getHandler);


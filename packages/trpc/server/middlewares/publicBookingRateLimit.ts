/**
 * Rate limiting middleware for public booking endpoints
 *
 * Implements rate limiting: 10 bookings per IP address per hour
 * This prevents abuse of the public booking creation endpoint.
 */

import { TRPCError } from "@trpc/server";
import getIP from "@calcom/lib/getIP";
import type { NextApiRequest } from "next";
import { middleware } from "../trpc";

// Simple in-memory rate limit store (for MVP - can be replaced with Redis in production)
interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration: 10 bookings per IP per hour
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Clean up expired entries from rate limit store
 * Runs periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
	const now = Date.now();
	for (const [ip, entry] of rateLimitStore.entries()) {
		if (entry.resetAt < now) {
			rateLimitStore.delete(ip);
		}
	}
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
	setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Check if IP has exceeded rate limit
 * @param ip - IP address to check
 * @returns true if rate limited, false otherwise
 */
function isRateLimited(ip: string): { limited: boolean; resetAt?: number; remaining?: number } {
	const now = Date.now();
	const entry = rateLimitStore.get(ip);

	if (!entry) {
		// First request from this IP
		rateLimitStore.set(ip, {
			count: 1,
			resetAt: now + RATE_LIMIT_WINDOW_MS,
		});
		return { limited: false, remaining: RATE_LIMIT_COUNT - 1 };
	}

	// Check if window has expired
	if (entry.resetAt < now) {
		// Reset window
		rateLimitStore.set(ip, {
			count: 1,
			resetAt: now + RATE_LIMIT_WINDOW_MS,
		});
		return { limited: false, remaining: RATE_LIMIT_COUNT - 1 };
	}

	// Check if limit exceeded
	if (entry.count >= RATE_LIMIT_COUNT) {
		return { limited: true, resetAt: entry.resetAt, remaining: 0 };
	}

	// Increment count
	entry.count += 1;
	return { limited: false, remaining: RATE_LIMIT_COUNT - entry.count };
}

/**
 * Rate limiting middleware for public booking endpoints
 * Limits to 10 bookings per IP per hour
 */
export const publicBookingRateLimit = middleware(async ({ ctx, next }) => {
	const ip = getIP((ctx.req as NextApiRequest | undefined) || ({} as NextApiRequest));
	const rateLimitResult = isRateLimited(ip);

	if (rateLimitResult.limited) {
		const secondsToWait = rateLimitResult.resetAt
			? Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
			: 3600;

		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: `Rate limit exceeded. Maximum 10 bookings per hour. Try again in ${secondsToWait} seconds.`,
			cause: {
				retryAfter: secondsToWait,
			},
		});
	}

	// Add rate limit headers to response
	if (ctx.res) {
		ctx.res.setHeader("X-RateLimit-Limit", RATE_LIMIT_COUNT.toString());
		ctx.res.setHeader("X-RateLimit-Remaining", (rateLimitResult.remaining || 0).toString());
		if (rateLimitResult.resetAt) {
			ctx.res.setHeader("X-RateLimit-Reset", rateLimitResult.resetAt.toString());
		}
	}

	return next({ ctx });
});


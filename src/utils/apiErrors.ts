/**
 * Shared helpers for talking to the hardened /api/gemini/* endpoints.
 *
 * The server can answer in four ways the operator must be able to tell apart:
 *  - 200 with real AI data
 *  - 200 with `isFallback: true` (canned sample content — never safe to show live)
 *  - 429 with `{ error, retryAfter }` (rate limited)
 *  - 400 with `{ error }` (validation problem)
 */

/** Banner copy shown whenever the server flags a response as canned sample content. */
export const FALLBACK_CONTENT_WARNING =
  'AI unavailable — showing sample content. Do not use live.';

/**
 * Builds a user-facing message for a non-OK response. Always prefers the
 * server's own `error` string, and spells out the wait for HTTP 429.
 */
export const readApiErrorMessage = async (
  res: Response,
  fallbackMessage: string
): Promise<string> => {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (proxy error page, empty response) — fall through to defaults.
    body = null;
  }

  if (res.status === 429) {
    const retryAfter = Number(body?.retryAfter ?? res.headers.get('Retry-After'));
    return Number.isFinite(retryAfter) && retryAfter > 0
      ? `Rate limit reached — please wait ${retryAfter}s before trying again.`
      : 'Rate limit reached — please wait a moment before trying again.';
  }

  return typeof body?.error === 'string' && body.error ? body.error : fallbackMessage;
};

/**
 * Turns anything thrown inside a fetch block into a visible message. A raw
 * TypeError from fetch means the request never reached the server at all.
 */
export const describeRequestFailure = (err: unknown, fallbackMessage: string): string => {
  if (err instanceof TypeError) {
    return 'Cannot reach the presentation server — check that it is running, then try again.';
  }
  return err instanceof Error && err.message ? err.message : fallbackMessage;
};

/**
 * Vercel serverless entry point.
 *
 * `vercel.json` rewrites every /api/* request here, and the Express app in
 * server.ts matches them against its own /api routes. The client bundle is
 * served separately from Vercel's CDN, so this function only handles the API.
 */
export { default } from '../server';

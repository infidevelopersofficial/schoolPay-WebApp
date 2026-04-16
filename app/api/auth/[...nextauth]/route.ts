/**
 * Auth.js v5 Route Handler
 *
 * Re-exports the GET and POST handlers from the full auth config.
 * All auth API routes (/api/auth/*) are handled here.
 */

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers

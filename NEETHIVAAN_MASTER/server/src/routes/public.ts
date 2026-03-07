// path: server/src/routes/public.ts
// Unauthenticated routes — accessible by anyone with the correct token/link.
// Used for public complaint tracking pages shared by users.

import { Router }       from 'express';
import { publicTrack }  from '../controllers/complaintController';
import { apiLimiter }   from '../middleware/rateLimiter';

const router = Router();

// Public complaint tracking — no auth needed
// GET /api/public/track/:token
router.get('/track/:token', apiLimiter, publicTrack);

export default router;

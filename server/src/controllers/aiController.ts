// path: server/src/controllers/aiController.ts
// Public endpoint to classify complaint text.
// No auth required so users can preview intent before submitting.

import { Request, Response, NextFunction } from 'express';
import { classify } from '../ml/intentClassifier';
import { createError } from '../middleware/errorHandler';

export const classifyIntent = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { text } = req.body as { text?: string };
    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      next(createError('Provide at least 5 characters of text to classify'));
      return;
    }
    const result = classify(text.trim());
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// mockStore/mode.ts — Single Source of Truth for Storage Mode
// ============================================================

import { env } from '../config/env';

/**
 * The active storage mode for the current process.
 * Read this instead of importing `env.STORAGE_MODE` directly so
 * the rest of the codebase doesn't reach into env every time.
 */
export const STORAGE_MODE = env.STORAGE_MODE;

/**
 * True when the in-memory mock store should be used instead of Prisma.
 * Keep all callsites behind this helper so flipping the mode is a
 * one-line change.
 */
export const isMockStorage = (): boolean => STORAGE_MODE === 'memory';

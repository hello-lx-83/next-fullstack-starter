export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export const INITIAL_ACTION_RESULT: ActionResult = { ok: true };

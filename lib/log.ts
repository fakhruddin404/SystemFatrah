/**
 * Human-readable message from anything that can be thrown or returned as an error.
 * Supabase returns plain objects ({ message, code, ... }) rather than Error instances,
 * which would otherwise print as "[object Object]". Never includes env values or keys.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const { message } = err as { message: unknown };
    if (typeof message === 'string' && message) return message;
  }
  return String(err);
}

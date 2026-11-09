/** Result shape shared by admin Server Actions used with `useFormState`. */
export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export const NOT_ADMIN_MESSAGE =
  'You do not have permission to do that. Please sign in again.';

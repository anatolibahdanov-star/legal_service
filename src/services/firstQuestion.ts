import { getUsersByIds } from '@/src/repositories/users/repo';

/**
 * Whether the user qualifies for the "first question free" benefit.
 *
 * Backed by the `user.is_first_question_free` column (migration 20260513):
 *   - new users get the flag set to 1 (default)
 *   - the flag flips to 0 when the user inserts their first root question
 *     (see addClientQuestion → markFirstQuestionUsed)
 *   - admins/support can flip it back to 1 manually if needed
 *
 * A null/unset user id is treated as a brand-new wizard guest — also free.
 */
export async function isFirstQuestionFree(
  userId: string | number | null | undefined,
): Promise<boolean> {
  if (!userId) return true;
  const user = await getUsersByIds([userId.toString()]);
  if (!user) return false;
  return user.is_first_question_free === 1;
}

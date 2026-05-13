import { CustomRequest } from '@/src/libs/request';
import { CustomResponseDataI } from '@/src/interfaces/api';

export interface CompleteProfilePayload {
  name: string;
  email: string;
  /** Wizard flow: pass phone + verifyToken so the endpoint can identify
   *  the user without a session (the wizard signs in only AFTER this call). */
  phone?: string;
  verifyToken?: string;
}

export async function completeProfileAction(
  payload: CompleteProfilePayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/users/complete-profile', payload);
}

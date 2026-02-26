import {Session, Account, User, Profile} from "next-auth"
import { JWT } from "next-auth/jwt";

export interface NextAuthSessionInput {
  session: Session;
  token: JWT;
}

export interface NextAuthJWTInput {
  token: JWT;
  user: User;
  account: Account | null;
  profile?: Profile | undefined;
  trigger?: string;
  session?: Session;
}
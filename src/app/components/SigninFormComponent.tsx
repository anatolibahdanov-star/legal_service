'use client'; // This makes the component a Client Component
import { signIn } from "next-auth/react"

type Provider = {
  name: string;
  id: string;
  type?: string;
  callbackUrl?: string;
  signinUrl?: string;
};

interface ChildProps {
  provider: Provider;
}

export default function SigninFormComponent({ provider }: ChildProps) {
  return (
    <div key={provider.name}>
        <button onClick={() => signIn(provider.id)}>
        Sign in with {provider.name}
        </button>
    </div>
  );
}
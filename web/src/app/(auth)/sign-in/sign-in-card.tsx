"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { authClient } from "@/lib/auth-client";

const GoogleIcon = () => (
  <svg data-icon viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
    />
  </svg>
);

export function SignInCard() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") ?? "/console";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    if (error) {
      setError(error.message ?? "Sign-in failed. Please try again.");
      setPending(false);
    }
  };

  return (
    <div className="flex w-full max-w-100 flex-col items-center gap-8 rounded-2xl bg-primary px-8 py-10 shadow-lg ring-1 ring-secondary">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-mono text-sm font-medium tracking-wide text-brand-secondary">
          MENGED
        </span>
        <h1 className="text-display-xs font-semibold text-primary">
          Addis Ababa Transit
        </h1>
        <p className="text-sm text-tertiary">
          Sign in to access the network operations console
        </p>
      </div>
      <Button
        color="secondary"
        size="lg"
        className="w-full"
        onClick={signInWithGoogle}
        isDisabled={pending}
        iconLeading={GoogleIcon}
      >
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error && <p className="text-sm text-error-primary">{error}</p>}
    </div>
  );
}

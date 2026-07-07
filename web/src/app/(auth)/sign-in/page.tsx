import { Suspense } from "react";
import { SignInCard } from "./sign-in-card";

export const metadata = {
  title: "Sign in — Menged",
};

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-secondary px-4">
      <Suspense>
        <SignInCard />
      </Suspense>
    </main>
  );
}

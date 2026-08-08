import { Suspense } from "react";
import { LoginForm } from "@/components/account/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="mb-6 font-display text-2xl">Sign In</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

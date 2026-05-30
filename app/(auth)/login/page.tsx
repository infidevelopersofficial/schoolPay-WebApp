import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In — SchoolPay",
  description: "Sign in to your SchoolPay account",
};

import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex flex-col justify-center min-h-[80vh] p-4 sm:p-8">
      <div className="w-full">
        <Suspense fallback={<div className="h-48 flex items-center justify-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

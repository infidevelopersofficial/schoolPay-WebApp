import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — SchoolPay",
  description: "Sign in to your SchoolPay account",
};

export default function LoginPage() {
  // Redirect to type selector
  redirect("/login-type-selector");
}


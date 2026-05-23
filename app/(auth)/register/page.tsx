import { RegisterForm } from "./register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — SchoolPay",
  description: "Sign up for SchoolPay",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-950 sm:p-8">
      <div className="w-full">
        <RegisterForm />
        
        <div className="text-center text-sm text-slate-500 mt-8">
          <p>
            Already have an account?{" "}
            <a href="/login-type-selector" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign in instead
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

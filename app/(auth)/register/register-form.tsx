"use client";

import { useState } from "react";
import { registerTenant } from "./actions";
import { Loader2, AlertCircle, Building2, User, Phone, MapPin, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await registerTenant(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
      // On success, the server action will redirect to /onboarding
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-100">Create your Organization Account</CardTitle>
        <CardDescription className="text-slate-400">
          Set up SchoolPay for your School, Coaching Center, or Tutoring service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-200 border rounded-xl bg-red-500/20 border-red-400/30">
              <AlertCircle className="shrink-0 w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Organization Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Organization Type <span className="text-red-400">*</span></label>
                <select name="type" required className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option value="SCHOOL">K-12 School</option>
                  <option value="COACHING_CENTER">Coaching Center</option>
                  <option value="PRIVATE_TUTOR">Private Tutor</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Organization Name <span className="text-red-400">*</span></label>
                <input name="name" type="text" required placeholder="Springfield High" className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">GSTIN (Optional)</label>
                <input name="gstin" type="text" placeholder="22AAAAA0000A1Z5" className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Website (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input name="website" type="url" placeholder="https://..." className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" /> Admin Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name <span className="text-red-400">*</span></label>
                <input name="adminName" type="text" required placeholder="John Doe" className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address <span className="text-red-400">*</span></label>
                <input name="adminEmail" type="email" required placeholder="admin@example.com" className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Mobile Number <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input name="adminPhone" type="tel" required placeholder="+91 9876543210" className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password <span className="text-red-400">*</span></label>
                <input name="password" type="password" required minLength={8} placeholder="Min 8 characters" className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" /> Location
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">City <span className="text-red-400">*</span></label>
                <input name="city" type="text" required placeholder="Mumbai" className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">State <span className="text-red-400">*</span></label>
                <input name="state" type="text" required placeholder="Maharashtra" className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">Full Address (Optional)</label>
                <textarea name="address" rows={2} placeholder="Building, Street, Landmark..." className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold text-lg transition-all hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/20 mt-4"
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {loading ? "Creating Account..." : "Create Account & Continue"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

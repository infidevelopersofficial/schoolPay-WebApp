import { CampaignWizard } from "@/components/communications/CampaignWizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "New Campaign - SchoolPay",
};

export default function NewCampaignPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/communications" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Create Campaign</h1>
            <p className="text-white/60 mt-1">Design and dispatch a new multi-channel communication</p>
          </div>
        </div>

        <CampaignWizard />
      </div>
    </div>
  );
}

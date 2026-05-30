import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UpgradePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-3xl font-bold mb-4">Demo Expired</h1>
      <p className="text-muted-foreground mb-8 text-lg max-w-md">
        Your free demo has expired. Choose a plan to continue accessing all features of SchoolPay.
      </p>
      <Link href="/register?plan=starter">
        <Button size="lg">Upgrade to Starter Plan</Button>
      </Link>
    </div>
  );
}

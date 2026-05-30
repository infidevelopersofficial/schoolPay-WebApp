"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Building2, MapPin, Mail, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "free_demo";
  const [plan, setPlan] = useState(planParam.toUpperCase());

  useEffect(() => {
    if (planParam) {
      setPlan(planParam.toUpperCase());
    }
  }, [planParam]);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    adminEmail: "",
    adminPassword: "",
    phone: "",
    tenantType: "K12_SCHOOL",
    schoolCode: "",
  });

  const isFreeDemo = plan === "FREE_DEMO";

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isFreeDemo) {
        // Direct creation for free demo
        const res = await fetch("/api/super-admin/tenants/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            plan: "FREE_DEMO",
            isDemo: true,
          }),
        });
        
        if (res.ok) {
          toast.success("School created successfully! Check your email for login details.");
          router.push("/login");
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to create account");
        }
      } else {
        // Paid plan logic
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            plan,
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to initiate payment");
        }

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          throw new Error("Razorpay SDK failed to load");
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: "INR",
          name: "SchoolPay",
          description: `${plan} Plan Subscription`,
          order_id: data.orderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyRes.ok) {
                toast.success("Payment successful! School created.");
                router.push("/login");
              } else {
                toast.error("Payment verification failed");
              }
            } catch (err) {
              toast.error("An error occurred during verification");
            }
          },
          prefill: {
            name: formData.name,
            email: formData.adminEmail,
          },
          theme: {
            color: "#2563EB",
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-slate-800 bg-slate-900/50 backdrop-blur text-white">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isFreeDemo ? "Start your Free Demo" : `Subscribe to ${plan} Plan`}
        </CardTitle>
        <CardDescription className="text-slate-400">
          Set up your institution in minutes
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName" className="text-slate-300">Institution Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                id="schoolName" 
                placeholder="Sunrise Public School" 
                className="pl-9 bg-slate-800/50 border-slate-700 text-white" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenantType" className="text-slate-300">Institution Type</Label>
              <select
                id="tenantType"
                className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-white"
                value={formData.tenantType}
                onChange={e => setFormData({...formData, tenantType: e.target.value})}
                required
              >
                <option value="K12_SCHOOL">K-12 School</option>
                <option value="COACHING_CLASS">Coaching Class</option>
                <option value="TUTOR">Private Tutor</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolCode" className="text-slate-300">Desired School Code</Label>
              <Input 
                id="schoolCode" 
                placeholder="e.g. SUNRISE01" 
                className="bg-slate-800/50 border-slate-700 text-white" 
                value={formData.schoolCode}
                onChange={e => setFormData({...formData, schoolCode: e.target.value.toUpperCase()})}
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-slate-300">City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  id="city" 
                  placeholder="Mumbai" 
                  className="pl-9 bg-slate-800/50 border-slate-700 text-white" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-slate-300">State</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  id="state" 
                  placeholder="Maharashtra" 
                  className="pl-9 bg-slate-800/50 border-slate-700 text-white" 
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                  required 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail" className="text-slate-300">Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                id="adminEmail" 
                type="email"
                placeholder="admin@school.com" 
                className="pl-9 bg-slate-800/50 border-slate-700 text-white" 
                value={formData.adminEmail}
                onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">Mobile Number</Label>
            <Input 
              id="phone" 
              type="tel"
              placeholder="9876543210" 
              className="bg-slate-800/50 border-slate-700 text-white" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword" className="text-slate-300">Admin Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                id="adminPassword" 
                type="password"
                placeholder="••••••••" 
                className="pl-9 bg-slate-800/50 border-slate-700 text-white" 
                value={formData.adminPassword}
                onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                required 
                minLength={8}
              />
            </div>
          </div>

        </CardContent>
        <CardFooter className="pt-2">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isFreeDemo ? (
              "Create Free Account"
            ) : (
              <><CreditCard className="mr-2 h-4 w-4" /> Pay & Setup Institution</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

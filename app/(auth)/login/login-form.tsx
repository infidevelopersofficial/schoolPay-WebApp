"use client";

import { useState } from "react";
import { authenticate } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Loader2, Building2, User, Lock, Mail, Shield, GraduationCap, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{schoolCode: string; name: string; city: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Form states
  const [schoolCode, setSchoolCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Specific toggles
  const [parentOtpMode, setParentOtpMode] = useState(false);
  const [parentOtp, setParentOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [studentDobMode, setStudentDobMode] = useState(false);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/schools/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.schools || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSchool = (code: string) => {
    setSchoolCode(code);
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleSendOtp = async () => {
    if (!identifier || !schoolCode) {
      toast.error("Please enter school code and email");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, schoolCode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP sent to your email");
        setOtpSent(true);
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent, role?: string) => {
    e.preventDefault();
    setIsLoading(true);

    const isOtp = role === "PARENT" && parentOtpMode;

    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("password", isOtp ? parentOtp : password);
    formData.append("schoolCode", role === "SCHOOLPAY_TEAM" ? "" : schoolCode);
    formData.append("isOtp", isOtp ? "true" : "false");
    if (role) formData.append("role", role);

    let redirectUrl = returnTo;
    if (role === "SCHOOLPAY_TEAM") redirectUrl = "/super-admin/tenants";
    else if (role === "STUDENT") redirectUrl = "/student/dashboard";
    else if (role === "PARENT") redirectUrl = "/parent/dashboard";
    
    formData.append("redirectTo", redirectUrl);

    try {
      const result = await authenticate(undefined, formData);
      if (result) {
        toast.error(result);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const SchoolCodeInput = () => (
    <div className="space-y-2">
      <Label htmlFor="schoolCode">School Code</Label>
      <div className="relative">
        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          id="schoolCode"
          placeholder="e.g. SPAY-SCH-001" 
          className="pl-9"
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
          required 
        />
      </div>
      <div className="text-xs text-muted-foreground">
        <button type="button" onClick={() => setShowSearch(!showSearch)} className="text-blue-500 hover:underline">
          Don't know your code? Search by name &rarr;
        </button>
      </div>
      {showSearch && (
        <div className="mt-2 p-3 bg-slate-50 border rounded-md dark:bg-slate-900">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search school name..." 
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 h-9"
            />
          </div>
          {isSearching && <div className="text-xs text-center py-2"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
          {!isSearching && searchResults.length > 0 && (
            <ul className="text-sm space-y-1">
              {searchResults.map((s) => (
                <li key={s.schoolCode}>
                  <button 
                    type="button"
                    className="w-full text-left px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                    onClick={() => selectSchool(s.schoolCode)}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.schoolCode} • {s.city}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="text-xs text-center py-2 text-muted-foreground">No schools found</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
        <CardDescription>Select your portal to sign in</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="admin" className="w-full">
        <div className="px-6 pb-2">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1">
            <TabsTrigger value="admin" className="py-2 text-xs flex flex-col items-center gap-1"><Shield className="h-4 w-4"/> Admin</TabsTrigger>
            <TabsTrigger value="staff" className="py-2 text-xs flex flex-col items-center gap-1"><Users className="h-4 w-4"/> Staff</TabsTrigger>
            <TabsTrigger value="parent" className="py-2 text-xs flex flex-col items-center gap-1"><User className="h-4 w-4"/> Parent</TabsTrigger>
            <TabsTrigger value="student" className="py-2 text-xs flex flex-col items-center gap-1"><GraduationCap className="h-4 w-4"/> Student</TabsTrigger>
            <TabsTrigger value="team" className="py-2 text-xs flex flex-col items-center gap-1"><Building2 className="h-4 w-4"/> Team</TabsTrigger>
          </TabsList>
        </div>

        {/* ADMIN TAB */}
        <TabsContent value="admin">
          <form onSubmit={(e) => handleLogin(e, "ADMIN")}>
            <CardContent className="space-y-4 pt-4">
              <SchoolCodeInput />
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="admin-email" type="email" placeholder="admin@school.com" className="pl-9" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-password">Password</Label>
                  <Link href="/reset-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="admin-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        {/* STAFF TAB */}
        <TabsContent value="staff">
          <form onSubmit={(e) => handleLogin(e, "TEACHER")}>
            <CardContent className="space-y-4 pt-4">
              <SchoolCodeInput />
              <div className="space-y-2">
                <Label htmlFor="staff-id">Staff ID or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="staff-id" placeholder="TCH-001 or email" className="pl-9" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff-password">Password</Label>
                  <Link href="/reset-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="staff-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        {/* PARENT TAB */}
        <TabsContent value="parent">
          <form onSubmit={(e) => handleLogin(e, "PARENT")}>
            <CardContent className="space-y-4 pt-4">
              <SchoolCodeInput />
              
              <div className="flex items-center space-x-2 pb-2">
                <Switch id="otp-mode" checked={parentOtpMode} onCheckedChange={setParentOtpMode} />
                <Label htmlFor="otp-mode">Login with OTP instead of password</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent-email">Registered Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="parent-email" type="email" placeholder="parent@example.com" className="pl-9" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </div>
              </div>

              {parentOtpMode ? (
                <>
                  {!otpSent ? (
                    <Button type="button" variant="outline" className="w-full" onClick={handleSendOtp} disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
                    </Button>
                  ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="parent-otp">6-Digit OTP</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="parent-otp" placeholder="123456" className="pl-9 tracking-widest" value={parentOtp} onChange={(e) => setParentOtp(e.target.value)} required maxLength={6} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="parent-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="parent-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || (parentOtpMode && !otpSent)}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        {/* STUDENT TAB */}
        <TabsContent value="student">
          <form onSubmit={(e) => handleLogin(e, "STUDENT")}>
            <CardContent className="space-y-4 pt-4">
              <SchoolCodeInput />
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="student-id" placeholder="SRS-STU-001" className="pl-9" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pb-1">
                <Switch id="dob-mode" checked={studentDobMode} onCheckedChange={setStudentDobMode} />
                <Label htmlFor="dob-mode">Use Date of Birth as password</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-password">{studentDobMode ? "Date of Birth (YYYY-MM-DD)" : "Password"}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="student-password" 
                    type={studentDobMode ? "text" : "password"} 
                    placeholder={studentDobMode ? "e.g. 2010-05-24" : "••••••••"} 
                    className="pl-9" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team">
          <form onSubmit={(e) => handleLogin(e, "SCHOOLPAY_TEAM")}>
            <CardContent className="space-y-4 pt-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm rounded-md border border-amber-200 dark:border-amber-900 mb-4">
                <Shield className="inline h-4 w-4 mr-2" />
                SchoolPay internal team only
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="team-email" type="email" placeholder="name@schoolpay.in" className="pl-9" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="team-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In to Admin Panel"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
      <div className="text-center text-sm text-slate-500 pb-6 pt-2">
        <p>
          Don't have an account?{" "}
          <Link href="/register?plan=free_demo" className="text-blue-600 hover:underline">
            Register your school
          </Link>
        </p>
      </div>
    </Card>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== "SCHOOLPAY_TEAM") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="h-16 border-b bg-white dark:bg-slate-950 flex items-center px-6 sticky top-0 z-10">
        <div className="font-bold text-xl tracking-tight text-blue-600">SchoolPay Team</div>
        <nav className="ml-10 flex gap-6 text-sm font-medium">
          <a href="/super-admin/tenants" className="hover:text-blue-600 transition-colors">Tenants</a>
          <a href="/super-admin/users" className="hover:text-blue-600 transition-colors">Team Users</a>
        </nav>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

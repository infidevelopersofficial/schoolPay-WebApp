import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-24 max-w-4xl mx-auto px-6">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Privacy Policy &mdash; SchoolPay Technologies</h1>
        <p className="text-muted-foreground">Last updated: June 2025</p>
      </div>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Information we collect</h2>
          <p className="leading-relaxed">
            We collect: school name, admin name, parent name, student name, mobile number, email address, fee payment records, attendance data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. How we use your information</h2>
          <p className="leading-relaxed">
            Data is used solely for school administration and fee management. We do not sell or share your data with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Data security</h2>
          <p className="leading-relaxed">
            All data is encrypted in transit (HTTPS) and stored securely in our database.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Contact us</h2>
          <div className="leading-relaxed space-y-2">
            <p><strong>Email:</strong> <a href="mailto:support@schoolpay.in" className="text-blue-600 hover:underline">support@schoolpay.in</a></p>
            <p><strong>Phone:</strong> <a href="tel:8369704457" className="text-blue-600 hover:underline">8369704457</a></p>
            <p>
              <strong>Address:</strong><br />
              Shop No. 14, Rashmi Laxmi Sadan,<br />
              Near Bhayandar East Station,<br />
              Bhayander East - 401105, Thane, Maharashtra
            </p>
          </div>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:underline font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

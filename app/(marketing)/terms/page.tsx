import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="container py-24 max-w-4xl mx-auto px-6">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Terms of Service &mdash; SchoolPay Technologies</h1>
        <p className="text-muted-foreground">Last updated: June 2025</p>
      </div>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Service description</h2>
          <p className="leading-relaxed">
            SchoolPay is a cloud-based school management platform for K-12 institutions in India.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. Subscription and billing</h2>
          <p className="leading-relaxed">
            Plans are billed monthly. Prices are in INR and exclusive of 18% GST.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Free demo</h2>
          <p className="leading-relaxed">
            The 30-day free demo is provided at no cost. No credit card required. After 30 days, upgrade to a paid plan to continue using the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Cancellation and refunds</h2>
          <p className="leading-relaxed">
            You may cancel your subscription at any time. Refunds are not provided after 7 days of the subscription start date.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold mb-3">5. Governing law</h2>
          <p className="leading-relaxed">
            These terms are governed by the laws of Maharashtra, India.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">6. Contact</h2>
          <div className="leading-relaxed space-y-2">
            <p><strong>Email:</strong> <a href="mailto:support@schoolpay.in" className="text-blue-600 hover:underline">support@schoolpay.in</a></p>
            <p><strong>Phone:</strong> <a href="tel:8369704457" className="text-blue-600 hover:underline">8369704457</a></p>
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

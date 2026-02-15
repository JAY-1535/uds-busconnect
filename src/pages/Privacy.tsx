import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto prose prose-gray dark:prose-invert">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            Privacy Policy
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              make a booking, or contact us for support. This includes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Student ID and class information</li>
              <li>Emergency contact details</li>
              <li>Payment information (processed securely via Paystack)</li>
              <li>Booking history and preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Process and confirm your bookings</li>
              <li>Send you booking confirmations and updates</li>
              <li>Provide customer support</li>
              <li>Improve our services</li>
              <li>Ensure safety and security during travel</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We share your information only with bus organizers to facilitate your trip, 
              payment processors to complete transactions, and as required by law. 
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate security measures to protect your personal information. 
              Payment processing is handled by Paystack, a PCI-DSS compliant payment provider.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at 
              ANYCOTECHNOLOGIES@GMAIL.COM.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;




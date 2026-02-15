import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto prose prose-gray dark:prose-invert">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            Terms of Service
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using UDS BusConnect, you accept and agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Booking and Payment</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>All bookings are subject to seat availability</li>
              <li>Payment must be completed to confirm your booking</li>
              <li>The Travel Safe fee (GHS30) is mandatory and non-refundable</li>
              <li>Prices are displayed in Ghana Cedis (GHS)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Cancellation Policy</h2>
            <p className="text-muted-foreground">
              Cancellation policies vary by bus organizer. Please contact the trip organizer 
              directly for cancellation requests and refund information. The Travel Safe fee 
              is non-refundable in all cases.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Passenger Responsibilities</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Arrive at the departure point at least 30 minutes before departure time</li>
              <li>Present valid student ID matching your booking details</li>
              <li>Ensure luggage is properly tagged with the provided luggage ID</li>
              <li>Follow all safety instructions from the bus crew</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Luggage Policy</h2>
            <p className="text-muted-foreground">
              Passengers are allowed up to 3 bags free of charge. Additional bags incur a GHS5 
              tagging fee. Bus organizers may impose additional luggage restrictions or fees.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Liability</h2>
            <p className="text-muted-foreground">
              UDS BusConnect acts as a booking platform connecting students with bus organizers. 
              While we facilitate the Travel Safe insurance program, the primary responsibility 
              for safe transportation lies with the bus organizers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the 
              platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, contact us at ANYCOTECHNOLOGIES@GMAIL.COM.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;




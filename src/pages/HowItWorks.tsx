import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, CreditCard, Ticket, Bus } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: MapPin,
      title: '1. Select Your Campus',
      description: 'Choose between Nyankpala or Tamale campus to see available trips from your location.',
    },
    {
      icon: Bus,
      title: '2. Browse Trips',
      description: 'View all available trips with departure times, prices, and seat availability in real-time.',
    },
    {
      icon: Ticket,
      title: '3. Book Your Seat',
      description: 'Select your preferred seat from the interactive bus layout and fill in your passenger details.',
    },
    {
      icon: CreditCard,
      title: '4. Complete Payment',
      description: 'Pay securely via mobile money. Your booking is confirmed instantly upon payment.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary text-white py-16">
          <div className="container text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              How UDS BusConnect Works
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Booking your TTFPP bus has never been easier. Follow these simple steps to secure your seat.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container">
            <h2 className="font-display text-2xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-background rounded-lg p-6">
                <h3 className="font-semibold mb-2">What is Travel Safe Insurance?</h3>
                <p className="text-muted-foreground text-sm">
                  A mandatory GHS30 fee included in every booking that provides insurance coverage during your journey.
                </p>
              </div>
              <div className="bg-background rounded-lg p-6">
                <h3 className="font-semibold mb-2">Can I bring luggage?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes! First 3 bags are free. Additional bags have a GHS5 tagging fee for identification.
                </p>
              </div>
              <div className="bg-background rounded-lg p-6">
                <h3 className="font-semibold mb-2">How do I get my ticket?</h3>
                <p className="text-muted-foreground text-sm">
                  After payment, you'll receive a digital ticket with your seat number and a unique luggage ID if applicable.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;




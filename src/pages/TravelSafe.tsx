import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Heart, Phone, FileText } from 'lucide-react';

const TravelSafe = () => {
  const benefits = [
    {
      icon: Shield,
      title: 'Accident Coverage',
      description: 'Protection against injuries sustained during your bus journey.',
    },
    {
      icon: Heart,
      title: 'Medical Expenses',
      description: 'Coverage for medical bills in case of travel-related health issues.',
    },
    {
      icon: Phone,
      title: '24/7 Emergency Support',
      description: 'Access to emergency assistance throughout your journey.',
    },
    {
      icon: FileText,
      title: 'Luggage Protection',
      description: 'Coverage for lost or damaged tagged luggage during transit.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary text-white py-16">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Travel Safe Program</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Travel with Peace of Mind
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Every booking includes our Travel Safe insurance for just GHS30, ensuring you're protected throughout your journey.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <h2 className="font-display text-2xl font-bold mb-8 text-center">
            What's Covered
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                    <benefit.icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-2xl font-bold mb-4">
                How to File a Claim
              </h2>
              <p className="text-muted-foreground mb-8">
                In the unfortunate event of an incident, filing a claim is simple:
              </p>
              <ol className="text-left space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</span>
                  <div>
                    <p className="font-semibold">Document the Incident</p>
                    <p className="text-sm text-muted-foreground">Take photos and gather any relevant information about what happened.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</span>
                  <div>
                    <p className="font-semibold">Contact Support</p>
                    <p className="text-sm text-muted-foreground">Reach out to our support team within 48 hours of the incident.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</span>
                  <div>
                    <p className="font-semibold">Submit Your Claim</p>
                    <p className="text-sm text-muted-foreground">Provide your booking details and incident documentation for review.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TravelSafe;




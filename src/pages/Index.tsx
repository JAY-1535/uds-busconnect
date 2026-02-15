import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Users, Bus, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CampusCard } from '@/components/ui/campus-card';
import { Button } from '@/components/ui/button';
import { CAMPUSES, CampusType, CAMPUS_INFO, APP_TAGLINE } from '@/lib/constants';

const Index = () => {
  const [selectedCampus, setSelectedCampus] = useState<CampusType | null>(null);
  const navigate = useNavigate();

  const handleCampusSelect = (campus: CampusType) => {
    setSelectedCampus(campus);
  };

  const handleContinue = () => {
    if (selectedCampus) {
      navigate(`/trips?campus=${selectedCampus}`);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Travel Safe Insurance',
      description: 'Every booking includes GHS30 Travel Safe coverage for peace of mind.',
    },
    {
      icon: Clock,
      title: 'Real-Time Availability',
      description: 'See available seats instantly and book your spot in seconds.',
    },
    {
      icon: Users,
      title: 'Trusted Organizers',
      description: 'Verified bus groups ensuring safe and reliable transportation.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-hero-gradient text-white py-20 lg:py-32 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Bus className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">TTFPP Transportation Made Easy</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Book Your Bus,{' '}
              <span className="text-gradient">Travel Safe</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8">
              {APP_TAGLINE}. The official TTFPP bus booking platform for 
              University for Development Studies students.
            </p>
          </div>

          {/* Campus Selection */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-lg font-medium mb-6 text-white/90">
              Select Your Campus to Get Started
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {Object.values(CAMPUSES).map((campus) => (
                <CampusCard
                  key={campus}
                  campus={campus}
                  onClick={() => handleCampusSelect(campus)}
                  selected={selectedCampus === campus}
                />
              ))}
            </div>

            {selectedCampus && (
              <div className="text-center animate-fade-in">
                <Button 
                  size="lg" 
                  onClick={handleContinue}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-lg px-8 glow-gold"
                >
                  Browse {CAMPUS_INFO[selectedCampus].shortName} Trips
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why Choose UDS BusConnect?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We've made TTFPP transportation simpler, safer, and more reliable for every student.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-shadow duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <div className="bg-primary rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
            <div className="relative z-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Ready to Book Your Next Trip?
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Join thousands of UDS students who trust BusConnect for their TTFPP travels.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/trips')}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                Find Available Trips
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;




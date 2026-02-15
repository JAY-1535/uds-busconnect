import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { COMPANY_NAME } from '@/lib/constants';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo size="md" variant="white" className="mb-4" />
            <p className="text-sm text-primary-foreground/80 mb-4">
              Streamlining TTFPP transportation for UDS students. 
              Safe, reliable, and convenient bus bookings.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/trips" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                  Find Trips
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/travel-safe" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                  Travel Safe Program
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h4 className="font-display font-bold mb-4">For Organizers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/apply-organizer" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                  Become an Organizer
                </Link>
              </li>
              <li>
                <Link to="/auth?redirect=/organizer" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                  Organizer Login
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">
                  Organizer Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-primary-foreground/80">
                  University for Development Studies, Tamale, Ghana
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm text-primary-foreground/80">
                  0530634455
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm text-primary-foreground/80">
                  ANYCOTECHNOLOGIES@GMAIL.COM
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/60">
            (c) {currentYear} UDS BusConnect. All rights reserved. Powered by {COMPANY_NAME}
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};




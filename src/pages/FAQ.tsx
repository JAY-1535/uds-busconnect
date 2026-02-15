import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: 'What is UDS BusConnect?',
      answer: 'UDS BusConnect is the official TTFPP (Tamale-to-Faculty-and-Practical-Places) bus booking platform for University for Development Studies students. It streamlines transportation between campuses and home destinations.',
    },
    {
      question: 'How do I book a trip?',
      answer: 'Simply select your campus on the homepage, browse available trips, select your preferred seat, fill in your details, and complete payment. Your booking confirmation will be sent immediately.',
    },
    {
      question: 'What is Travel Safe Insurance?',
      answer: 'Travel Safe is a mandatory GHS30 insurance fee included in every booking. It provides coverage for any incidents during your journey, giving you peace of mind while traveling.',
    },
    {
      question: 'How many bags can I bring?',
      answer: 'You can bring up to 3 bags for free. Additional bags incur a GHS5 tagging fee per bag. All luggage is tagged with a unique ID for easy identification.',
    },
    {
      question: 'Can I cancel my booking?',
      answer: 'Please contact the trip organizer directly for cancellation requests. Refund policies vary by organizer.',
    },
    {
      question: 'How do I become an organizer?',
      answer: 'To become a bus group organizer, sign up for an account and contact our admin team to upgrade your account to organizer status.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept mobile money payments through all major networks in Ghana via Paystack.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach us at ANYCOTECHNOLOGIES@GMAIL.COM or contact the trip organizer directly using the phone number provided on your booking confirmation.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground mb-8">
            Find answers to common questions about UDS BusConnect.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;




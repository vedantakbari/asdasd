import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import LandingLayout from '@/components/landing/landing-layout';

const FAQPage = () => {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about ServiceCRM features, pricing, and support.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Getting Started</h2>
            <Accordion type="single" collapsible className="w-full">
              <FAQItem 
                question="What is ServiceCRM?" 
                answer="ServiceCRM is a comprehensive customer relationship management platform designed for businesses of all types and sizes. It helps you manage leads, clients, appointments, and payments in one place, streamlining your workflow and improving client relationships."
              />
              <FAQItem 
                question="Is ServiceCRM really free to use?" 
                answer="Yes! ServiceCRM offers a generous free tier that includes all core features for small businesses and individual users. Paid tiers with additional features and higher usage limits are available for growing businesses with more advanced needs."
              />
              <FAQItem 
                question="How do I create an account?" 
                answer="Creating a ServiceCRM account is simple. Click the 'Get Started' or 'Sign Up' button on our homepage, enter your email, and follow the prompts. You'll have your CRM up and running in minutes with no credit card required for the free tier."
              />
              <FAQItem 
                question="Do I need to install any software?" 
                answer="No installation is required. ServiceCRM is a cloud-based application that runs in your web browser. This means you can access it from any device with an internet connection, including desktops, laptops, tablets, and smartphones."
              />
              <FAQItem 
                question="What kind of businesses can benefit from ServiceCRM?" 
                answer="ServiceCRM is designed to be flexible and can benefit virtually any business type that manages client relationships. This includes consulting firms, retail businesses, professional services, healthcare providers, contractors, real estate agencies, and many others."
              />
            </Accordion>
          </div>
          
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Features & Functionality</h2>
            <Accordion type="single" collapsible className="w-full">
              <FAQItem 
                question="How does the lead management system work?" 
                answer="Our lead management system allows you to capture, track, and nurture leads through your sales funnel. You can create custom pipelines, set follow-up reminders, assign leads to team members, track lead sources, and easily convert leads into clients once they're ready."
              />
              <FAQItem 
                question="Can I integrate my email with ServiceCRM?" 
                answer="Yes, ServiceCRM offers email integration that allows you to send and receive emails directly from the platform. This keeps all your client communications in one place and enables you to set up email templates and automation for common messages."
              />
              <FAQItem 
                question="Does ServiceCRM have a calendar or scheduling feature?" 
                answer="Absolutely! ServiceCRM includes a powerful calendar feature that helps you manage appointments, set reminders, and avoid scheduling conflicts. You can also create a public booking page where clients can schedule appointments based on your availability."
              />
              <FAQItem 
                question="Can I process payments through ServiceCRM?" 
                answer="Yes, ServiceCRM integrates with popular payment processors, allowing you to accept payments, track invoices, and monitor revenue directly within the platform. This streamlines your billing process and helps you get paid faster."
              />
              <FAQItem 
                question="Is there a mobile app available?" 
                answer="ServiceCRM is fully responsive and works great on mobile browsers. We also offer dedicated mobile apps for iOS and Android, allowing you to manage your business on the go, access client information, and receive notifications wherever you are."
              />
            </Accordion>
          </div>
          
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Pricing & Plans</h2>
            <Accordion type="single" collapsible className="w-full">
              <FAQItem 
                question="What's included in the free plan?" 
                answer="The free plan includes all core CRM functionality: lead and client management, basic email integration, appointment scheduling, and limited access to reporting features. Free plans can manage up to 50 leads and clients with single-user access."
              />
              <FAQItem 
                question="What are the benefits of upgrading to a paid plan?" 
                answer="Paid plans offer unlimited leads and clients, advanced email integration, payment processing, custom pipelines, analytics, team collaboration features, API access, priority support, and various integrations with other business tools you may already use."
              />
              <FAQItem 
                question="How does billing work for paid plans?" 
                answer="Paid plans are available on monthly or annual billing cycles, with a discount for annual commitments. You can upgrade, downgrade, or cancel your subscription at any time through your account settings."
              />
              <FAQItem 
                question="Is there a limit to how many users I can add?" 
                answer="The Free plan is limited to a single user. Pro plans include up to 5 team members, and Enterprise plans allow for unlimited users with role-based permissions. Additional user seats can be purchased on any paid plan."
              />
              <FAQItem 
                question="Do you offer discounts for nonprofits or educational institutions?" 
                answer="Yes! We offer special pricing for qualifying nonprofit organizations, educational institutions, and startups. Contact our sales team to learn more about our discount programs."
              />
            </Accordion>
          </div>
          
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Security & Privacy</h2>
            <Accordion type="single" collapsible className="w-full">
              <FAQItem 
                question="How secure is my data in ServiceCRM?" 
                answer="Security is our top priority. ServiceCRM employs industry-standard encryption for all data both in transit and at rest. We use secure data centers with regular backups, strict access controls, and comprehensive security protocols to keep your information safe."
              />
              <FAQItem 
                question="Is ServiceCRM GDPR compliant?" 
                answer="Yes, ServiceCRM is fully GDPR compliant. We provide tools to help you manage consent, handle data subject requests, maintain data processing records, and fulfill your obligations under GDPR and other privacy regulations."
              />
              <FAQItem 
                question="Who owns the data I put into ServiceCRM?" 
                answer="You retain full ownership of all your data. We do not sell or share your information with third parties. Our role is purely as a data processor, and we only use your data to provide and improve our services to you."
              />
              <FAQItem 
                question="What happens to my data if I cancel my account?" 
                answer="If you cancel your account, you can export your data first. After cancellation, your data remains in our systems for 30 days, during which time you can reactivate your account if needed. After 30 days, your data is permanently deleted from our active systems and backups."
              />
              <FAQItem 
                question="Do you have a backup system in place?" 
                answer="Yes, we perform regular, automated backups of all customer data. Our backup system ensures that your information is protected against accidental loss and can be restored quickly in the unlikely event of a system failure."
              />
            </Accordion>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Support & Resources</h2>
            <Accordion type="single" collapsible className="w-full">
              <FAQItem 
                question="What kind of support does ServiceCRM offer?" 
                answer="All users, including those on the free plan, have access to our knowledge base, community forum, and email support. Paid plans include priority support with faster response times, and Enterprise plans include dedicated account managers and phone support."
              />
              <FAQItem 
                question="Is there training available for new users?" 
                answer="Yes! We offer free getting-started webinars, video tutorials, a comprehensive knowledge base, and step-by-step guides. Paid plans also include personalized onboarding sessions to help you set up your CRM optimally for your specific business needs."
              />
              <FAQItem 
                question="Can I request new features?" 
                answer="Absolutely! We welcome feature requests from all users. You can submit ideas through our feedback portal, where other users can upvote and comment on suggestions. Our product roadmap is heavily influenced by user feedback."
              />
              <FAQItem 
                question="How often do you release updates?" 
                answer="We release minor updates and improvements weekly, with major feature additions typically rolled out on a monthly or quarterly basis. All updates are automatically applied to your account with no action required on your part."
              />
              <FAQItem 
                question="What if I still have questions?" 
                answer="If you can't find answers to your questions in our FAQ or knowledge base, please don't hesitate to contact us directly. You can reach our support team via email at support@servicecrm.com or through the contact form on our website."
              />
            </Accordion>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Our team is here to help. Contact us and we'll get back to you as soon as possible.
            </p>
            <Button 
              size="lg"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to get started with ServiceCRM?</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Join thousands of businesses who trust ServiceCRM to manage their client relationships.
            </p>
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign Up For Free
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

// Helper Component
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  return (
    <AccordionItem value={question}>
      <AccordionTrigger className="text-left font-medium">{question}</AccordionTrigger>
      <AccordionContent className="text-gray-600">{answer}</AccordionContent>
    </AccordionItem>
  );
};

export default FAQPage;
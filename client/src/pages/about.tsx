import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import LandingLayout from '../components/landing/landing-layout';

const AboutPage = () => {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">About ServiceCRM</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Building the most powerful, yet simple CRM solution for businesses of all types and sizes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At ServiceCRM, we believe that every business deserves powerful tools to manage client relationships, 
                without the complexity and high costs that often come with enterprise CRM systems.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Our mission is to democratize customer relationship management by providing a 
                sophisticated yet intuitive platform that helps businesses of all sizes streamline their operations, 
                enhance customer experiences, and drive growth.
              </p>
              <p className="text-lg text-gray-600">
                We're committed to continuous innovation and improvement, always listening to our users' 
                feedback to build features that truly matter to your business success.
              </p>
            </div>
            <div className="relative">
              <div className="bg-primary-50 rounded-xl p-8 relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Team meeting" 
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-primary/10 rounded-full z-0"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/10 rounded-full z-0"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do at ServiceCRM.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ValueCard 
              title="Simplicity"
              description="We believe that powerful software doesn't have to be complicated. We're committed to creating intuitive experiences that require minimal training."
              iconClass="bg-blue-100"
              iconPath="M13 10V3L4 14h7v7l9-11h-7z"
            />
            <ValueCard 
              title="Accessibility"
              description="Great CRM tools should be available to everyone, regardless of technical skill or budget. That's why we offer a free tier for small businesses."
              iconClass="bg-green-100"
              iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
            <ValueCard 
              title="Innovation"
              description="We're always learning, improving, and adding features that help our users work more efficiently and build stronger client relationships."
              iconClass="bg-purple-100"
              iconPath="M9.663 17h4.673M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707m-12.728 12l-.707-.707m12.728 0l-.707.707"
            />
            <ValueCard 
              title="Customer Focus"
              description="Our customers' success is our success. We listen carefully to feedback and prioritize features that will make the most impact for users."
              iconClass="bg-yellow-100"
              iconPath="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Leadership Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The experienced professionals building the future of ServiceCRM.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TeamMember 
              name="Alex Rodriguez"
              role="Founder & CEO"
              bio="With over 15 years of experience in SaaS and CRM development, Alex founded ServiceCRM to make powerful business tools accessible to everyone."
              image="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&h=256&q=80"
            />
            <TeamMember 
              name="Samantha Chen"
              role="Chief Technology Officer"
              bio="Samantha leads our engineering team, bringing expertise from her previous roles at major tech companies and a passion for building elegant solutions."
              image="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&h=256&q=80"
            />
            <TeamMember 
              name="Michael Washington"
              role="Head of Customer Success"
              bio="Michael ensures our customers get the most from ServiceCRM, leading our support and onboarding teams with his extensive background in customer service."
              image="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&h=256&q=80"
            />
            <TeamMember 
              name="Priya Patel"
              role="Product Director"
              bio="With a background in both design and business, Priya ensures ServiceCRM evolves to meet the changing needs of our diverse customer base."
              image="https://images.unsplash.com/photo-1619088252575-963029de13f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&h=256&q=80"
            />
            <TeamMember 
              name="David Kim"
              role="Marketing Director"
              bio="David brings over a decade of experience in SaaS marketing, focusing on helping businesses understand how ServiceCRM can transform their operations."
              image="https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&h=256&q=80"
            />
            <TeamMember 
              name="Rachel Torres"
              role="Finance & Operations"
              bio="Rachel oversees our business operations, ensuring ServiceCRM's sustainable growth while maintaining our commitment to value for our customers."
              image="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&h=256&q=80"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to transform your business?</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Join thousands of businesses who trust ServiceCRM to manage their client relationships.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
                onClick={() => window.location.href = '/api/login'}
              >
                Get Started For Free
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

// Helper Components
const ValueCard = ({ title, description, iconClass, iconPath }: { title: string, description: string, iconClass: string, iconPath: string }) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={`w-12 h-12 rounded-full ${iconClass} flex items-center justify-center mb-4`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const TeamMember = ({ name, role, bio, image }: { name: string, role: string, bio: string, image: string }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <img 
        src={image} 
        alt={name} 
        className="w-full h-64 object-cover object-center"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
        <p className="text-primary font-medium mb-3">{role}</p>
        <p className="text-gray-600">{bio}</p>
      </div>
    </div>
  );
};

export default AboutPage;
import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import LandingLayout from '@/components/landing/landing-layout';

const PrivacyPolicyPage = () => {
  return (
    <LandingLayout>
      {/* Header Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Last updated: May 10, 2023</p>
          </div>
          
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600">
            <p>
              At ServiceCRM, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our customer relationship management platform.
            </p>
            
            <p>
              Please read this policy carefully. If you do not agree with the terms of this privacy policy, 
              please do not access the application.
            </p>
            
            <h2>Information We Collect</h2>
            
            <h3>Personal Data</h3>
            <p>
              We may collect personal information that you voluntarily provide to us when you register for an account, 
              express interest in obtaining information about us or our products, or otherwise contact us. The personal 
              information we collect may include:
            </p>
            <ul>
              <li>Name, email address, and contact information</li>
              <li>Username and password</li>
              <li>Billing information and payment details</li>
              <li>Business information (company name, role, industry)</li>
              <li>Preferences and feedback</li>
            </ul>
            
            <h3>Client Data</h3>
            <p>
              As a CRM service, our platform is designed to store information about your clients and leads. This data is 
              provided by you and may include personal information about your clients. You are responsible for 
              obtaining the necessary consents from your clients to store their information in our system.
            </p>
            
            <h3>Automatically Collected Information</h3>
            <p>
              When you access our service, we may automatically collect certain information about your device and usage, 
              including:
            </p>
            <ul>
              <li>Device information (browser type, operating system, IP address)</li>
              <li>Log data (access times, pages viewed, features used)</li>
              <li>Location information (country or region)</li>
              <li>Usage patterns and preferences</li>
            </ul>
            
            <h2>How We Use Your Information</h2>
            
            <p>We may use the information we collect for various purposes, including to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative information, such as updates, security alerts, and support messages</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Protect against and prevent fraud, unauthorized transactions, and other illegal activities</li>
              <li>Comply with legal obligations</li>
            </ul>
            
            <h2>Disclosure of Your Information</h2>
            
            <p>We may share your information in the following situations:</p>
            <ul>
              <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, and contractors who perform services for us or on our behalf.</li>
              <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with a merger, acquisition, reorganization, sale of assets, or bankruptcy.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
              <li><strong>With Your Consent:</strong> We may disclose your information for any other purpose with your consent.</li>
            </ul>
            
            <h2>Data Security</h2>
            
            <p>
              We implement appropriate technical and organizational measures to protect the security of your personal information. 
              However, please understand that no method of transmission over the internet or electronic storage is 100% secure, 
              and we cannot guarantee absolute security.
            </p>
            
            <h2>Your Data Protection Rights</h2>
            
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul>
              <li>The right to access and receive a copy of your personal information</li>
              <li>The right to rectify or update your personal information</li>
              <li>The right to erase your personal information</li>
              <li>The right to restrict processing of your personal information</li>
              <li>The right to object to processing of your personal information</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
            
            <p>
              If you wish to exercise any of these rights, please contact us using the contact information provided at the end of this policy.
            </p>
            
            <h2>Data Retention</h2>
            
            <p>
              We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this privacy policy, 
              unless a longer retention period is required or permitted by law. When we no longer need to process your information, 
              we will either delete or anonymize it.
            </p>
            
            <h2>Children's Privacy</h2>
            
            <p>
              Our service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. 
              If we become aware that we have collected personal information from a child without verification of parental consent, 
              we will take steps to remove that information from our servers.
            </p>
            
            <h2>Changes to This Privacy Policy</h2>
            
            <p>
              We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page 
              and updating the "Last updated" date at the top. You are advised to review this privacy policy periodically for any changes.
            </p>
            
            <h2>Contact Us</h2>
            
            <p>
              If you have any questions about this privacy policy or our practices, please contact us at:
            </p>
            <p>
              <strong>ServiceCRM</strong><br />
              Email: privacy@servicecrm.com<br />
              Address: 123 Business Avenue, Suite 200, New York, NY 10001
            </p>
          </div>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/terms">Terms of Service</Link>
            </Button>
            <Button asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default PrivacyPolicyPage;
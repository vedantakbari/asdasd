import { storage } from "./storage";
import { EmailAccount } from "@shared/schema";
import nodemailer from "nodemailer";

interface EmailMessage {
  from: string;
  fromName?: string;
  to: string;
  toName?: string; 
  subject: string;
  text?: string;
  html?: string;
  relatedLeadId?: number;
  relatedCustomerId?: number;
}

/**
 * Email service for sending and managing emails
 */
export class EmailService {
  /**
   * Create a nodemailer transport for the given email account
   */
  private createTransport(account: EmailAccount) {
    return nodemailer.createTransport({
      host: account.smtpHost || 'smtp.gmail.com',
      port: account.smtpPort ? parseInt(account.smtpPort) : 587,
      secure: account.useSSL || false,
      auth: {
        user: account.email,
        pass: account.password,
      }
    });
  }

  /**
   * Send an email using the specified account
   */
  async sendEmail(accountId: number, message: EmailMessage): Promise<boolean> {
    try {
      const account = await storage.getEmailAccount(accountId);
      
      if (!account || !account.connected) {
        throw new Error("Email account not found or not connected");
      }

      // Create transport
      const transport = this.createTransport(account);
      
      // Prepare email data
      const emailData = {
        from: `${message.fromName || account.displayName || ''} <${account.email}>`,
        to: message.toName ? `${message.toName} <${message.to}>` : message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      };
      
      // Send email
      await transport.sendMail(emailData);
      
      // Log email activity
      if (message.relatedLeadId || message.relatedCustomerId) {
        await storage.createActivity({
          userId: account.userId,
          activityType: 'email_sent',
          description: `Email sent: ${message.subject}`,
          relatedLeadId: message.relatedLeadId || null,
          relatedCustomerId: message.relatedCustomerId || null,
          metadata: {
            to: message.to,
            subject: message.subject,
            snippet: message.text?.substring(0, 100) || ''
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Get emails for a specific account and folder
   */
  async getEmails(accountId: number, folder: string = 'inbox'): Promise<any[]> {
    try {
      const account = await storage.getEmailAccount(accountId);
      
      if (!account || !account.connected) {
        throw new Error("Email account not found or not connected");
      }

      // For now, we're returning simulated emails
      // In a full implementation, we would connect to the email provider's API
      // using IMAP or OAuth and retrieve actual emails
      return this.generateSimulatedEmails(account, folder);
    } catch (error) {
      console.error("Error fetching emails:", error);
      return [];
    }
  }

  /**
   * Generate simulated emails for demonstration
   * In a real implementation, this would be replaced with actual email fetching
   */
  private generateSimulatedEmails(account: EmailAccount, folder: string): any[] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    // Example emails would be returned if we're not connected to a real email service
    const emails = [
      {
        id: `${folder}-1`,
        from: 'alice.johnson@example.com',
        fromName: 'Alice Johnson',
        to: account.email,
        toName: account.displayName || '',
        subject: 'Interested in your services',
        body: `Hello,\n\nI'm interested in getting a quote for your services. Could you please send me some information?\n\nBest regards,\nAlice Johnson`,
        date: oneDayAgo,
        read: false,
        folder: folder === 'inbox' ? 'inbox' : folder,
        leadId: null
      },
      {
        id: `${folder}-2`,
        from: 'mike.smith@example.com',
        fromName: 'Mike Smith',
        to: account.email,
        toName: account.displayName || '',
        subject: 'Follow-up from our meeting',
        body: `Hi there,\n\nJust wanted to follow up after our meeting. I'm very interested in proceeding with the project we discussed.\n\nThanks,\nMike Smith`,
        date: now,
        read: false,
        folder: folder === 'inbox' ? 'inbox' : folder,
        leadId: 1
      },
      {
        id: `${folder}-3`,
        from: account.email,
        fromName: account.displayName || '',
        to: 'james.wilson@example.com',
        toName: 'James Wilson',
        subject: 'Your recent inquiry',
        body: `Dear James,\n\nThank you for your interest in our services. As requested, I've attached a detailed proposal for your project.\n\nPlease let me know if you have any questions or would like to make any adjustments.\n\nBest regards,\n${account.displayName || 'Your Name'}`,
        date: twoDaysAgo,
        read: true,
        folder: folder === 'sent' ? 'sent' : folder,
        leadId: null
      }
    ];
    
    // Filter by the requested folder
    return emails.filter(email => email.folder === folder);
  }
}

export const emailService = new EmailService();
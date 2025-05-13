import nodemailer from 'nodemailer';
import { storage } from './storage';
import { type EmailAccount } from '@shared/schema';

interface EmailMessage {
  from: string;
  fromName?: string;
  to: string;
  toName?: string; 
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
  relatedLeadId?: number;
  relatedCustomerId?: number;
}

/**
 * Email service for sending and managing emails
 */
export class EmailService {
  // Store transporter cache to avoid recreating for each email
  private transporters: Map<number, nodemailer.Transporter> = new Map();
  
  /**
   * Create a nodemailer transport for the given email account
   */
  private createTransport(account: EmailAccount): nodemailer.Transporter {
    // Check if we already have a transporter for this account
    if (this.transporters.has(account.id)) {
      return this.transporters.get(account.id)!;
    }
    
    // Create a new transporter
    const transport = nodemailer.createTransport({
      host: account.smtpHost || 'smtp.gmail.com', // Default to Gmail as fallback
      port: parseInt(account.smtpPort || '587'),
      secure: account.smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: account.email,
        pass: account.password || '',
      }
    });
    
    // Store in cache
    this.transporters.set(account.id, transport);
    
    return transport;
  }
  
  /**
   * Send an email using the specified account
   */
  async sendEmail(accountId: number, message: EmailMessage): Promise<boolean> {
    try {
      const account = await storage.getEmailAccount(accountId);
      
      if (!account) {
        console.error(`Email account with ID ${accountId} not found`);
        return false;
      }
      
      const transport = this.createTransport(account);
      
      // Build the email message
      const mailOptions = {
        from: message.fromName 
          ? `"${message.fromName}" <${message.from || account.email}>`
          : message.from || account.email,
        to: message.toName
          ? `"${message.toName}" <${message.to}>`
          : message.to,
        subject: message.subject,
        text: message.text,
        html: message.html
      };
      
      // Send the email
      const info = await transport.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      // Save the sent email to storage
      await storage.saveEmailMessage({
        accountId,
        from: message.from || account.email,
        fromName: message.fromName || account.displayName,
        to: message.to,
        toName: message.toName,
        subject: message.subject,
        textBody: message.text,
        htmlBody: message.html,
        sentDate: new Date(), 
        receivedDate: null,
        read: true,
        folder: 'sent',
        messageId: info.messageId || message.messageId,
        externalId: null,
        relatedLeadId: message.relatedLeadId || null,
        relatedCustomerId: message.relatedCustomerId || null
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  /**
   * Get emails for a specific account and folder
   */
  async getEmails(accountId: number, folder: string = 'inbox'): Promise<any[]> {
    try {
      const account = await storage.getEmailAccount(accountId);
      
      if (!account) {
        console.error(`Email account with ID ${accountId} not found`);
        return [];
      }
      
      // For now, get emails from storage (simulated)
      // In a real implementation, we would fetch emails from the IMAP server
      const emails = await storage.getEmailMessages(accountId, folder);
      
      // If no emails in storage, generate some simulated ones for demonstration
      if (emails.length === 0 && folder === 'inbox') {
        return this.generateSimulatedEmails(account, folder);
      }
      
      return emails;
    } catch (error) {
      console.error(`Error fetching emails for account ${accountId}:`, error);
      return [];
    }
  }
  
  /**
   * Generate simulated emails for demonstration
   * In a real implementation, this would be replaced with actual email fetching
   */
  private generateSimulatedEmails(account: EmailAccount, folder: string): any[] {
    if (folder !== 'inbox') {
      return [];
    }
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    const sampleEmails = [
      {
        accountId: account.id,
        from: 'client1@example.com',
        fromName: 'Potential Client',
        to: account.email,
        toName: account.displayName,
        subject: 'Interested in Your Services',
        textBody: 'Hello,\n\nI came across your company and am interested in learning more about your services. Can you please provide some information?\n\nThank you,\nPotential Client',
        htmlBody: '<p>Hello,</p><p>I came across your company and am interested in learning more about your services. Can you please provide some information?</p><p>Thank you,<br>Potential Client</p>',
        sentDate: oneDayAgo,
        receivedDate: oneDayAgo,
        read: false,
        folder: 'inbox',
        messageId: `demo-${Date.now()}-1`,
        externalId: null,
        relatedLeadId: null,
        relatedCustomerId: null
      },
      {
        accountId: account.id,
        from: 'supplier@example.com',
        fromName: 'Supplier Inc.',
        to: account.email,
        toName: account.displayName,
        subject: 'Invoice #12345',
        textBody: 'Please find attached your monthly invoice.\n\nRegards,\nSupplier Inc.',
        htmlBody: '<p>Please find attached your monthly invoice.</p><p>Regards,<br>Supplier Inc.</p>',
        sentDate: twoDaysAgo,
        receivedDate: twoDaysAgo,
        read: true,
        folder: 'inbox',
        messageId: `demo-${Date.now()}-2`,
        externalId: null,
        relatedLeadId: null,
        relatedCustomerId: null
      }
    ];
    
    // Save these to storage so they persist
    sampleEmails.forEach(async (email) => {
      await storage.saveEmailMessage(email);
    });
    
    return sampleEmails;
  }
}

// Singleton instance
export const emailService = new EmailService();
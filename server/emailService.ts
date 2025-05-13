import { EmailAccount, EmailMessage } from '@shared/schema';
import { IStorage } from './storage';
import * as googleService from './googleService';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SyncResult {
  success: boolean;
  newMessages: number;
  error?: string;
}

export class EmailService {
  private account: EmailAccount;
  
  constructor(account: EmailAccount) {
    this.account = account;
  }
  
  /**
   * Test the Gmail connection to verify credentials
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.account.accessToken) {
        console.error("No access token available for Gmail account");
        return false;
      }
      
      // Try to fetch labels as a connection test
      await googleService.getGmailLabels(this.account.accessToken);
      return true;
    } catch (error) {
      console.error("Gmail connection test failed:", error);
      
      // Try to refresh the token if possible
      if (this.account.refreshToken) {
        try {
          console.log("Attempting to refresh Gmail token...");
          const refreshedTokens = await googleService.refreshAccessToken(this.account.refreshToken);
          
          if (refreshedTokens && refreshedTokens.access_token) {
            console.log("Successfully refreshed Gmail token");
            // Update the account with the new token (this will be saved by the caller)
            this.account.accessToken = refreshedTokens.access_token;
            return true;
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
        }
      }
      
      return false;
    }
  }
  
  /**
   * Send an email through Gmail API
   */
  async sendEmail(options: EmailOptions): Promise<SendResult> {
    try {
      if (!this.account.accessToken || !this.account.refreshToken) {
        throw new Error("Gmail account is not properly authenticated");
      }
      
      // Prepare the body content
      const body = options.html || options.text || '';
      
      // Send via Gmail API
      const result = await googleService.sendGmailMessage(
        this.account.accessToken,
        this.account.refreshToken,
        options.to,
        options.subject,
        body
      );
      
      return {
        success: true,
        messageId: result.id
      };
    } catch (error) {
      console.error("Error sending email via Gmail API:", error);
      
      // Try to refresh token and retry if possible
      if (error.message && error.message.includes('invalid_grant') && this.account.refreshToken) {
        try {
          console.log("Attempting to refresh token and retry sending...");
          const refreshedTokens = await googleService.refreshAccessToken(this.account.refreshToken);
          
          if (refreshedTokens && refreshedTokens.access_token) {
            this.account.accessToken = refreshedTokens.access_token;
            
            // Retry with new token
            const result = await googleService.sendGmailMessage(
              this.account.accessToken,
              this.account.refreshToken,
              options.to,
              options.subject,
              options.html || options.text || ''
            );
            
            return {
              success: true,
              messageId: result.id
            };
          }
        } catch (refreshError) {
          console.error("Failed to refresh token and retry:", refreshError);
        }
      }
      
      return {
        success: false,
        error: error.message || "Failed to send email via Gmail API"
      };
    }
  }
  
  /**
   * Synchronize emails from Gmail API
   */
  async syncMessages(storage: IStorage): Promise<SyncResult> {
    try {
      if (!this.account.accessToken || !this.account.refreshToken) {
        throw new Error("Gmail account is not properly authenticated");
      }
      
      // First, check when we last synced
      const lastSyncDate = this.account.lastSynced ? new Date(this.account.lastSynced) : null;
      
      // Build a query to get recent messages
      let query = '';
      if (lastSyncDate) {
        // Convert date to RFC3339 format for Gmail API
        const after = lastSyncDate.toISOString().split('T')[0]; // YYYY-MM-DD
        query = `after:${after}`;
      }
      
      // Fetch messages from Gmail API
      const messages = await googleService.listGmailMessages(
        this.account.accessToken,
        this.account.refreshToken,
        query,
        100 // Max results
      );
      
      console.log(`Retrieved ${messages.length} messages from Gmail API`);
      
      // Skip if no messages found
      if (!messages || messages.length === 0) {
        return {
          success: true,
          newMessages: 0
        };
      }
      
      // Count of new messages saved
      let newMessageCount = 0;
      
      // Save or update each message in our storage
      for (const gmailMessage of messages) {
        // Convert Gmail message format to our application format
        const messageData = {
          accountId: this.account.id,
          from: gmailMessage.from,
          fromName: gmailMessage.fromName,
          to: gmailMessage.to,
          toName: gmailMessage.toName,
          subject: gmailMessage.subject,
          textBody: gmailMessage.body,
          sentDate: gmailMessage.date,
          receivedDate: gmailMessage.date,
          read: gmailMessage.read,
          folder: gmailMessage.folder,
          messageId: gmailMessage.externalId,
          // Additional Gmail specific fields
          threadId: gmailMessage.threadId,
          snippet: gmailMessage.snippet,
          labelIds: gmailMessage.labelIds ? JSON.stringify(gmailMessage.labelIds) : undefined
        };
        
        // Check if this message already exists by external ID (Gmail ID)
        // Note: This would need a getEmailMessageByExternalId method, which we may need to add
        // For now, we'll save all messages and handle duplicates later
        await storage.saveEmailMessage(messageData);
        newMessageCount++;
      }
      
      // Update the last sync timestamp
      await storage.updateEmailAccount(this.account.id, {
        lastSynced: new Date(),
        connected: true
      });
      
      return {
        success: true,
        newMessages: newMessageCount
      };
    } catch (error) {
      console.error("Error syncing messages from Gmail API:", error);
      
      // Try to refresh token and retry if possible
      if (error.message && error.message.includes('invalid_grant') && this.account.refreshToken) {
        try {
          console.log("Attempting to refresh token and retry syncing...");
          const refreshedTokens = await googleService.refreshAccessToken(this.account.refreshToken);
          
          if (refreshedTokens && refreshedTokens.access_token) {
            this.account.accessToken = refreshedTokens.access_token;
            
            // Update the account with new token
            await storage.updateEmailAccount(this.account.id, {
              accessToken: refreshedTokens.access_token
            });
            
            // Recursive call to try again
            return this.syncMessages(storage);
          }
        } catch (refreshError) {
          console.error("Failed to refresh token and retry syncing:", refreshError);
        }
      }
      
      return {
        success: false,
        newMessages: 0,
        error: error.message || "Failed to sync messages from Gmail API"
      };
    }
  }
  
  /**
   * Get Gmail labels for the account
   */
  async getLabels(): Promise<any[]> {
    try {
      if (!this.account.accessToken) {
        throw new Error("Gmail account is not properly authenticated");
      }
      
      const labels = await googleService.getGmailLabels(this.account.accessToken);
      return labels;
    } catch (error) {
      console.error("Error fetching Gmail labels:", error);
      
      // Try to refresh token and retry if possible
      if (this.account.refreshToken) {
        try {
          const refreshedTokens = await googleService.refreshAccessToken(this.account.refreshToken);
          
          if (refreshedTokens && refreshedTokens.access_token) {
            this.account.accessToken = refreshedTokens.access_token;
            const labels = await googleService.getGmailLabels(this.account.accessToken);
            return labels;
          }
        } catch (refreshError) {
          console.error("Failed to refresh token and retry:", refreshError);
        }
      }
      
      throw error;
    }
  }
}
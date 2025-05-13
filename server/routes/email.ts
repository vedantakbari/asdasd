import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertEmailAccountSchema, insertEmailMessageSchema } from '@shared/schema';
import { isAuthenticated } from '../replitAuth';
import { EmailService } from '../emailService';

const router = express.Router();

// All email routes require authentication
router.use(isAuthenticated);

// Get all email accounts for the current user
router.get('/accounts', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accounts = await storage.getEmailAccountsByUser(userId);
    res.json(accounts);
  } catch (error) {
    console.error("Error fetching email accounts:", error);
    res.status(500).json({ message: "Failed to fetch email accounts" });
  }
});

// Get a specific email account
router.get('/accounts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const account = await storage.getEmailAccount(id);
    if (!account) {
      return res.status(404).json({ message: "Email account not found" });
    }
    
    res.json(account);
  } catch (error) {
    console.error("Error fetching email account:", error);
    res.status(500).json({ message: "Failed to fetch email account" });
  }
});

// Create a new email account
router.post('/accounts', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const validatedData = insertEmailAccountSchema.parse({
      ...req.body,
      userId
    });
    
    // Create the email account in storage
    const account = await storage.createEmailAccount(validatedData);
    
    // Test connection to verify account credentials
    try {
      const emailService = new EmailService(account);
      const isValid = await emailService.testConnection();
      
      if (!isValid) {
        // If connection fails, remove the account and return error
        await storage.deleteEmailAccount(account.id);
        return res.status(400).json({ 
          message: "Failed to connect with the provided credentials. Please check and try again."
        });
      }
      
      // Update account connection status
      await storage.updateEmailAccount(account.id, { connected: true });
    } catch (connError) {
      console.error("Error testing email connection:", connError);
      await storage.deleteEmailAccount(account.id);
      return res.status(400).json({ 
        message: "Failed to connect with the provided credentials. Please check and try again."
      });
    }
    
    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating email account:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid email account data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create email account" });
  }
});

// Update an email account
router.patch('/accounts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const existingAccount = await storage.getEmailAccount(id);
    if (!existingAccount) {
      return res.status(404).json({ message: "Email account not found" });
    }
    
    const validatedData = insertEmailAccountSchema.partial().parse(req.body);
    const updatedAccount = await storage.updateEmailAccount(id, validatedData);
    
    res.json(updatedAccount);
  } catch (error) {
    console.error("Error updating email account:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid email account data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update email account" });
  }
});

// Delete an email account
router.delete('/accounts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const success = await storage.deleteEmailAccount(id);
    if (!success) {
      return res.status(404).json({ message: "Email account not found" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting email account:", error);
    res.status(500).json({ message: "Failed to delete email account" });
  }
});

// Get email messages for an account (optionally filtered by folder)
router.get('/messages', async (req, res) => {
  try {
    const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
    const folder = req.query.folder as string | undefined;
    
    if (!accountId) {
      return res.status(400).json({ message: "accountId query parameter is required" });
    }
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: "Invalid accountId format" });
    }
    
    const account = await storage.getEmailAccount(accountId);
    if (!account) {
      return res.status(404).json({ message: "Email account not found" });
    }
    
    // Try to synchronize messages first (if account is connected)
    if (account.connected) {
      try {
        const emailService = new EmailService(account);
        await emailService.syncMessages(storage);
      } catch (syncError) {
        console.error("Error syncing messages:", syncError);
        // Continue with fetching existing messages even if sync fails
      }
    }
    
    const messages = await storage.getEmailMessages(accountId, folder);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching email messages:", error);
    res.status(500).json({ message: "Failed to fetch email messages" });
  }
});

// Get a specific email message
router.get('/messages/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const message = await storage.getEmailMessage(id);
    if (!message) {
      return res.status(404).json({ message: "Email message not found" });
    }
    
    res.json(message);
  } catch (error) {
    console.error("Error fetching email message:", error);
    res.status(500).json({ message: "Failed to fetch email message" });
  }
});

// Send a new email
router.post('/send', async (req, res) => {
  try {
    const { accountId, to, subject, textBody, htmlBody } = req.body;
    
    if (!accountId || !to || !subject || (!textBody && !htmlBody)) {
      return res.status(400).json({ 
        message: "Missing required fields: accountId, to, subject, and either textBody or htmlBody are required" 
      });
    }
    
    const account = await storage.getEmailAccount(parseInt(accountId));
    if (!account) {
      return res.status(404).json({ message: "Email account not found" });
    }
    
    // Send the email
    const emailService = new EmailService(account);
    const result = await emailService.sendEmail({
      to,
      subject,
      text: textBody,
      html: htmlBody
    });
    
    if (!result.success) {
      return res.status(500).json({ message: result.error || "Failed to send email" });
    }
    
    // Save the sent message to storage
    const sentMessage = await storage.saveEmailMessage({
      accountId: account.id,
      from: account.email,
      fromName: account.displayName || undefined,
      to,
      subject,
      textBody: textBody || undefined,
      htmlBody: htmlBody || undefined,
      sentDate: new Date(),
      read: true,
      folder: 'sent',
      messageId: result.messageId
    });
    
    res.status(200).json({ 
      success: true, 
      message: "Email sent successfully",
      sentMessage
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// Mark an email as read/unread
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const { read } = req.body;
    if (typeof read !== 'boolean') {
      return res.status(400).json({ message: "read field must be a boolean" });
    }
    
    const message = await storage.getEmailMessage(id);
    if (!message) {
      return res.status(404).json({ message: "Email message not found" });
    }
    
    const updatedMessage = await storage.updateEmailMessage(
      message.accountId, 
      message.messageId || '', 
      { read }
    );
    
    res.json(updatedMessage);
  } catch (error) {
    console.error("Error updating email read status:", error);
    res.status(500).json({ message: "Failed to update email read status" });
  }
});

// Move an email to another folder
router.patch('/messages/:id/move', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const { folder } = req.body;
    if (!folder || typeof folder !== 'string') {
      return res.status(400).json({ message: "folder field is required and must be a string" });
    }
    
    const message = await storage.getEmailMessage(id);
    if (!message) {
      return res.status(404).json({ message: "Email message not found" });
    }
    
    const updatedMessage = await storage.updateEmailMessage(
      message.accountId, 
      message.messageId || '', 
      { folder }
    );
    
    res.json(updatedMessage);
  } catch (error) {
    console.error("Error moving email to folder:", error);
    res.status(500).json({ message: "Failed to move email to folder" });
  }
});

// Delete an email
router.delete('/messages/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const success = await storage.deleteEmailMessage(id);
    if (!success) {
      return res.status(404).json({ message: "Email message not found" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting email message:", error);
    res.status(500).json({ message: "Failed to delete email message" });
  }
});

// Convert email to lead
router.post('/convert-to-lead', async (req, res) => {
  try {
    const { messageId, name, email, phone, notes } = req.body;
    
    if (!messageId || !name || !email) {
      return res.status(400).json({ 
        message: "Missing required fields: messageId, name, and email are required" 
      });
    }
    
    const message = await storage.getEmailMessage(parseInt(messageId));
    if (!message) {
      return res.status(404).json({ message: "Email message not found" });
    }
    
    // Create a new lead
    const lead = await storage.createLead({
      name,
      email,
      phone: phone || null,
      notes: notes || null,
      source: "Email",
      status: "New",
      isClient: false
    });
    
    // Update the email message to link it to the new lead
    await storage.updateEmailMessage(
      message.accountId,
      message.messageId || '',
      { relatedLeadId: lead.id }
    );
    
    // Create an activity for the lead
    await storage.createActivity({
      userId: 1, // Default to admin user
      activityType: "email_converted_to_lead",
      description: `Email converted to lead - ${name}`,
      relatedLeadId: lead.id
    });
    
    res.status(201).json({ 
      success: true, 
      lead,
      message: "Email successfully converted to lead"
    });
  } catch (error) {
    console.error("Error converting email to lead:", error);
    res.status(500).json({ message: "Failed to convert email to lead" });
  }
});

// Sync emails for an account
router.post('/sync/:accountId', async (req, res) => {
  try {
    const accountId = parseInt(req.params.accountId);
    if (isNaN(accountId)) {
      return res.status(400).json({ message: "Invalid account ID format" });
    }
    
    const account = await storage.getEmailAccount(accountId);
    if (!account) {
      return res.status(404).json({ message: "Email account not found" });
    }
    
    const emailService = new EmailService(account);
    const result = await emailService.syncMessages(storage);
    
    // Update last synced timestamp
    await storage.updateEmailAccount(accountId, { 
      lastSynced: new Date(),
      connected: true
    });
    
    res.json({ 
      success: true, 
      message: `Successfully synced ${result.newMessages} new messages`,
      syncedCount: result.newMessages
    });
  } catch (error) {
    console.error("Error syncing emails:", error);
    res.status(500).json({ message: "Failed to sync emails" });
  }
});

export default router;
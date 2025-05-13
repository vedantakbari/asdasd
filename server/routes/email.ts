import { Router } from 'express';
import { emailService } from '../emailService';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { z } from 'zod';
import { insertEmailAccountSchema, insertEmailMessageSchema } from '@shared/schema';

const router = Router();

// Get all email accounts for the current user
router.get('/accounts', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accounts = await storage.getEmailAccountsByUser(userId);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ message: 'Failed to fetch email accounts' });
  }
});

// Get a specific email account
router.get('/accounts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accountId = parseInt(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check if account belongs to user
    if (account.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this account' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Error fetching email account:', error);
    res.status(500).json({ message: 'Failed to fetch email account' });
  }
});

// Create a new email account
router.post('/accounts', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    // Validate the request body
    const accountData = insertEmailAccountSchema.parse({
      ...req.body,
      userId
    });
    
    // Create the account
    const account = await storage.createEmailAccount(accountData);
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating email account:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid account data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create email account' });
  }
});

// Update an email account
router.patch('/accounts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accountId = parseInt(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check if account belongs to user
    if (account.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this account' });
    }
    
    // Update the account
    const updatedAccount = await storage.updateEmailAccount(accountId, req.body);
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(500).json({ message: 'Failed to update email account' });
  }
});

// Delete an email account
router.delete('/accounts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accountId = parseInt(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check if account belongs to user
    if (account.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this account' });
    }
    
    // Delete the account
    await storage.deleteEmailAccount(accountId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({ message: 'Failed to delete email account' });
  }
});

// Get emails for a specific account and folder
router.get('/:accountId/messages', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accountId = parseInt(req.params.accountId);
    const folder = req.query.folder || 'inbox';
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check if account belongs to user
    if (account.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this account' });
    }
    
    // Get emails from service
    const emails = await emailService.getEmails(accountId, folder as string);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ message: 'Failed to fetch emails' });
  }
});

// Send a new email
router.post('/:accountId/send', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accountId = parseInt(req.params.accountId);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check if account belongs to user
    if (account.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to send from this account' });
    }
    
    // Validate email data
    const emailSchema = z.object({
      to: z.string(),
      subject: z.string(),
      text: z.string().optional(),
      html: z.string().optional(),
      relatedLeadId: z.number().nullable().optional(),
      relatedCustomerId: z.number().nullable().optional()
    });
    
    const emailData = emailSchema.parse(req.body);
    
    // Send the email
    const success = await emailService.sendEmail(accountId, {
      from: account.email,
      fromName: account.displayName,
      ...emailData
    });
    
    if (success) {
      res.status(201).json({ message: 'Email sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid email data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// Mark an email as read/unread
router.patch('/:accountId/messages/:messageId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const accountId = parseInt(req.params.accountId);
    const messageId = req.params.messageId;
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Check if account belongs to user
    if (account.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update emails in this account' });
    }
    
    // Validate update data
    const updateSchema = z.object({
      read: z.boolean().optional(),
      folder: z.string().optional(),
      relatedLeadId: z.number().nullable().optional(),
      relatedCustomerId: z.number().nullable().optional()
    });
    
    const updateData = updateSchema.parse(req.body);
    
    // First get the message by ID to update it
    const messages = await storage.getEmailMessages(accountId);
    const message = messages.find(msg => msg.messageId === messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Email message not found' });
    }
    
    // Update the message
    const updatedMessage = await storage.updateEmailMessage(message.id, updateData);
    
    if (updatedMessage) {
      res.json(updatedMessage);
    } else {
      res.status(404).json({ message: 'Email message not found' });
    }
  } catch (error) {
    console.error('Error updating email:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid update data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update email' });
  }
});

export default router;
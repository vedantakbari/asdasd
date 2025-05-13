import express from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { emailService } from '../emailService';
import { insertEmailAccountSchema } from '@shared/schema';
import { z } from 'zod';

const router = express.Router();

// Email account management
router.get('/accounts', isAuthenticated, async (req: any, res) => {
  try {
    const accounts = await storage.getEmailAccounts(req.user.claims.sub);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ message: 'Failed to fetch email accounts' });
  }
});

router.get('/accounts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const account = await storage.getEmailAccount(parseInt(req.params.id));
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Verify the account belongs to the authenticated user
    if (account.userId.toString() !== req.user.claims.sub) {
      return res.status(403).json({ message: 'Unauthorized access to email account' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Error fetching email account:', error);
    res.status(500).json({ message: 'Failed to fetch email account' });
  }
});

router.post('/accounts', isAuthenticated, async (req: any, res) => {
  try {
    const validatedData = insertEmailAccountSchema.parse({
      ...req.body,
      userId: parseInt(req.user.claims.sub)
    });
    
    const account = await storage.createEmailAccount(validatedData);
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating email account:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data provided', errors: error.errors });
    }
    
    res.status(500).json({ message: 'Failed to create email account' });
  }
});

router.put('/accounts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const existingAccount = await storage.getEmailAccount(accountId);
    
    if (!existingAccount) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Verify the account belongs to the authenticated user
    if (existingAccount.userId.toString() !== req.user.claims.sub) {
      return res.status(403).json({ message: 'Unauthorized access to email account' });
    }
    
    const updatedAccount = await storage.updateEmailAccount(accountId, req.body);
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(500).json({ message: 'Failed to update email account' });
  }
});

router.delete('/accounts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const existingAccount = await storage.getEmailAccount(accountId);
    
    if (!existingAccount) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Verify the account belongs to the authenticated user
    if (existingAccount.userId.toString() !== req.user.claims.sub) {
      return res.status(403).json({ message: 'Unauthorized access to email account' });
    }
    
    await storage.deleteEmailAccount(accountId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({ message: 'Failed to delete email account' });
  }
});

// Email send/receive
router.post('/send', isAuthenticated, async (req: any, res) => {
  try {
    const { accountId, to, subject, body, html, relatedLeadId, relatedCustomerId } = req.body;
    
    if (!accountId || !to || !subject || (!body && !html)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Verify the account belongs to the authenticated user
    if (account.userId.toString() !== req.user.claims.sub) {
      return res.status(403).json({ message: 'Unauthorized access to email account' });
    }
    
    // Send the email
    const success = await emailService.sendEmail(accountId, {
      from: account.email,
      fromName: account.displayName,
      to,
      subject,
      text: body,
      html,
      relatedLeadId: relatedLeadId ? parseInt(relatedLeadId) : undefined,
      relatedCustomerId: relatedCustomerId ? parseInt(relatedCustomerId) : undefined,
    });
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to send email' });
    }
    
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

router.get('/messages/:accountId/:folder', isAuthenticated, async (req: any, res) => {
  try {
    const accountId = parseInt(req.params.accountId);
    const folder = req.params.folder || 'inbox';
    
    const account = await storage.getEmailAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }
    
    // Verify the account belongs to the authenticated user
    if (account.userId.toString() !== req.user.claims.sub) {
      return res.status(403).json({ message: 'Unauthorized access to email account' });
    }
    
    // Get emails from the service
    const emails = await emailService.getEmails(accountId, folder);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ message: 'Failed to fetch emails' });
  }
});

export default router;
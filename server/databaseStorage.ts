import { 
  users, type User, type UpsertUser,
  emailAccounts, type EmailAccount, type InsertEmailAccount,
  emailMessages, type EmailMessage, type InsertEmailMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Email account methods
  async getEmailAccounts(): Promise<EmailAccount[]> {
    return await db.select().from(emailAccounts);
  }

  async getEmailAccountsByUser(userId: string): Promise<EmailAccount[]> {
    return await db.select().from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));
  }

  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    const [account] = await db.select().from(emailAccounts)
      .where(eq(emailAccounts.id, id));
    return account;
  }

  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [newAccount] = await db.insert(emailAccounts)
      .values({
        ...account,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newAccount;
  }

  async updateEmailAccount(id: number, account: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined> {
    // Create a cleaned update object with only the fields that exist in the table
    const updateObj: Record<string, any> = {};
    
    // Only add fields that are in the account and are valid column names
    if (account.provider !== undefined) updateObj.provider = account.provider;
    if (account.email !== undefined) updateObj.email = account.email;
    if (account.password !== undefined) updateObj.password = account.password;
    if (account.displayName !== undefined) updateObj.displayName = account.displayName;
    if (account.smtpHost !== undefined) updateObj.smtpHost = account.smtpHost;
    if (account.smtpPort !== undefined) updateObj.smtpPort = account.smtpPort;
    if (account.useSsl !== undefined) updateObj.useSsl = account.useSsl;
    if (account.accessToken !== undefined) updateObj.accessToken = account.accessToken;
    if (account.refreshToken !== undefined) updateObj.refreshToken = account.refreshToken;
    if (account.expiresAt !== undefined) updateObj.expiresAt = account.expiresAt;
    if (account.isDefault !== undefined) updateObj.isDefault = account.isDefault;
    if (account.connected !== undefined) updateObj.connected = account.connected;
    if (account.lastSynced !== undefined) updateObj.lastSynced = account.lastSynced;
    
    // Always add updatedAt
    updateObj.updatedAt = new Date();

    const [updatedAccount] = await db.update(emailAccounts)
      .set(updateObj)
      .where(eq(emailAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteEmailAccount(id: number): Promise<boolean> {
    try {
      await db.delete(emailAccounts)
        .where(eq(emailAccounts.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting email account:", error);
      return false;
    }
  }

  // Email message methods
  async getEmailMessages(accountId: number, folder?: string): Promise<EmailMessage[]> {
    if (folder) {
      return await db.select()
        .from(emailMessages)
        .where(and(
          eq(emailMessages.accountId, accountId),
          eq(emailMessages.folder, folder)
        ))
        .orderBy(desc(emailMessages.sentDate));
    } else {
      return await db.select()
        .from(emailMessages)
        .where(eq(emailMessages.accountId, accountId))
        .orderBy(desc(emailMessages.sentDate));
    }
  }

  async getEmailMessage(id: number): Promise<EmailMessage | undefined> {
    const [message] = await db.select().from(emailMessages)
      .where(eq(emailMessages.id, id));
    return message;
  }

  async saveEmailMessage(message: InsertEmailMessage): Promise<EmailMessage> {
    // Check if the message already exists by externalId
    let existingMessage = null;
    if (message.externalId) {
      const [existing] = await db.select().from(emailMessages)
        .where(and(
          eq(emailMessages.accountId, message.accountId),
          eq(emailMessages.externalId, message.externalId)
        ));
      existingMessage = existing;
    }

    if (existingMessage) {
      // Update existing message
      const [updatedMessage] = await db.update(emailMessages)
        .set({
          fromAddress: message.fromAddress,
          fromName: message.fromName,
          toAddress: message.toAddress,
          toName: message.toName,
          subject: message.subject,
          textBody: message.textBody,
          htmlBody: message.htmlBody,
          snippet: message.snippet,
          sentDate: message.sentDate,
          receivedDate: message.receivedDate,
          read: message.read,
          folder: message.folder,
          labelIds: message.labelIds,
          relatedLeadId: message.relatedLeadId,
          relatedCustomerId: message.relatedCustomerId,
          updatedAt: new Date()
        })
        .where(eq(emailMessages.id, existingMessage.id))
        .returning();
      return updatedMessage;
    } else {
      // Create new message
      const [newMessage] = await db.insert(emailMessages)
        .values({
          ...message,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newMessage;
    }
  }

  async updateEmailMessage(accountId: number, messageId: string, updateData: Partial<EmailMessage>): Promise<EmailMessage | undefined> {
    // Find the message by accountId and externalId
    let existingMessage = null;
    if (messageId) {
      const [existing] = await db.select().from(emailMessages)
        .where(and(
          eq(emailMessages.accountId, accountId),
          eq(emailMessages.externalId, messageId)
        ));
      existingMessage = existing;
    }

    if (!existingMessage) {
      return undefined;
    }

    // Create a cleaned update object with only the fields that exist in the table
    const updateObj: Record<string, any> = {};
    
    // Only add fields that are in the updateData and are valid column names
    if (updateData.read !== undefined) updateObj.read = updateData.read;
    if (updateData.folder !== undefined) updateObj.folder = updateData.folder;
    if (updateData.labelIds !== undefined) updateObj.labelIds = updateData.labelIds;
    if (updateData.relatedLeadId !== undefined) updateObj.relatedLeadId = updateData.relatedLeadId;
    if (updateData.relatedCustomerId !== undefined) updateObj.relatedCustomerId = updateData.relatedCustomerId;
    
    // Always add updatedAt
    updateObj.updatedAt = new Date();

    // Update the message with specific fields
    const [updatedMessage] = await db.update(emailMessages)
      .set(updateObj)
      .where(eq(emailMessages.id, existingMessage.id))
      .returning();
    
    return updatedMessage;
  }

  async deleteEmailMessage(id: number): Promise<boolean> {
    try {
      await db.delete(emailMessages)
        .where(eq(emailMessages.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting email message:", error);
      return false;
    }
  }
  // For now we're focusing just on the auth-related methods
}
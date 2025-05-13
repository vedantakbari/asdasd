import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Check if Google API credentials are available
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Log warning if credentials are missing, but don't throw an error
// This allows the application to start without credentials
if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.warn('⚠️ Google API credentials are missing or incomplete. Gmail integration will not function properly.');
  console.warn('Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.');
}

// Check if credentials are available
export function hasValidCredentials(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}

// Define the scopes we need for Gmail access
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

/**
 * Create an OAuth2 client with the given credentials
 */
export function createAuthClient(): OAuth2Client {
  if (!hasValidCredentials()) {
    console.warn('Attempting to create auth client without valid credentials');
  }
  
  return new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
}

/**
 * Generate the authorization URL
 */
export function getAuthUrl(state?: string): string {
  if (!hasValidCredentials()) {
    throw new Error('Cannot generate auth URL: Google API credentials are missing or incomplete');
  }
  
  const oauth2Client = createAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state
  });
  
  console.log(`Generated Google auth URL with state: ${state ? state.substring(0, 20) + '...' : 'none'}`);
  return url;
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokens(code: string): Promise<any> {
  if (!hasValidCredentials()) {
    throw new Error('Cannot exchange token: Google API credentials are missing or incomplete');
  }
  
  const oauth2Client = createAuthClient();
  
  try {
    console.log('Exchanging authorization code for tokens');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Successfully obtained tokens');
    
    if (!tokens.refresh_token) {
      console.warn('Warning: No refresh token was returned. User may need to revoke access and try again.');
    }
    
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

/**
 * Get user info from the token
 */
export async function getUserInfo(accessToken: string): Promise<any> {
  const oauth2Client = createAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
  const people = google.people({ version: 'v1', auth: oauth2Client });
  const userInfo = await people.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses,names'
  });
  
  return userInfo.data;
}

/**
 * Get Gmail labels
 */
export async function getGmailLabels(accessToken: string): Promise<any> {
  const oauth2Client = createAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const response = await gmail.users.labels.list({
    userId: 'me'
  });
  
  return response.data.labels;
}

/**
 * List Gmail messages
 */
export async function listGmailMessages(accessToken: string, refreshToken: string, query: string = '', maxResults: number = 20): Promise<any> {
  const oauth2Client = createAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    // First get the list of message IDs
    const messageList = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults
    });
    
    if (!messageList.data.messages || messageList.data.messages.length === 0) {
      return [];
    }
    
    // Then fetch the full details of each message
    const messages = await Promise.all(
      messageList.data.messages.map(async (message) => {
        const response = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!
        });
        
        return parseGmailMessage(response.data);
      })
    );
    
    return messages;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

/**
 * Parse Gmail message to our format
 */
function parseGmailMessage(message: any): any {
  // Extract headers
  const headers = message.payload.headers.reduce((acc: any, header: any) => {
    acc[header.name.toLowerCase()] = header.value;
    return acc;
  }, {});
  
  // Extract body
  let body = '';
  
  if (message.payload.parts) {
    // Multi-part message, try to find plain text part
    const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain');
    if (textPart && textPart.body.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString();
    } else if (message.payload.parts[0] && message.payload.parts[0].body.data) {
      // Fallback to first part
      body = Buffer.from(message.payload.parts[0].body.data, 'base64').toString();
    }
  } else if (message.payload.body && message.payload.body.data) {
    // Simple message
    body = Buffer.from(message.payload.body.data, 'base64').toString();
  }
  
  // Extract labels
  const isUnread = message.labelIds && message.labelIds.includes('UNREAD');
  const folder = message.labelIds && message.labelIds.includes('SENT') ? 'sent' : 'inbox';
  
  // Parse the from field to extract name and email
  const from = headers.from || '';
  const fromMatch = from.match(/^(?:"?([^"]*)"?\s*)?<?([^\s<>@]+@[^\s<>@]+)>?$/);
  const fromName = fromMatch ? fromMatch[1] || '' : '';
  const fromEmail = fromMatch ? fromMatch[2] : from;
  
  // Parse the to field
  const to = headers.to || '';
  const toMatch = to.match(/^(?:"?([^"]*)"?\s*)?<?([^\s<>@]+@[^\s<>@]+)>?$/);
  const toName = toMatch ? toMatch[1] || '' : '';
  const toEmail = toMatch ? toMatch[2] : to;
  
  // Create our message format
  return {
    id: message.id,
    threadId: message.threadId,
    from: fromEmail,
    fromName: fromName,
    to: toEmail,
    toName: toName,
    subject: headers.subject || '(No Subject)',
    body: body,
    date: new Date(parseInt(message.internalDate)),
    read: !isUnread,
    folder: folder,
    labelIds: message.labelIds || [],
    snippet: message.snippet || '',
    externalId: message.id
  };
}

/**
 * Send a Gmail message
 */
export async function sendGmailMessage(
  accessToken: string, 
  refreshToken: string, 
  to: string, 
  subject: string, 
  body: string
): Promise<any> {
  const oauth2Client = createAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Create MIME message
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  
  const email = emailLines.join('\r\n').trim();
  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending Gmail message:', error);
    throw error;
  }
}

/**
 * Refresh the access token if needed
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = createAuthClient();
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token || '';
}
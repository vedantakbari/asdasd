import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Use functions to get the latest credentials from environment variables
function getClientId() {
  return process.env.GOOGLE_CLIENT_ID;
}

function getClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET;
}

function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI;
}

// Get current domain for alternative redirect URI if needed
const REPL_SLUG = process.env.REPL_SLUG;
const REPL_OWNER = process.env.REPL_OWNER;
const REPL_ID = process.env.REPL_ID;

function getAltRedirectUri() {
  if (REPL_SLUG && REPL_OWNER) {
    return `https://${REPL_SLUG}.${REPL_OWNER}.repl.co/api/auth/google/callback`;
  }
  return null;
}

// Initial debugging log
console.log("Google Redirect URI:", getRedirectUri());

// Log alternative URI for debugging
const initialAltUri = getAltRedirectUri();
if (initialAltUri) {
  console.log("Alternative Redirect URI:", initialAltUri);
}

// Function to refresh and log current configuration
export function refreshConfiguration() {
  console.log("Refreshing Google OAuth configuration");
  console.log("CLIENT_ID defined:", !!getClientId());
  console.log("CLIENT_SECRET defined:", !!getClientSecret());
  console.log("REDIRECT_URI:", getRedirectUri());
  
  const altUri = getAltRedirectUri();
  if (altUri) {
    console.log("Alternative Redirect URI:", altUri);
  }
}

// Log warning if credentials are missing, but don't throw an error
// This allows the application to start without credentials
if (!getClientId() || !getClientSecret() || !getRedirectUri()) {
  console.warn('⚠️ Google API credentials are missing or incomplete. Gmail integration will not function properly.');
  console.warn('Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.');
}

// Check if credentials are available
export function hasValidCredentials(): boolean {
  return !!(getClientId() && getClientSecret() && getRedirectUri());
}

// Helper function to get all possible redirect URIs
export function getAllPossibleRedirectURIs(): string[] {
  const redirectURIs: string[] = [];
  
  // Add the configured redirect URI from environment variable
  const configuredUri = getRedirectUri();
  if (configuredUri) {
    redirectURIs.push(configuredUri);
  }
  
  // Add the alternative Replit redirect URI
  const altUri = getAltRedirectUri();
  if (altUri) {
    redirectURIs.push(altUri);
  }
  
  // Add common Replit domains if we can detect them
  if (REPL_ID) {
    // Add .replit.dev domain variants
    redirectURIs.push(`https://${REPL_ID}.id.repl.co/api/auth/google/callback`);
    redirectURIs.push(`https://${REPL_ID}.id.replit.app/api/auth/google/callback`);
    redirectURIs.push(`https://${REPL_ID}.id.replit.dev/api/auth/google/callback`);
    
    // Add Replit preview domains if we can detect the slug and owner
    if (REPL_SLUG && REPL_OWNER) {
      redirectURIs.push(`https://${REPL_SLUG}.${REPL_OWNER}.repl.co/api/auth/google/callback`);
      redirectURIs.push(`https://${REPL_SLUG}-${REPL_OWNER}.repl.co/api/auth/google/callback`);
    }
  }
  
  // Remove duplicates
  return [...new Set(redirectURIs)];
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
 * @param forceNew If true, creates a new client with the most up-to-date credentials
 */
export function createAuthClient(forceNew: boolean = false): OAuth2Client {
  if (!hasValidCredentials()) {
    console.warn('Attempting to create auth client without valid credentials');
  }
  
  // Try to use the alternative redirect URI if the main one is failing
  // This helps when running on different Replit environments
  const redirectUri = getAltRedirectUri() || getRedirectUri();
  
  if (forceNew) {
    console.log("Creating new OAuth client with updated credentials");
    console.log("Using redirect URI:", redirectUri);
  }
  
  return new google.auth.OAuth2(
    getClientId(),
    getClientSecret(),
    redirectUri
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
  
  // Try with the default redirect URI first
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
    console.error('Error exchanging code for tokens with default redirect URI:', error);
    
    // If the first attempt fails, try with all possible redirect URIs
    const allRedirectURIs = getAllPossibleRedirectURIs();
    if (allRedirectURIs.length > 1) {
      console.log('Trying alternative redirect URIs...');
      
      for (const redirectURI of allRedirectURIs) {
        // Skip the one we already tried
        if (redirectURI === getRedirectUri() || redirectURI === getAltRedirectUri()) {
          continue;
        }
        
        try {
          console.log(`Trying with redirect URI: ${redirectURI}`);
          const altClient = new google.auth.OAuth2(
            getClientId(),
            getClientSecret(),
            redirectURI
          );
          
          const { tokens } = await altClient.getToken(code);
          console.log('Successfully obtained tokens with alternative redirect URI');
          
          if (!tokens.refresh_token) {
            console.warn('Warning: No refresh token was returned. User may need to revoke access and try again.');
          }
          
          return tokens;
        } catch (altError) {
          console.error(`Failed with alternative redirect URI ${redirectURI}:`, altError);
        }
      }
    }
    
    // If all attempts fail, throw the original error
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
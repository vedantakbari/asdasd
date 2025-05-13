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
    
    // Extract the domain from the configured URI
    const configuredUriObj = new URL(configuredUri);
    const configuredDomain = configuredUriObj.hostname;
    
    // Add variants of the configured domain
    const domainVariants = generateDomainVariants(configuredDomain);
    for (const variant of domainVariants) {
      if (variant !== configuredDomain) {
        const newUri = configuredUri.replace(configuredDomain, variant);
        redirectURIs.push(newUri);
      }
    }
  }
  
  // Add the alternative Replit redirect URI
  const altUri = getAltRedirectUri();
  if (altUri) {
    redirectURIs.push(altUri);
    
    // Extract domain from altUri and add variants
    try {
      const altUriObj = new URL(altUri);
      const altDomain = altUriObj.hostname;
      
      // Generate domain variants for the alternative domain
      const altDomainVariants = generateDomainVariants(altDomain);
      for (const variant of altDomainVariants) {
        if (variant !== altDomain) {
          const newUri = altUri.replace(altDomain, variant);
          redirectURIs.push(newUri);
        }
      }
    } catch (error) {
      console.error('Error parsing alternative URI:', error);
    }
  }
  
  // Add common Replit domains if we can detect them
  if (REPL_ID) {
    // Add .replit.dev domain variants
    redirectURIs.push(`https://${REPL_ID}.id.repl.co/api/auth/google/callback`);
    redirectURIs.push(`https://${REPL_ID}.id.replit.app/api/auth/google/callback`);
    redirectURIs.push(`https://${REPL_ID}.id.replit.dev/api/auth/google/callback`);
    
    // Add variants with hyphens
    redirectURIs.push(`https://-${REPL_ID}.id.repl.co/api/auth/google/callback`);
    redirectURIs.push(`https://-${REPL_ID}.id.replit.app/api/auth/google/callback`);
    redirectURIs.push(`https://-${REPL_ID}.id.replit.dev/api/auth/google/callback`);
    
    // Add Replit preview domains if we can detect the slug and owner
    if (REPL_SLUG && REPL_OWNER) {
      const baseDomains = [
        `https://${REPL_SLUG}.${REPL_OWNER}.repl.co/api/auth/google/callback`,
        `https://${REPL_SLUG}-${REPL_OWNER}.repl.co/api/auth/google/callback`,
        `https://${REPL_SLUG}.${REPL_OWNER}.replit.dev/api/auth/google/callback`,
        `https://${REPL_SLUG}-${REPL_OWNER}.replit.dev/api/auth/google/callback`
      ];
      
      for (const domain of baseDomains) {
        redirectURIs.push(domain);
      }
    }
  }
  
  // Remove duplicates and sort for readability
  return [...new Set(redirectURIs)].sort();
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
 * @param specificRedirectUri Optional specific redirect URI to use
 */
export function createAuthClient(forceNew: boolean = false, specificRedirectUri?: string): OAuth2Client {
  if (!hasValidCredentials()) {
    console.warn('Attempting to create auth client without valid credentials');
  }
  
  // Use the provided specific redirect URI if available
  let redirectUri = specificRedirectUri;
  
  // If no specific URI is provided, try to use the configured ones
  if (!redirectUri) {
    // Try to use the alternative redirect URI if the main one is failing
    // This helps when running on different Replit environments
    redirectUri = getRedirectUri() || getAltRedirectUri();
  }
  
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
// Helper function to generate domain variants for a given domain
export function generateDomainVariants(domain: string): string[] {
  const variants: string[] = [];
  
  if (!domain) return variants;
  
  // Add the original domain
  variants.push(domain);
  
  // Handle replit.dev domains
  if (domain.includes('.replit.dev')) {
    // Add repl.co variant
    variants.push(domain.replace('.replit.dev', '.repl.co'));
    
    // Add variant with hyphen prefix (common in Replit)
    if (!domain.startsWith('-')) {
      const parts = domain.split('.');
      if (parts.length >= 3) {
        const hyphenVariant = `-${parts[0]}.${parts.slice(1).join('.')}`;
        variants.push(hyphenVariant);
      }
    }
  }
  
  // Handle repl.co domains
  if (domain.includes('.repl.co')) {
    // Add replit.dev variant
    variants.push(domain.replace('.repl.co', '.replit.dev'));
    
    // Add variant with hyphen prefix
    if (!domain.startsWith('-')) {
      const parts = domain.split('.');
      if (parts.length >= 3) {
        const hyphenVariant = `-${parts[0]}.${parts.slice(1).join('.')}`;
        variants.push(hyphenVariant);
      }
    }
  }
  
  return [...new Set(variants)]; // Remove duplicates
}

export function getAuthUrl(state?: string): string {
  if (!hasValidCredentials()) {
    throw new Error('Cannot generate auth URL: Google API credentials are missing or incomplete');
  }
  
  // Parse domain and callback URL from state if available
  let domainInfo = {
    domain: '',
    callbackUrl: '',
    protocol: 'https'
  };
  
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
      domainInfo.domain = decodedState.domain || '';
      domainInfo.callbackUrl = decodedState.callbackUrl || '';
      domainInfo.protocol = decodedState.protocol || 'https';
      
      console.log('Auth request with state containing domain:', domainInfo.domain);
      console.log('Auth request with state containing callback URL:', domainInfo.callbackUrl);
    } catch (e) {
      console.error('Failed to decode state for domain extraction:', e);
    }
  }
  
  // Determine which redirect URI to use
  // If we have a callbackUrl in the state, use that as it's dynamically generated based on the current domain
  const detectedCallbackUrl = domainInfo.callbackUrl;
  
  // Create a custom client for this specific authorization URL
  let oauth2Client;
  
  if (detectedCallbackUrl) {
    console.log(`Using dynamically detected callback URL: ${detectedCallbackUrl}`);
    oauth2Client = createAuthClient(true, detectedCallbackUrl);
  } else {
    console.log(`Using configured callback URL: ${getRedirectUri()}`);
    oauth2Client = createAuthClient(false);
  }
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
    // Include_granted_scopes allows incremental authorization requests
    include_granted_scopes: true
  });
  
  console.log(`Generated Google auth URL with state: ${state ? state.substring(0, 20) + '...' : 'none'}`);
  return url;
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokens(code: string, providedRedirectUri?: string): Promise<any> {
  if (!hasValidCredentials()) {
    throw new Error('Cannot exchange token: Google API credentials are missing or incomplete');
  }
  
  console.log('Token exchange attempt for code:', code ? 'code-present' : 'no-code');
  
  // Track all our attempts
  const attemptedUris: string[] = [];
  let lastError: any = null;
  
  // If a specific redirect URI was provided, try that first
  if (providedRedirectUri) {
    console.log('Trying token exchange with provided redirect URI:', providedRedirectUri);
    attemptedUris.push(providedRedirectUri);
    
    try {
      const specificClient = new google.auth.OAuth2(
        getClientId(),
        getClientSecret(),
        providedRedirectUri
      );
      
      const { tokens } = await specificClient.getToken(code);
      console.log('Successfully obtained tokens with provided redirect URI!');
      
      // Update environment variable with successful redirect URI
      console.log('Updating GOOGLE_REDIRECT_URI with successful URI:', providedRedirectUri);
      process.env.GOOGLE_REDIRECT_URI = providedRedirectUri;
      
      if (!tokens.refresh_token) {
        console.warn('Warning: No refresh token was returned. User may need to revoke access and try again.');
      }
      
      return tokens;
    } catch (error) {
      console.error('Failed with provided redirect URI:', error.message);
      lastError = error;
      // Continue to try other URIs
    }
  }
  
  // Try with the default redirect URI if we haven't already
  const defaultUri = getRedirectUri();
  if (defaultUri && !attemptedUris.includes(defaultUri)) {
    console.log('Trying token exchange with default redirect URI:', defaultUri);
    attemptedUris.push(defaultUri);
    
    try {
      const defaultClient = new google.auth.OAuth2(
        getClientId(),
        getClientSecret(),
        defaultUri
      );
      
      const { tokens } = await defaultClient.getToken(code);
      console.log('Successfully obtained tokens with default redirect URI!');
      
      if (!tokens.refresh_token) {
        console.warn('Warning: No refresh token was returned. User may need to revoke access and try again.');
      }
      
      return tokens;
    } catch (error) {
      console.error('Failed with default redirect URI:', error.message);
      lastError = error;
      // Continue to try other URIs
    }
  }
  
  // Try all possible redirect URIs systematically
  console.log('Trying token exchange with all possible redirect URIs...');
  const allRedirectURIs = getAllPossibleRedirectURIs();
  
  // Log all the URIs we're going to try
  console.log(`Found ${allRedirectURIs.length} possible redirect URIs to try:`, 
    allRedirectURIs.map(uri => uri.split('/api/auth/google/callback')[0]).join('\n')
  );
  
  for (const redirectURI of allRedirectURIs) {
    // Skip URIs we've already tried
    if (attemptedUris.includes(redirectURI)) {
      console.log(`Skipping already tried redirect URI: ${redirectURI}`);
      continue;
    }
    
    console.log(`Attempting token exchange with URI: ${redirectURI}`);
    attemptedUris.push(redirectURI);
    
    try {
      const client = new google.auth.OAuth2(
        getClientId(),
        getClientSecret(),
        redirectURI
      );
      
      const { tokens } = await client.getToken(code);
      console.log('Successfully obtained tokens with redirect URI:', redirectURI);
      
      // Update environment variable with successful redirect URI
      console.log('Updating GOOGLE_REDIRECT_URI with successful URI:', redirectURI);
      process.env.GOOGLE_REDIRECT_URI = redirectURI;
      
      if (!tokens.refresh_token) {
        console.warn('Warning: No refresh token was returned. User may need to revoke access and try again.');
      }
      
      return tokens;
    } catch (error) {
      console.error(`Failed with redirect URI ${redirectURI}:`, error.message);
      lastError = error;
      // Continue trying other URIs
    }
  }
  
  // If we've tried all URIs and failed, throw a comprehensive error
  console.error(`All ${attemptedUris.length} token exchange attempts failed`);
  
  const errorMessage = lastError?.message || 'Unknown error';
  const enhancedError = new Error(`All token exchange attempts failed. Last error: ${errorMessage}. Tried ${attemptedUris.length} different redirect URIs.`);
  
  if (lastError?.stack) {
    enhancedError.stack = lastError.stack;
  }
  
  throw enhancedError;
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
// Add these routes to server/routes.ts
// Google credentials management
app.post('/api/settings/google-credentials', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    
    if (!clientId || !clientSecret) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client ID and Client Secret are required' 
      });
    }
    
    // Save credentials to environment variables
    process.env.GOOGLE_CLIENT_ID = clientId;
    process.env.GOOGLE_CLIENT_SECRET = clientSecret;
    process.env.GOOGLE_REDIRECT_URI = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    
    console.log('Google Credentials Updated');
    console.log('Refreshing Google OAuth configuration');
    
    // Log the configuration for debugging
    console.log(`CLIENT_ID defined: ${Boolean(process.env.GOOGLE_CLIENT_ID)}`);
    console.log(`CLIENT_SECRET defined: ${Boolean(process.env.GOOGLE_CLIENT_SECRET)}`);
    console.log(`REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI}`);
    console.log(`Alternative Redirect URI: ${process.env.GOOGLE_ALT_REDIRECT_URI || 'Not defined'}`);
    
    // Refresh the OAuth client configuration
    const { refreshConfiguration } = require('./googleService');
    refreshConfiguration();
    
    res.json({ 
      success: true, 
      message: 'Google API credentials saved successfully',
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    });
  } catch (error) {
    console.error('Error saving Google credentials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving Google API credentials' 
    });
  }
});

// Get Google credentials status
app.get('/api/google/credentials-status', (req, res) => {
  const clientId = Boolean(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = Boolean(process.env.GOOGLE_REDIRECT_URI);
  
  // We consider the configuration complete if we have both the client ID and secret
  const isConfigured = clientId && clientSecret;
  
  console.log('Google credentials status:', {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured
  });
  
  res.json({
    clientId,
    clientSecret,
    redirectUri,
    isConfigured
  });
});

// Update email sync settings
app.post('/api/email/sync-settings', (req, res) => {
  try {
    const { frequency, syncPastEmails, emailTracking, syncAllFolders } = req.body;
    
    // In a real app, save these settings to the database
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Email sync settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating email sync settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating email sync settings' 
    });
  }
});
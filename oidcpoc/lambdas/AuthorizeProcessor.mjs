import { 
  parseQueryString, 
  validateAuthorizationRequest,
  generateAuthorizationCode,
  createResponse 
} from './oidc_common_functions.mjs';

// In-memory store for authorization codes (in production, use Redis/DynamoDB)
const authorizationCodes = new Map();

export const handler = async (event) => {
  console.log('AuthorizeProcessor handling authorization request');
  
  // Parse query parameters
  const queryParams = parseQueryString(event.rawQueryString || '');
  console.log('Authorization params:', queryParams);
  
  // Validate required parameters
  const validationErrors = validateAuthorizationRequest(queryParams);
  if (validationErrors.length > 0) {
    return createResponse(400, {
      error: 'invalid_request',
      error_description: validationErrors.join(', ')
    });
  }
  
  // Check if client_id is the hardcoded one we support
  const hardcodedClientId = process.env.HARDCODEDCLIENTID;
  if (queryParams.client_id !== hardcodedClientId) {
    return createResponse(400, {
      error: 'invalid_client',
      error_description: 'Invalid client_id'
    });
  }
  
  // Validate redirect_uri (simplified validation)
  const redirectUri = queryParams.redirect_uri;
  if (!redirectUri.startsWith('https://') && !redirectUri.startsWith('http://localhost')) {
    return createResponse(400, {
      error: 'invalid_request',
      error_description: 'Invalid redirect_uri - must be HTTPS or localhost'
    });
  }
  
  // Generate authorization code
  const authCode = generateAuthorizationCode();
  const codeExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
  
  // Store authorization code with associated data
  authorizationCodes.set(authCode, {
    client_id: queryParams.client_id,
    redirect_uri: redirectUri,
    state: queryParams.state,
    nonce: queryParams.nonce,
    scope: queryParams.scope || 'openid',
    subject: 'user123', // Hardcoded user subject
    expires_at: codeExpiry
  });
  
  // Clean up expired codes periodically
  cleanupExpiredCodes();
  
  // Build redirect URL with authorization code
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('code', authCode);
  
  if (queryParams.state) {
    redirectUrl.searchParams.set('state', queryParams.state);
  }
  
  console.log('Redirecting to:', redirectUrl.toString());
  
  // Return redirect response
  return {
    statusCode: 302,
    headers: {
      'Location': redirectUrl.toString(),
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    },
    body: ''
  };
};

// Helper function to clean up expired authorization codes
const cleanupExpiredCodes = () => {
  const now = Date.now();
  for (const [code, data] of authorizationCodes.entries()) {
    if (data.expires_at < now) {
      authorizationCodes.delete(code);
    }
  }
};

// Export the authorization codes map for use by token endpoint
export { authorizationCodes };
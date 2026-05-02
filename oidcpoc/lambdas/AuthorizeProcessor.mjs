import { 
  parseQueryString, 
  validateAuthorizationRequest,
  generateAuthorizationCode,
  createResponse,
  getSigningKeys,
  createIdToken
} from './oidc_common_functions.mjs';

// In-memory store for authorization codes (in production, use Redis/DynamoDB)
const authorizationCodes = new Map();

export const handler = async (event) => {
  console.log('AuthorizeProcessor handling authorization request');
  console.log('HTTP Method:', event.httpMethod);
  
  let params = {};
  
  // Handle both GET and POST requests
  if (event.httpMethod === 'POST' || event.routeKey === 'POST /oauth2/authorize' || (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'POST')) {
    // Parse POST body (form-encoded data)
    const body = event.body || '';
    const isBase64Encoded = event.isBase64Encoded || false;
    const bodyContent = isBase64Encoded ? Buffer.from(body, 'base64').toString() : body;
    
    // Parse form-encoded data
    params = parseQueryString(bodyContent);
    console.log('Authorization params (POST):', params);
  } else {
    // Parse query parameters for GET requests
    params = parseQueryString(event.rawQueryString || '');
    console.log('Authorization params (GET):', params);
  }
  
  // check that claims parameter is correctly parsed if present (it should be a JSON string)
  if (params.claims) {
    try {
      params.claims = JSON.parse(params.claims);
      console.log('Parsed claims parameter:', params.claims);
    } catch (error) {
      console.error('Failed to parse claims parameter:', error);
      return createResponse(400, {
        error: 'invalid_request',
        error_description: 'Invalid claims parameter - must be a valid JSON string'
      });
    }
  }

  //if id_token_hint is present, decode it (without verifying signature) to extract any claims for reflecing back in the ID token for testing purposes
  if (params.id_token_hint) {
    try {
      const idTokenParts = params.id_token_hint.split('.');
      if (idTokenParts.length === 3) {
        const payload = Buffer.from(idTokenParts[1], 'base64').toString('utf-8');
        const decodedIdToken = JSON.parse(payload);
        console.log('Decoded id_token_hint:', decodedIdToken);
        
        // You can choose to reflect some of these claims back in the generated ID token for testing
        // For example, you could take the 'sub' claim from the hint and use it as the subject in the new ID token
        // Or you could include all claims from the hint in a custom claim in the new ID token
        //add the decoded claims from id_token_hint to the params object so they can be used later when creating the ID token
        params.id_token_hint_claims = decodedIdToken;
      } else {
        console.warn('id_token_hint is not a valid JWT format');
      }
    } catch (error) {
      console.error('Failed to decode id_token_hint:', error);
      // Not critical, so we can continue without failing the request, but log the error for debugging
    }
  }
  //log out all received parameters for debugging
  console.log('Received authorization request parameters:');
  for (const [key, value] of Object.entries(params)) {
    //check if value is a JSON object and stringify it for better logging
    if (typeof value === 'object') {
      console.log(`object  ${key}:`, JSON.stringify(value, null, 2));
    } else {
      console.log(`  ${key}:`, value);
    }
  }

  // Validate required parameters
  const validationErrors = validateAuthorizationRequest(params);
  if (validationErrors.length > 0) {
    return createResponse(400, {
      error: 'invalid_request',
      error_description: validationErrors.join(', ')
    });
  }
  
  // Check if client_id is the hardcoded one we support
  const hardcodedClientId = process.env.HARDCODEDCLIENTID;
  if (params.client_id !== hardcodedClientId) {
    return createResponse(400, {
      error: 'invalid_client',
      error_description: 'Invalid client_id'
    });
  }
  
  // Validate redirect_uri (simplified validation)
  const redirectUri = params.redirect_uri;
  if (!redirectUri.startsWith('https://') && !redirectUri.startsWith('http://localhost')) {
    return createResponse(400, {
      error: 'invalid_request',
      error_description: 'Invalid redirect_uri - must be HTTPS or localhost'
    });
  }
  
  // Determine response mode (defaults to 'query' if not specified)
  const responseMode = params.response_mode || 'query';
  
  // Handle different response types
  if (params.response_type === 'code') {
    return await handleAuthorizationCodeFlow(params, redirectUri, responseMode);
  } else if (params.response_type === 'id_token') {
    return await handleIdTokenFlow(params, redirectUri, responseMode);
  } else {
    return createResponse(400, {
      error: 'unsupported_response_type',
      error_description: 'Unsupported response_type'
    });
  }
};

// Handle authorization code flow (existing behavior)
const handleAuthorizationCodeFlow = async (params, redirectUri, responseMode) => {
  // Generate authorization code
  const authCode = generateAuthorizationCode();
  const codeExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
  
  // Store authorization code with associated data
  authorizationCodes.set(authCode, {
    client_id: params.client_id,
    redirect_uri: redirectUri,
    state: params.state,
    nonce: params.nonce,
    scope: params.scope || 'openid',
    subject: 'user123', // Hardcoded user subject
    expires_at: codeExpiry
  });
  
  // Clean up expired codes periodically
  cleanupExpiredCodes();
  
  // Build response with authorization code
  const responseParams = { code: authCode };
  if (params.state) {
    responseParams.state = params.state;
  }
  
  return buildAuthorizationResponse(redirectUri, responseParams, responseMode);
};

// Handle ID token flow (new)
const handleIdTokenFlow = async (params, redirectUri, responseMode) => {
  try {
    // Get signing keys from AWS Secrets Manager
    const signingKeys = await getSigningKeys();
    
    //log signing keys for debugging (do not log private key in production)
    console.log('Retrieved signing keys:', {
      kid: signingKeys.kid,
      publicKey: signingKeys.publicKey
    });

    // Generate ID token directly
    const issuer = process.env.ISSUER || 'https://oidcpoc-int.nhsdta.com';
    const subject = params.id_token_hint_claims?.sub || 'sctest20260108@NHSIAMLab.onmicrosoft.com'; // Use subject from id_token_hint if available
    const clientId = params.client_id;
    const nonce = params.nonce;

    // create additional arbitrary claims to include in the ID token for testing purposes
    const additionalClaims = {
      // Standard OIDC claims for hardcoded user
      name: params.id_token_hint_claims?.name || 'Smartcard User',
      given_name: params.id_token_hint_claims?.given_name || 'Smartcard',
      family_name: params.id_token_hint_claims?.family_name || 'User',
      email: params.id_token_hint_claims?.email || 'sctest20260108@NHSIAMLab.onmicrosoft.com',
      email_verified: params.id_token_hint_claims?.email_verified ?? true,
      preferred_username: params.id_token_hint_claims?.preferred_username || 'smartcarduser',
      upn: params.id_token_hint_claims?.upn || 'smartcarduser@nhs.net',
      oid: params.id_token_hint_claims?.oid || 'ac0653ac-8673-4632-bd68-0aca826e65fc',
      acr: 'possessionorinherence', //'urn:microsoft:policies:authentication:mfa',//'possessionorinherence',
      amr: ['otp']
    };
    
    const idToken = createIdToken(
      clientId,
      subject,
      issuer,
      nonce,
      signingKeys.privateKey,
      signingKeys.kid,
      additionalClaims
    );
    
    // Build response with ID token
    const responseParams = { id_token: idToken };
    if (params.state) {
      responseParams.state = params.state;
    }
    
    return buildAuthorizationResponse(redirectUri, responseParams, responseMode);
    
  } catch (error) {
    console.error('Error generating ID token:', error);
    return createResponse(500, {
      error: 'server_error',
      error_description: 'Failed to generate ID token'
    });
  }
};

// Build authorization response based on response mode
const buildAuthorizationResponse = (redirectUri, params, responseMode) => {
  console.log(`Building ${responseMode} response to:`, redirectUri);
  
  if (responseMode === 'form_post') {
    // Return HTML form that auto-submits to redirect_uri
    const formFields = Object.entries(params)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n    ');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
</head>
<body onload="document.forms[0].submit()">
  <form method="post" action="${redirectUri}">
    ${formFields}
  </form>
  <p>Redirecting...</p>
</body>
</html>`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      },
      body: html
    };
    
  } else if (responseMode === 'fragment') {
    // Return redirect with parameters in URL fragment
    const redirectUrl = new URL(redirectUri);
    const fragmentParams = new URLSearchParams(params).toString();
    redirectUrl.hash = fragmentParams;
    
    return {
      statusCode: 302,
      headers: {
        'Location': redirectUrl.toString(),
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      },
      body: ''
    };
    
  } else { // query mode (default)
    // Return redirect with parameters in query string
    const redirectUrl = new URL(redirectUri);
    Object.entries(params).forEach(([key, value]) => {
      redirectUrl.searchParams.set(key, value);
    });
    
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
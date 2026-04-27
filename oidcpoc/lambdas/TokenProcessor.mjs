import { URLSearchParams } from 'url';
import {
  getSigningKeys,
  createAccessToken,
  createIdToken,
  createResponse
} from './oidc_common_functions.mjs';
import { authorizationCodes } from './AuthorizeProcessor.mjs';

export const handler = async (event) => {
  console.log('TokenProcessor handling token request');
  
  // Only accept POST requests
  if (event.requestContext.http.method !== 'POST') {
    return createResponse(405, {
      error: 'invalid_request',
      error_description: 'Token endpoint only accepts POST requests'
    });
  }
  
  // Parse client credentials from Authorization header (Basic Auth)
  let clientId = null;
  let clientSecret = null;
  
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const [id, secret] = credentials.split(':');
      clientId = id;
      clientSecret = secret;
      console.log('Extracted client credentials from Basic auth');
    } catch (error) {
      console.error('Error parsing Basic auth header:', error);
      return createResponse(400, {
        error: 'invalid_client',
        error_description: 'Invalid Authorization header format'
      });
    }
  }

  // Parse form data from request body
  let requestBody;
  try {
    if (event.isBase64Encoded) {
      requestBody = Buffer.from(event.body, 'base64').toString('utf8');
    } else {
      requestBody = event.body || '';
    }
    
    const params = new URLSearchParams(requestBody);
    const tokenRequest = Object.fromEntries(params.entries());
    console.log('Token request params:', tokenRequest);
    
    // Validate grant_type
    if (tokenRequest.grant_type !== 'authorization_code') {
      return createResponse(400, {
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported'
      });
    }
    
    // Validate required parameters
    if (!tokenRequest.code) {
      return createResponse(400, {
        error: 'invalid_request',
        error_description: 'Missing authorization code'
      });
    }
    
    // Use client_id from Basic auth if available, otherwise from form data
    const finalClientId = clientId || tokenRequest.client_id;
    
    if (!finalClientId) {
      return createResponse(400, {
        error: 'invalid_client',
        error_description: 'Missing client_id (provide via Authorization header or form data)'
      });
    }

    if (!tokenRequest.redirect_uri) {
      return createResponse(400, {
        error: 'invalid_request',
        error_description: 'Missing redirect_uri'
      });
    }
    
    // Validate client credentials
    const hardcodedClientId = process.env.HARDCODEDCLIENTID;
    const hardcodedClientSecret = process.env.HARDCODEDCLIENTSECRET;
    
    if (finalClientId !== hardcodedClientId) {
      return createResponse(400, {
        error: 'invalid_client',
        error_description: 'Invalid client_id'
      });
    }
    
    //following checks are not required for this POC but would be required in a production implementation
    /*

    // If using Basic auth, validate client_secret
    if (clientId && clientSecret) {
      if (clientSecret !== hardcodedClientSecret) {
        return createResponse(400, {
          error: 'invalid_client',
          error_description: 'Invalid client_secret'
        });
      }
      console.log('Client authenticated via Basic auth');
    } else {
      console.log('Client authenticated via form data (client_id only)');
    }
   


    // Look up authorization code
    const codeData = authorizationCodes.get(tokenRequest.code);
    if (!codeData) {
      return createResponse(400, {
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code'
      });
    }
    
    // Validate authorization code hasn't expired
    if (Date.now() > codeData.expires_at) {
      authorizationCodes.delete(tokenRequest.code);
      return createResponse(400, {
        error: 'invalid_grant', 
        error_description: 'Authorization code has expired'
      });
    }
    
    // Validate redirect_uri matches
    if (tokenRequest.redirect_uri !== codeData.redirect_uri) {
      return createResponse(400, {
        error: 'invalid_grant',
        error_description: 'redirect_uri does not match authorization request'
      });
    }
    
    // Validate client_id matches
    if (finalClientId !== codeData.client_id) {
      return createResponse(400, {
        error: 'invalid_grant',
        error_description: 'client_id does not match authorization request'
      });
    }
      */
    
    // Get signing keys
    const keys = await getSigningKeys();
    const issuer = process.env.ISSUER;
    
    // Create access token
    const accessToken = createAccessToken(
      finalClientId,
      "subject123", // In a real implementation, this would come from the authorization code data
      issuer,
      finalClientId,
      keys.privateKey,
      keys.kid
    );
    
    // Create ID token (if openid scope was requested)
    let idToken = null;
    idToken = createIdToken(
      finalClientId,
      "subject123", // In a real implementation, this would come from the authorization code data
      issuer,
      tokenRequest.nonce,
      keys.privateKey,
      keys.kid
    );
    
    
    // Build token response
    const tokenResponse = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      scope: tokenRequest.scope || 'openid'
    };
    
    if (idToken) {
      tokenResponse.id_token = idToken;
    }
    
    console.log('Token exchange successful for subject:', "subject123");
    
    return createResponse(200, tokenResponse, {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    });
    
  } catch (error) {
    console.error('Token processing error:', error);
    return createResponse(400, {
      error: 'invalid_request',
      error_description: 'Invalid request format'
    });
  }
};
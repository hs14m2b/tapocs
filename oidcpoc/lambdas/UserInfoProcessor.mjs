import {
  getSigningKeys,
  verifyToken,
  getParameterCaseInsensitive,
  createResponse
} from './oidc_common_functions.mjs';

// Hardcoded user data for our single test user
const HARDCODED_USER_CLAIMS = {
  sub: 'user123',
  name: 'Test User',
  given_name: 'Test', 
  family_name: 'User',
  email: 'test@example.com',
  email_verified: true,
  preferred_username: 'testuser',
  picture: 'https://via.placeholder.com/150'
};

/**
 * Extract access token from Authorization header
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

export const handler = async (event) => {
  console.log('UserInfoProcessor handling userinfo request');
  
  try {
    // Extract Authorization header
    const authHeader = getParameterCaseInsensitive(event, 'authorization');
    if (!authHeader) {
      return createResponse(401, {
        error: 'invalid_token',
        error_description: 'Missing Authorization header'
      }, {
        'WWW-Authenticate': 'Bearer error="invalid_token"'
      });
    }
    
    // Extract Bearer token
    const accessToken = extractBearerToken(authHeader);
    if (!accessToken) {
      return createResponse(401, {
        error: 'invalid_token',
        error_description: 'Invalid Authorization header format'
      }, {
        'WWW-Authenticate': 'Bearer error="invalid_token"'
      });
    }
    
    // Get signing keys to verify token
    const keys = await getSigningKeys();
    
    // Verify and decode the access token
    const tokenPayload = verifyToken(accessToken, keys.publicKey);
    if (!tokenPayload) {
      return createResponse(401, {
        error: 'invalid_token',
        error_description: 'Invalid or expired access token'
      }, {
        'WWW-Authenticate': 'Bearer error="invalid_token"'
      });
    }
    
    console.log('Valid token for subject:', tokenPayload.sub);
    
    // Ensure token has required scope (openid or profile)
    const tokenScope = tokenPayload.scope || '';
    if (!tokenScope.includes('openid') && !tokenScope.includes('profile')) {
      return createResponse(403, {
        error: 'insufficient_scope',
        error_description: 'Token requires openid or profile scope'
      }, {
        'WWW-Authenticate': 'Bearer error="insufficient_scope"'
      });
    }
    
    // Return user claims based on requested scopes
    const userInfo = { sub: tokenPayload.sub };
    
    // Add profile claims if profile scope is requested
    if (tokenScope.includes('profile')) {
      userInfo.name = HARDCODED_USER_CLAIMS.name;
      userInfo.given_name = HARDCODED_USER_CLAIMS.given_name;
      userInfo.family_name = HARDCODED_USER_CLAIMS.family_name;
      userInfo.preferred_username = HARDCODED_USER_CLAIMS.preferred_username;
      userInfo.picture = HARDCODED_USER_CLAIMS.picture;
    }
    
    // Add email claims if email scope is requested
    if (tokenScope.includes('email')) {
      userInfo.email = HARDCODED_USER_CLAIMS.email;
      userInfo.email_verified = HARDCODED_USER_CLAIMS.email_verified;
    }
    
    console.log('UserInfo served for subject:', tokenPayload.sub);
    
    return createResponse(200, userInfo, {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    });
    
  } catch (error) {
    console.error('UserInfo processing error:', error);
    
    return createResponse(500, {
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
};
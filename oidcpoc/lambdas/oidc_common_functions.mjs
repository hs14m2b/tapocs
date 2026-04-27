import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const REGION = process.env.AWS_REGION || "eu-west-2";
const secretsClient = new SecretsManagerClient({ region: REGION });

const { sign, verify } = jwt;

/**
 * Get RSA private/public keys from AWS Secrets Manager
 */
export const getSigningKeys = async () => {
  const secretName = process.env.PRIVATEKEYSECRET;
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    const secret = JSON.parse(response.SecretString);
    
    return {
      privateKey: secret.private_key,
      publicKey: secret.public_key, 
      kid: secret.kid
    };
  } catch (error) {
    console.error('Error retrieving signing keys:', error);
    throw new Error('Failed to retrieve signing keys');
  }
};

/**
 * Create a signed JWT access token for OIDC
 */
export const createAccessToken = (clientId, subject, issuer, audience, privateKey, kid) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour
  
  const payload = {
    iss: issuer,
    sub: subject,
    aud: audience,
    exp: now + expiresIn,
    iat: now,
    client_id: clientId,
    scope: 'openid profile email',
    token_type: 'Bearer'
  };

  const options = {
    algorithm: 'RS256',
    keyid: kid
  };

  return sign(payload, privateKey, options);
};

/**
 * Create a signed JWT ID token for OIDC  
 */
export const createIdToken = (clientId, subject, issuer, nonce, privateKey, kid) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  // Hardcoded user claims
  const payload = {
    iss: issuer,
    sub: subject,
    aud: clientId,
    exp: now + expiresIn,
    iat: now,
    nonce: nonce,
    // Standard OIDC claims for hardcoded user
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    email: 'test@example.com',
    email_verified: true,
    preferred_username: 'testuser',
    picture: 'https://via.placeholder.com/150'
  };

  const options = {
    algorithm: 'RS256',
    keyid: kid
  };

  return sign(payload, privateKey, options);
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token, publicKey) => {
  try {
    return verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Generate authorization code
 */
export const generateAuthorizationCode = () => {
  return uuidv4().replace(/-/g, '');
};

/**
 * Generate PKCE code verifier
 */
export const generateCodeVerifier = () => {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
};

/**
 * Create JWKS (JSON Web Key Set) from public key
 */
export const createJWKS = (publicKey, kid) => {
  // This is a simplified version - in production you would properly parse the RSA public key
  // and extract the n and e values for the JWK format
  return {
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: kid,
        // Note: In production, you need to extract these from the actual public key
        n: 'placeholder-modulus',
        e: 'AQAB'
      }
    ]
  };
};

/**
 * Parse URL query parameters
 */
export const parseQueryString = (queryString) => {
  const params = {};
  if (!queryString) return params;
  
  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  
  return params;
};

/**
 * Get parameter case insensitive from event
 */
export const getParameterCaseInsensitive = (event, parameterName) => {
  const headers = event.headers || {};
  const lowerParamName = parameterName.toLowerCase();
  
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerParamName) {
      return value;
    }
  }
  
  return null;
};

/**
 * Create HTTP response
 */
export const createResponse = (statusCode, body, headers = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  return {
    statusCode,
    headers: { ...defaultHeaders, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
};

/**
 * Validate required OIDC parameters
 */
export const validateAuthorizationRequest = (params) => {
  const errors = [];
  
  if (!params.response_type) {
    errors.push('response_type is required');
  } else if (params.response_type !== 'code') {
    errors.push('Only authorization code flow (response_type=code) is supported');
  }
  
  if (!params.client_id) {
    errors.push('client_id is required');
  }
  
  if (!params.redirect_uri) {
    errors.push('redirect_uri is required');
  }
  
  return errors;
};
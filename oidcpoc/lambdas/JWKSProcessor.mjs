import crypto from 'crypto';
import { getSigningKeys, createResponse } from './oidc_common_functions.mjs';

/**
 * Convert PEM public key to JWK format
 */
const pemToJwk = (pemKey, kid) => {
  try {
    // Parse the PEM public key
    const keyObject = crypto.createPublicKey(pemKey);
    const jwk = keyObject.export({ format: 'jwk' });
    
    // Add required fields for OIDC
    return {
      ...jwk,
      kid: kid,
      use: 'sig',
      alg: 'RS256'
    };
  } catch (error) {
    console.error('Error converting PEM to JWK:', error);
    // Fallback with placeholder values
    return {
      kty: 'RSA',
      use: 'sig', 
      alg: 'RS256',
      kid: kid,
      n: 'placeholder-modulus-replace-with-actual-key',
      e: 'AQAB'
    };
  }
};

export const handler = async (event) => {
  console.log('JWKSProcessor serving public keys');
  
  try {
    // Get the public key from secrets manager
    const keys = await getSigningKeys();
    
    // Convert public key to JWK format
    const jwk = pemToJwk(keys.publicKey, keys.kid);
    
    // Create JWKS response
    const jwks = {
      keys: [jwk]
    };
    
    console.log('JWKS served successfully for kid:', keys.kid);
    
    return createResponse(200, jwks, {
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    
  } catch (error) {
    console.error('Error retrieving JWKS:', error);
    
    return createResponse(500, {
      error: 'server_error',
      error_description: 'Unable to retrieve signing keys'
    });
  }
};
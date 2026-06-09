import crypto from 'crypto';
import { getSigningKeys, createResponse } from './oidc_common_functions.mjs';

/**
 * Convert PEM public key to JWK format with optional X.509 certificate chain
 */
const pemToJwk = (pemKey, kid, certificate = null) => {
  try {
    // Parse the PEM public key
    const keyObject = crypto.createPublicKey(pemKey);
    const jwk = keyObject.export({ format: 'jwk' });
    
    // Build the JWK with required fields for OIDC
    const result = {
      ...jwk,
      kid: kid,
      use: 'sig',
      alg: 'RS256'
    };
    
    // Add x5c (X.509 certificate chain) if certificate is provided
    if (certificate) {
      // Strip PEM headers/footers and whitespace to get base64-encoded certificate
      const certBase64 = certificate
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s+/g, ''); // Remove all whitespace including newlines
      
      result.x5c = [certBase64];
    }
    
    return result;
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
    
    // Convert public key to JWK format with certificate if available
    // note: the certificate is required for MS Entra to validate the signing key, so we include it in the JWK if it's available
    const jwk = pemToJwk(keys.publicKey, keys.kid, keys.certificate);
    
    // Create JWKS response
    const jwks = {
      keys: [jwk]
    };
    
    console.log('JWKS served successfully for kid:', keys.kid);
    
    return createResponse(200, jwks, {
      'Cache-Control': 'public, max-age=0' // Cache for 0 seconds
    });
    
  } catch (error) {
    console.error('Error retrieving JWKS:', error);
    
    return createResponse(500, {
      error: 'server_error',
      error_description: 'Unable to retrieve signing keys'
    });
  }
};
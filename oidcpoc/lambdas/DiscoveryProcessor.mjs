import { createResponse } from './oidc_common_functions.mjs';

export const handler = async (event) => {
  console.log('DiscoveryProcessor generating OIDC discovery document');
  
  const issuer = process.env.ISSUER;
  
  // OIDC Discovery Document according to OpenID Connect Discovery 1.0 specification
  const discoveryDocument = {
    issuer: issuer,
    authorization_endpoint: `${issuer}/oauth2/authorize`,
    token_endpoint: `${issuer}/oauth2/token`,
    userinfo_endpoint: `${issuer}/oauth2/userinfo`,
    jwks_uri: `${issuer}/oauth2/jwks`,
    registration_endpoint: null, // Not supported in this POC
    revocation_endpoint: null, // Not supported in this POC
    
    // Supported response types
    response_types_supported: ['code'],
    
    // Supported response modes
    response_modes_supported: ['query', 'fragment'],
    
    // Supported grant types
    grant_types_supported: ['authorization_code'],
    
    // Supported subject identifier types
    subject_types_supported: ['public'],
    
    // Supported ID token signing algorithms
    id_token_signing_alg_values_supported: ['RS256'],
    
    // Supported token endpoint authentication methods
    token_endpoint_auth_methods_supported: [
      'client_secret_post',
      'client_secret_basic'
    ],
    
    // Supported scopes
    scopes_supported: [
      'openid',
      'profile', 
      'email'
    ],
    
    // Supported claims
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'name', 
      'given_name',
      'family_name',
      'email',
      'email_verified',
      'preferred_username',
      'picture'
    ],
    
    // Additional OIDC capabilities
    claims_parameter_supported: false,
    request_parameter_supported: false,
    request_uri_parameter_supported: false
  };
  
  return createResponse(200, discoveryDocument, {
    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
  });
};
import { createResponse } from './oidc_common_functions.mjs';

export const handler = async (event) => {
  console.log('DefaultRouteProcessor handling unmatched route:', event.rawPath);
  
  // Return error for unmatched routes
  return createResponse(404, {
    error: 'not_found',
    error_description: `The requested endpoint ${event.rawPath} was not found`,
    supported_endpoints: [
      '/.well-known/openid-configuration',
      '/oauth2/authorize',
      '/oauth2/token', 
      '/oauth2/userinfo',
      '/oauth2/jwks'
    ]
  });
};
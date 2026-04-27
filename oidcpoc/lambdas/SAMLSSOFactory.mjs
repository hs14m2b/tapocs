import { handler as processor } from './SAMLSSOProcessor.mjs';

export const handler = async (event) => {
  console.log('SAML SSO Event:', JSON.stringify(event));
  
  try {
    return await processor(event);
  } catch (error) {
    console.error('SAML SSO Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'internal_server_error',
        error_description: 'An unexpected error occurred during SAML authentication'
      })
    };
  }
};
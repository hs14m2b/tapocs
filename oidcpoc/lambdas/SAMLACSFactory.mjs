import { handler as processor } from './SAMLACSProcessor.mjs';

export const handler = async (event) => {
  console.log('SAML ACS Event:', JSON.stringify(event));
  
  try {
    return await processor(event);
  } catch (error) {
    console.error('SAML ACS Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'internal_server_error',
        error_description: 'An unexpected error occurred while processing SAML assertion'
      })
    };
  }
};
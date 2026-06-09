import { handler as processor } from './SAMLMetadataProcessor.mjs';

export const handler = async (event) => {
  console.log('SAML Metadata Event:', JSON.stringify(event));
  
  try {
    return await processor(event);
  } catch (error) {
    console.error('SAML Metadata Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'internal_server_error',
        error_description: 'An unexpected error occurred while generating SAML metadata'
      })
    };
  }
};
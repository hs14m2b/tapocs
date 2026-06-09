import { handler as processor } from './DiscoveryProcessor.mjs';

export const handler = async (event) => {
  console.log('Discovery Event:', JSON.stringify(event));
  
  try {
    return await processor(event);
  } catch (error) {
    console.error('Discovery Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'internal_server_error',
        error_description: 'An unexpected error occurred while retrieving discovery document'
      })
    };
  }
};
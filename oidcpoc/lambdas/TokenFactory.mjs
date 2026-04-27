import { handler as processor } from './TokenProcessor.mjs';

export const handler = async (event) => {
  console.log('Token Event:', JSON.stringify(event));
  
  try {
    return await processor(event);
  } catch (error) {
    console.error('Token Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'internal_server_error',
        error_description: 'An unexpected error occurred during token exchange'
      })
    };
  }
};
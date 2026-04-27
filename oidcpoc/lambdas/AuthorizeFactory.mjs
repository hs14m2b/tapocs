import { handler as processor } from './AuthorizeProcessor.mjs';

export const handler = async (event) => {
  console.log('Authorize Event:', JSON.stringify(event));
  
  try {
    return await processor(event);
  } catch (error) {
    console.error('Authorize Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'internal_server_error',
        error_description: 'An unexpected error occurred during authorization'
      })
    };
  }
};
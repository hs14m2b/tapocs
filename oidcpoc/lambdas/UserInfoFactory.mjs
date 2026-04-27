import { handler as processor } from './UserInfoProcessor.mjs';

export const handler = async (event) => {
  console.log('UserInfo Event:', JSON.stringify(event));
  
  try {
    return await processor(event);
  } catch (error) {
    console.error('UserInfo Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'internal_server_error',
        error_description: 'An unexpected error occurred while retrieving user info'
      })
    };
  }
};
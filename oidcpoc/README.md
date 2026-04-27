# OIDC Provider POC

A static OpenID Connect (OIDC) Provider implementation using AWS API Gateway and Lambda.

## Overview

This is a proof-of-concept OIDC provider that:
- Supports the authorization code flow
- Issues identity and access tokens for a single hardcoded user
- Implements all required OIDC endpoints
- Uses AWS serverless architecture (API Gateway + Lambda)
- Deployed on the nhsdta.com domain infrastructure

## Domain Structure

The OIDC provider is deployed using the nhsdta.com domain:
- **Development**: `https://oidcpoc-dev.nhsdta.com`
- **Integration**: `https://oidcpoc-int.nhsdta.com` 
- **Production**: `https://oidcpoc-prod.nhsdta.com`

## OIDC Endpoints

- `/.well-known/openid-configuration` - Discovery document
- `/oauth2/authorize` - Authorization endpoint
- `/oauth2/token` - Token endpoint  
- `/oauth2/userinfo` - UserInfo endpoint
- `/oauth2/jwks` - JSON Web Key Set endpoint

## Project Structure

```
oidcpoc/
├── certs/                    # TLS certificates and keys
├── docs/                     # Documentation
├── infrastructure/           # CloudFormation/SAM templates
├── lambdas/                  # Lambda function source code
├── manualscripts/           # Deployment and testing scripts
└── tests/                   # Test specifications
```

## Hardcoded User Claims

```json
{
  "sub": "user123",
  "name": "Test User", 
  "email": "test@example.com",
  "email_verified": true,
  "preferred_username": "testuser"
}
```

## Quick Start

1. Deploy prerequisites: `./infrastructure/buildoidcprereqs.sh`
2. Deploy main infrastructure: `./infrastructure/buildoidc.sh`
3. Test endpoints: `./manualscripts/test_oidc_flow.sh`

## Dependencies

- AWS CLI configured
- Node.js 24.x
- AWS SAM CLI (optional)

## Testing

The OIDC provider can be tested using the included Jasmine test suite or manually through the web interface.

### Automated Testing

To run the test suite:

```bash
./run_tests.sh
```

Tests include:
- Discovery document validation
- Authorization flow (redirects to hardcoded success URI)
- Token exchange endpoint
- UserInfo endpoint 
- JWKS endpoint
- Error handling

### Manual Testing

1. Start the authorization flow by visiting:
   ```
   https://oidcpoc-int.nhsdta.com/oauth2/authorize?response_type=code&client_id=hardcoded_client&redirect_uri=https://example.com/callback&scope=openid profile&state=abc123
   ```

2. This will redirect to the callback URL with an authorization code

3. Exchange the code for tokens:
   ```bash
   curl -X POST https://oidcpoc-int.nhsdta.com/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code&code={CODE}&client_id=hardcoded_client&client_secret=hardcoded_secret&redirect_uri=https://example.com/callback"
   ```

4. Test the UserInfo endpoint with the access token:
   ```bash
   curl https://oidcpoc-int.nhsdta.com/oauth2/userinfo \
     -H "Authorization: Bearer {ACCESS_TOKEN}"
   ```

## OIDC Configuration

The provider's configuration document is available at:
`https://oidcpoc-int.nhsdta.com/.well-known/openid-configuration`

This document contains all the necessary endpoints and supported features for OIDC client configuration.
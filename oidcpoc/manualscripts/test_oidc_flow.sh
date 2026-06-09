#!/bin/bash

# Manual test script for OIDC POC endpoints
# Usage: ./test_oidc_flow.sh <domain>

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./test_oidc_flow.sh <domain>"
    echo "Example: ./test_oidc_flow.sh oidcpoc-dev.nhsdta.com"
    exit 1
fi

echo "Testing OIDC Provider POC at: $DOMAIN"
echo "========================================"

BASE_URL="https://$DOMAIN"

echo ""
echo "1. Testing Discovery Endpoint"
echo "----------------------------"

DISCOVERY_URL="$BASE_URL/.well-known/openid-configuration"
echo "GET $DISCOVERY_URL"

curl -s -w "\nHTTP Status: %{http_code}\n" "$DISCOVERY_URL" | jq '.' || echo "Failed to parse JSON"

echo ""
echo "2. Testing JWKS Endpoint"
echo "------------------------"

JWKS_URL="$BASE_URL/oauth2/jwks"
echo "GET $JWKS_URL"

curl -s -w "\nHTTP Status: %{http_code}\n" "$JWKS_URL" | jq '.' || echo "Failed to parse JSON"

echo ""
echo "3. Testing Authorization Endpoint (will redirect)"
echo "------------------------------------------------"

CLIENT_ID="int-client-123"
CLIENT_SECRET="int-client-secret-456"
REDIRECT_URI="https://example.com/callback"
STATE="test-state-123"
NONCE="test-nonce-123"

AUTH_URL="$BASE_URL/oauth2/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&state=$STATE&nonce=$NONCE&scope=openid%20profile%20email"

echo "GET $AUTH_URL"
echo "(This should return a 302 redirect with an authorization code)"
echo ""
echo "HTTP Request/Response Details:"
echo "-----------------------------"

curl -s -w "\nHTTP Status: %{http_code}\nRedirect Location: %{redirect_url}\n" "$AUTH_URL" 2>&1 | tee /tmp/auth_response.log

# Extract authorization code from the redirect location
REDIRECT_LOCATION=$(grep "Location:" /tmp/auth_response.log | tail -1 | cut -d' ' -f2- | tr -d '\r')
AUTH_CODE=$(echo "$REDIRECT_LOCATION" | sed -n 's/.*code=\([^&]*\).*/\1/p')

echo ""
echo "4. Exchange Authorization Code for Tokens"
echo "----------------------------------------"

if [ -n "$AUTH_CODE" ]; then
    echo "Extracted authorization code: $AUTH_CODE"
    echo ""
    
    TOKEN_URL="$BASE_URL/oauth2/token"
    echo "POST $TOKEN_URL"
    
    curl -v -X POST "$TOKEN_URL" \
         -u "$CLIENT_ID:$CLIENT_SECRET" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "grant_type=authorization_code&code=$AUTH_CODE&redirect_uri=$REDIRECT_URI" \
         -w "\nHTTP Status: %{http_code}\n" | tee /tmp/token_response.json | jq '.' || echo "Failed to parse JSON"
    
    # Extract access token from response
    ACCESS_TOKEN=$(jq -r '.access_token // empty' /tmp/token_response.json 2>/dev/null)
else
    echo "No authorization code found in redirect. Manual token exchange required:"
    echo ""
    echo "   curl -X POST $BASE_URL/oauth2/token \\"
    echo "        -u '$CLIENT_ID:$CLIENT_SECRET' \\"
    echo "        -H 'Content-Type: application/x-www-form-urlencoded' \\"
    echo "        -d 'grant_type=authorization_code&code=YOUR_CODE&redirect_uri=$REDIRECT_URI'"
fi

echo ""
echo "5. Testing UserInfo Endpoint"
echo "---------------------------"

USERINFO_URL="$BASE_URL/oauth2/userinfo"

if [ -n "$ACCESS_TOKEN" ]; then
    echo "Using access token from step 4"
    echo "GET $USERINFO_URL (with Authorization header)"
    echo ""
    
    curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
         -w "\nHTTP Status: %{http_code}\n" \
         "$USERINFO_URL" | jq '.' || echo "Failed to parse JSON"
else
    echo "No access token available. Testing without authentication:"
    echo "GET $USERINFO_URL (no auth header)"
    
    curl -s -w "\nHTTP Status: %{http_code}\n" "$USERINFO_URL" | jq '.' || echo "Failed to parse JSON"
    
    echo ""
    echo "To test with authentication, use:"
    echo "curl -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' $USERINFO_URL"
fi

echo ""
echo "Testing Complete!"
echo "================="
echo ""
echo "Note: If automatic token exchange failed, you can manually:"
echo "1. Use the authorization URL from step 3 in a browser"
echo "2. Copy the authorization code from the redirect"
echo "3. Exchange it for tokens using the command shown in step 4"
echo "4. Use the access token to call UserInfo endpoint in step 5"
echo ""
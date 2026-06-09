#!/bin/bash

# Manual test script for SAML POC endpoints
# Usage: ./test_saml_flow.sh <domain>

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./test_saml_flow.sh <domain>"
    echo "Example: ./test_saml_flow.sh oidcpoc-int.nhsdta.com"
    DOMAIN="oidcpoc-int.nhsdta.com"
    echo "No domain provided, defaulting to: $DOMAIN"
fi

echo "Testing SAML Provider POC at: $DOMAIN"
echo "===================================="

BASE_URL="https://$DOMAIN"

echo ""
echo "1. Testing SAML Metadata Endpoint"
echo "--------------------------------"

METADATA_URL="$BASE_URL/saml2/metadata"
echo "GET $METADATA_URL"

curl -s -w "\nHTTP Status: %{http_code}\n" "$METADATA_URL" | head -20 || echo "Failed to retrieve metadata"

echo ""
echo "2. Testing SAML SSO Endpoint (simulated)"
echo "---------------------------------------"

# Create a minimal SAML AuthnRequest for testing
CLIENT_ID="int-client-123"
ACS_URL="https://example.com/saml/acs"
REQUEST_ID="_$(uuidgen | tr -d '-')"

# Create a basic SAML AuthnRequest (base64 encoded)
AUTHN_REQUEST='<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="'$REQUEST_ID'"
                    Version="2.0"
                    IssueInstant="'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
                    Destination="'$BASE_URL'/saml2/sso"
                    AssertionConsumerServiceURL="'$ACS_URL'">
  <saml:Issuer>'$CLIENT_ID'</saml:Issuer>
</samlp:AuthnRequest>'

ENCODED_REQUEST=$(echo "$AUTHN_REQUEST" | base64 -w 0)
RELAY_STATE="test-relay-state"

SSO_URL="$BASE_URL/saml2/sso?SAMLRequest=$ENCODED_REQUEST&RelayState=$RELAY_STATE"

echo "Testing normal authentication (HTTP-Redirect binding):"
echo "GET $SSO_URL"
echo "(This should return a 302 redirect with a SAML Response)"

curl -s -w "\nHTTP Status: %{http_code}\nRedirect Location: %{redirect_url}\n" "$SSO_URL" 2>&1 | tee /tmp/saml_sso_response.log

# Extract SAML Response from redirect
REDIRECT_LOCATION=$(grep "Location:" /tmp/saml_sso_response.log | tail -1 | cut -d' ' -f2- | tr -d '\r')
SAML_RESPONSE=$(echo "$REDIRECT_LOCATION" | sed -n 's/.*SAMLResponse=\([^&]*\).*/\1/p' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))" 2>/dev/null)

echo "SAML response is $SAML_RESPONSE"

# Decode and pretty print SAML Response
if [ -n "$SAML_RESPONSE" ]; then
    echo "Decoded SAML Response (HTTP-Redirect):"
    echo "===================================="
    echo "$SAML_RESPONSE" | base64 -d | xmllint --format - 2>/dev/null || echo "$SAML_RESPONSE" | base64 -d
    echo ""
fi

echo ""
echo "3. Testing HTTP-POST Binding"
echo "---------------------------"

# Create SAML AuthnRequest for POST binding
POST_REQUEST_ID="_$(uuidgen | tr -d '-')"
POST_AUTHN_REQUEST='<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="'$POST_REQUEST_ID'"
                    Version="2.0"
                    IssueInstant="'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
                    Destination="'$BASE_URL'/saml2/sso"
                    AssertionConsumerServiceURL="'$ACS_URL'">
  <saml:Issuer>'$CLIENT_ID'</saml:Issuer>
</samlp:AuthnRequest>'

POST_ENCODED_REQUEST=$(echo "$POST_AUTHN_REQUEST" | base64 -w 0)
POST_SSO_URL="$BASE_URL/saml2/sso"

echo "Testing HTTP-POST binding authentication:"
echo "POST $POST_SSO_URL"
echo "(SAMLRequest sent in form body instead of query string)"
echo ""

curl -s -X POST "$POST_SSO_URL" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "SAMLRequest=$POST_ENCODED_REQUEST&RelayState=post-binding-test" \
     -w "\nHTTP Status: %{http_code}\nRedirect Location: %{redirect_url}\n" 2>&1 | tee /tmp/saml_post_sso_response.log

# Extract SAML Response from POST binding redirect
POST_REDIRECT_LOCATION=$(grep "Location:" /tmp/saml_post_sso_response.log | tail -1 | cut -d' ' -f2- | tr -d '\r')
POST_SAML_RESPONSE=$(echo "$POST_REDIRECT_LOCATION" | sed -n 's/.*SAMLResponse=\([^&]*\).*/\1/p' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))" 2>/dev/null)

# Decode and pretty print POST SAML Response
if [ -n "$POST_SAML_RESPONSE" ]; then
    echo "Decoded SAML Response (HTTP-POST):"
    echo "=================================="
    echo "$POST_SAML_RESPONSE" | base64 -d | xmllint --format - 2>/dev/null || echo "$POST_SAML_RESPONSE" | base64 -d
    echo ""
fi

echo ""
echo "4. Testing Passive Authentication"
echo "-------------------------------"

# Create SAML AuthnRequest with IsPassive="true"
PASSIVE_REQUEST_ID="_$(uuidgen | tr -d '-')"
PASSIVE_AUTHN_REQUEST='<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="'$PASSIVE_REQUEST_ID'"
                    Version="2.0"
                    IssueInstant="'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
                    Destination="'$BASE_URL'/saml2/sso"
                    IsPassive="true"
                    AssertionConsumerServiceURL="'$ACS_URL'">
  <saml:Issuer>'$CLIENT_ID'</saml:Issuer>
</samlp:AuthnRequest>'

PASSIVE_ENCODED_REQUEST=$(echo "$PASSIVE_AUTHN_REQUEST" | base64 -w 0)
PASSIVE_SSO_URL="$BASE_URL/saml2/sso?SAMLRequest=$PASSIVE_ENCODED_REQUEST&RelayState=passive-test"

echo "Testing passive authentication (should return NoPassive error):"
echo "GET $PASSIVE_SSO_URL"

curl -s -w "\nHTTP Status: %{http_code}\nRedirect Location: %{redirect_url}\n" "$PASSIVE_SSO_URL" 2>&1 | tee /tmp/saml_sso_passive_response.log

# Extract SAML Response from redirect
REDIRECT_LOCATION=$(grep "Location:" /tmp/saml_sso_passive_response.log | tail -1 | cut -d' ' -f2- | tr -d '\r')
SAML_RESPONSE=$(echo "$REDIRECT_LOCATION" | sed -n 's/.*SAMLResponse=\([^&]*\).*/\1/p' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))" 2>/dev/null)

echo "SAML response is $SAML_RESPONSE"

# Decode and pretty print SAML Response
if [ -n "$SAML_RESPONSE" ]; then
    echo "Decoded SAML Response (HTTP-Redirect):"
    echo "===================================="
    echo "$SAML_RESPONSE" | base64 -d | xmllint --format - 2>/dev/null || echo "$SAML_RESPONSE" | base64 -d
    echo ""
fi


echo ""
echo "5. Testing SAML ACS Endpoint"
echo "---------------------------"

ACS_URL="$BASE_URL/saml2/acs"

# Try to use SAML Response from either normal or POST binding test
FINAL_SAML_RESPONSE=""
if [ -n "$SAML_RESPONSE" ]; then
    FINAL_SAML_RESPONSE="$SAML_RESPONSE"
    echo "Using SAML Response from HTTP-Redirect binding test"
elif [ -n "$POST_SAML_RESPONSE" ]; then
    FINAL_SAML_RESPONSE="$POST_SAML_RESPONSE"
    echo "Using SAML Response from HTTP-POST binding test"
fi

if [ -n "$FINAL_SAML_RESPONSE" ]; then
    echo "POST $ACS_URL"
    echo ""
    
    curl -s -X POST "$ACS_URL" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "SAMLResponse=$FINAL_SAML_RESPONSE&RelayState=$RELAY_STATE" \
         -w "\nHTTP Status: %{http_code}\n" | jq '.' || echo "Failed to parse JSON"
else
    echo "No SAML Response found from SSO steps. Testing ACS with error scenario:"
    echo "POST $ACS_URL (no SAML Response)"
    
    curl -s -X POST "$ACS_URL" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "RelayState=$RELAY_STATE" \
         -w "\nHTTP Status: %{http_code}\n" | jq '.' || echo "Failed to parse JSON"
fi

echo ""
echo "Testing Complete!"
echo "================"
echo ""
echo "SAML Test Summary:"
echo "1. Metadata endpoint provides IdP configuration"
echo "2. SSO endpoint with HTTP-Redirect binding (SAMLRequest in query string)"
echo "3. SSO endpoint with HTTP-POST binding (SAMLRequest in form body)"
echo "4. Passive authentication support (IsPassive=true) with NoPassive error handling"
echo "5. ACS endpoint processes SAML Responses"
echo ""
echo "Note: This is a minimal SAML implementation for POC purposes."
echo "Production SAML requires proper signature validation, timing checks,"
echo "session management, and comprehensive security measures."
echo ""
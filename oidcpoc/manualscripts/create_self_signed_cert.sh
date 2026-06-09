#!/bin/bash

# Script to create a self-signed certificate from an existing private key
# Usage: ./create_self_signed_cert.sh <private_key_file> [output_cert_file]

PRIVATE_KEY_FILE=$1
OUTPUT_CERT_FILE=$2

if [ -z "$PRIVATE_KEY_FILE" ]; then
    echo "Usage: ./create_self_signed_cert.sh <private_key_file> [output_cert_file]"
    echo ""
    echo "Examples:"
    echo "  ./create_self_signed_cert.sh private.pem"
    echo "  ./create_self_signed_cert.sh private.pem certificate.pem"
    echo ""
    echo "If output_cert_file is not specified, it will be named '<private_key_basename>.cert.pem'"
    exit 1
fi

# Check if private key file exists
if [ ! -f "$PRIVATE_KEY_FILE" ]; then
    echo "Error: Private key file '$PRIVATE_KEY_FILE' does not exist"
    exit 1
fi

# Generate output filename if not provided
if [ -z "$OUTPUT_CERT_FILE" ]; then
    BASENAME=$(basename "$PRIVATE_KEY_FILE" .pem)
    OUTPUT_CERT_FILE="${BASENAME}.cert.pem"
fi

echo "Creating self-signed certificate from private key..."
echo "Private key: $PRIVATE_KEY_FILE"
echo "Output certificate: $OUTPUT_CERT_FILE"
echo ""

# Certificate subject information
COUNTRY="GB"
STATE="England"
CITY="London"
ORGANIZATION="NHS Digital"
ORGANIZATIONAL_UNIT="Test POC"
COMMON_NAME="oidcpoc-test.nhsdta.com"
EMAIL="test@nhsdta.com"

# Create certificate subject string
SUBJECT="/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$COMMON_NAME/emailAddress=$EMAIL"

echo "Certificate subject: $SUBJECT"
echo "Validity: 365 days from today"
echo ""

# Generate self-signed certificate
openssl req -new -x509 -key "$PRIVATE_KEY_FILE" -out "$OUTPUT_CERT_FILE" -days 365 -subj "$SUBJECT"

if [ $? -eq 0 ]; then
    echo "✅ Self-signed certificate created successfully: $OUTPUT_CERT_FILE"
    echo ""
    
    # Display certificate information
    echo "Certificate Information:"
    echo "======================="
    openssl x509 -in "$OUTPUT_CERT_FILE" -text -noout | head -20
    
    echo ""
    echo "Certificate fingerprint:"
    openssl x509 -in "$OUTPUT_CERT_FILE" -fingerprint -noout
    
    echo ""
    echo "Certificate in PEM format:"
    echo "========================="
    cat "$OUTPUT_CERT_FILE"
    
    echo ""
    echo "Certificate for SAML metadata (base64 without headers):"
    echo "======================================================"
    openssl x509 -in "$OUTPUT_CERT_FILE" -outform DER | base64 -w 0
    echo ""
    
    echo ""
    echo "Files created:"
    echo "- Certificate: $OUTPUT_CERT_FILE"
    echo ""
    echo "To use this certificate with your private key:"
    echo "1. Update your secrets manager with the certificate content"
    echo "2. Or reference both files in your application"
    
else
    echo "❌ Error: Failed to create self-signed certificate"
    exit 1
fi
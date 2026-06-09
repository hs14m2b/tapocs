#!/bin/bash

# Build script for OIDC POC Prerequisites
# Usage: ./buildoidcprereqs.sh <environment>

APIENVIRONMENT=$1

if [ -z "$APIENVIRONMENT" ]; then
    echo "Usage: ./buildoidcprereqs.sh <environment>"
    echo "Environment options: dev, int, prod"
    exit 1
fi

echo "Building OIDC POC Prerequisites for environment: $APIENVIRONMENT"

# Read parameter overrides into variable
PARAMETERS_FILE="parameters-${APIENVIRONMENT}.txt"
if [ ! -f "$PARAMETERS_FILE" ]; then
    echo "Error: Parameters file $PARAMETERS_FILE not found!"
    exit 1
fi

# Read parameter overrides and filter out backend-only parameters
ALL_PARAMETERS=$(<$PARAMETERS_FILE)

# Filter out HARDCODEDCLIENTID as it's not used in prereqs template
# Convert from space-separated to individual parameters
PARAMETERS=$(echo "$ALL_PARAMETERS" | grep -v "^#" | sed 's/HARDCODEDCLIENTID=[^ ]*//g' | xargs)

echo "Filtered parameters: $PARAMETERS"

# Stack name
STACK_NAME="${APIENVIRONMENT}-oidcpoc-prereqs"

# Deploy the prerequisites stack
echo "Deploying CloudFormation stack: $STACK_NAME"

aws cloudformation deploy \
    --template-file oidcpoc-prereqs.json \
    --stack-name "$STACK_NAME" \
    --parameter-overrides $PARAMETERS \
    --capabilities CAPABILITY_NAMED_IAM \
    --region eu-west-2

if [ $? -eq 0 ]; then
    echo "Prerequisites deployment successful!"
    
    # Generate RSA key pair for JWT signing
    echo "Generating RSA key pair for JWT signing..."
    
    # Generate private key
    openssl genrsa -out oidc-private-key.pem 2048
    
    # Extract public key
    openssl rsa -in oidc-private-key.pem -pubout -out oidc-public-key.pem
    
    # Read the keys
    PRIVATE_KEY=$(cat oidc-private-key.pem | tr -d '\n' | sed 's/-----BEGIN PRIVATE KEY-----//' | sed 's/-----END PRIVATE KEY-----//')
    PUBLIC_KEY=$(cat oidc-public-key.pem | tr -d '\n' | sed 's/-----BEGIN PUBLIC KEY-----//' | sed 's/-----END PUBLIC KEY-----//')
    
    # Update the secret with actual keys
    SECRET_NAME="${APIENVIRONMENT}-oidcpoc-oidc1-private-key"
    echo "Updating secret: $SECRET_NAME"
    
    aws secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "{\"private_key\":\"-----BEGIN PRIVATE KEY-----\\n${PRIVATE_KEY}\\n-----END PRIVATE KEY-----\",\"public_key\":\"-----BEGIN PUBLIC KEY-----\\n${PUBLIC_KEY}\\n-----END PUBLIC KEY-----\",\"kid\":\"oidc-key-1\"}" \
        --region eu-west-2
    
    if [ $? -eq 0 ]; then
        echo "Secret updated with RSA key pair!"
    else
        echo "Warning: Failed to update secret with RSA keys"
    fi
    
    # Clean up key files
    rm -f oidc-private-key.pem oidc-public-key.pem
    
else
    echo "Prerequisites deployment failed!"
    exit 1
fi

echo "Prerequisites setup complete!"
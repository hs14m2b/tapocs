#!/bin/bash

# Comprehensive build script for OIDC POC
# Usage: ./buildoidcall.sh

echo "OIDC POC Complete Build and Deployment"
echo "======================================"

# Environment list - modify as needed
ENVIRONMENTLIST=( int )

# Generate timestamp for this build
TIMESTAMP=$(date +%s)
echo "Build timestamp: $TIMESTAMP"

# Build once for all environments
echo ""
echo "Phase 1: Building Lambda packages..."
echo "--------------------------------"

cd ..
mkdir -p build
cd lambdas

# Install test dependencies and run tests
echo "Setting up test environment..."

# Install test dependencies first
cd ../tests/spec
npm install
cd ../../lambdas

echo "Installing Lambda dependencies..."
npm install

cd ../infrastructure

echo "Running tests..."
# Use the same simple approach as barspoc - no WSL detection or embedded runners
npx jasmine --config="../tests/spec/support/jasmine.json"
jasRetVal=$?
if [ $jasRetVal -ne 0 ]; then
    echo "Jasmine has determined there is a test failure - stopping build"
    cd ..
    rm -fR build
    echo "Build failed"
    exit $jasRetVal
else
    echo "Jasmine has determined the tests are fine - continuing build"
fi

echo "Current directory: $(pwd)"
# Return to lambdas directory for build
cd ../lambdas

# Build Lambda code layers
echo "Building dependencies layer..."
mkdir nodejs
cp package.json nodejs/package.json
cd nodejs
npm install --omit=dev
cd ..
zip -qr ${TIMESTAMP}dependenciesLayer.zip nodejs
rm -fR nodejs

echo "Building Lambda functions package..."
npm install --omit=dev
zip -qr ${TIMESTAMP}oidcpocapilambdas.zip *

# Copy to build directory
cp ${TIMESTAMP}dependenciesLayer.zip ../build/${TIMESTAMP}dependenciesLayer.zip
cp ${TIMESTAMP}oidcpocapilambdas.zip ../build/${TIMESTAMP}oidcpocapilambdas.zip

# Clean up
rm -f ${TIMESTAMP}dependenciesLayer.zip
rm -f ${TIMESTAMP}oidcpocapilambdas.zip

cd ../build

# Update CloudFormation template 
echo "Updating CloudFormation templates..."
cp ../infrastructure/oidcpoc-backend.json oidcpoc-backend.json
sed -i "s/oidcpocapilambdas\.zip/${TIMESTAMP}oidcpocapilambdas\.zip/g" oidcpoc-backend.json

echo "✅ Build phase complete"
echo ""

# Deploy to all environments
echo "Phase 2: Deploying to environments..."
echo "-----------------------------------"

cd ../infrastructure

for env in "${ENVIRONMENTLIST[@]}"
do
    echo ""
    echo "🚀 Deploying to environment: $env"
    echo "=================================="
    
    # Deploy main application
    echo "Step 1: Deploying main application for $env..."
    ./buildoidc.sh $env $TIMESTAMP true
    appResult=$?
    
    if [ $appResult -ne 0 ]; then
        echo "❌ Application deployment failed for $env"
        continue
    fi
    
    echo "✅ Application deployed for $env"
    
    # Test the deployment
    echo "Step 2: Testing deployment for $env..."
    
    # Get the domain from parameters file
    if [ -f "parameters-${env}.txt" ]; then
        # Domain is constructed as oidcpoc-{env}.nhsdta.com
        DOMAIN="oidcpoc-${env}.nhsdta.com"
        if [ ! -z "$DOMAIN" ]; then
            echo "Testing discovery endpoint: https://$DOMAIN/.well-known/openid-configuration"
            
            # Test discovery endpoint
            curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/.well-known/openid-configuration" > /tmp/test_result.txt
            if [ "$(cat /tmp/test_result.txt)" = "200" ]; then
                echo "✅ Discovery endpoint is responding"
            else
                echo "⚠️  Discovery endpoint test failed (HTTP $(cat /tmp/test_result.txt))"
            fi
            rm -f /tmp/test_result.txt
        fi
    fi
    
    echo "🎉 Deployment complete for $env"
done

# Clean up
cd ..
rm -fR build
cd infrastructure

echo ""
echo "🏁 All deployments complete!"
echo "============================="

# Summary
echo ""
echo "Deployment Summary:"
echo "------------------"
for env in "${ENVIRONMENTLIST[@]}"
do
    if [ -f "parameters-${env}.txt" ]; then
        # Domain is constructed as oidcpoc-{env}.nhsdta.com
        DOMAIN="oidcpoc-${env}.nhsdta.com"
        echo "Environment: $env"
        echo "  Domain: $DOMAIN"
        echo "  Discovery: https://$DOMAIN/.well-known/openid-configuration"
        echo "  Authorization: https://$DOMAIN/oauth2/authorize"
        echo "  Token: https://$DOMAIN/oauth2/token"
        echo "  UserInfo: https://$DOMAIN/oauth2/userinfo"
        echo "  JWKS: https://$DOMAIN/oauth2/jwks"
        echo ""
    fi
done

echo "Build and deployment completed successfully!"
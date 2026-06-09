#!/bin/bash

# Build script for OIDC POC Backend
# Usage: ./buildoidc.sh <environment> [timestamp]

APIENVIRONMENT=$1
TIMESTAMP=${2:-$(date +%s)}
SKIP_BUILD=${3:-"false"}

if [ -z "$APIENVIRONMENT" ]; then
    echo "Usage: ./buildoidc.sh <environment> [timestamp] [skip_build]"
    echo "Environment options: dev, int, prod"
    echo "skip_build: true to skip building artifacts (use when called from buildoidcall.sh)"
    exit 1
fi

echo "Building OIDC POC Backend for environment: $APIENVIRONMENT"
echo "Timestamp: $TIMESTAMP"
echo "Skip build: $SKIP_BUILD"

# Read parameter overrides into variable
PARAMETERS_FILE="parameters-${APIENVIRONMENT}.txt"
if [ ! -f "$PARAMETERS_FILE" ]; then
    echo "Error: Parameters file $PARAMETERS_FILE not found!"
    exit 1
fi

# Read all parameters, excluding comment lines
PARAMETERS=$(grep -v "^#" "$PARAMETERS_FILE" | xargs)
echo "Parameters: $PARAMETERS"

S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
STACK_NAME="${APIENVIRONMENT}-oidcpoc-backend"

if [ "$SKIP_BUILD" = "true" ]; then
    echo "Skipping build phase - using pre-built artifacts"
    
    # Go to build directory that should already exist from buildoidcall.sh
    if [ ! -d "../build" ]; then
        echo "Error: Build directory does not exist. Run buildoidcall.sh first or set skip_build=false"
        exit 1
    fi
    
    cd ../build
    
    # Check if artifacts exist
    if [ ! -f "${TIMESTAMP}oidcpocapilambdas.zip" ]; then
        echo "Error: Pre-built artifacts not found in build directory"
        exit 1
    fi
    
    echo "Using pre-built artifacts from buildoidcall.sh"
    
else
    echo "Building artifacts..."
    
    # Create build directory
    cd ..
    mkdir -p build
    cd lambdas

    echo "Installing and testing Lambda dependencies..."

    # Install dependencies
    npm install

    echo "Building Lambda package..."

    # Create dependencies layer
    mkdir nodejs
    cp package.json nodejs/package.json
    cd nodejs
    npm install --omit=dev
    cd ..
    zip -qr ${TIMESTAMP}dependenciesLayer.zip nodejs
    rm -fR nodejs

    # Package Lambda functions
    npm install --omit=dev
    zip -qr ${TIMESTAMP}oidcpocapilambdas.zip *

    # Copy to build directory
    cp ${TIMESTAMP}dependenciesLayer.zip ../build/${TIMESTAMP}dependenciesLayer.zip
    cp ${TIMESTAMP}oidcpocapilambdas.zip ../build/${TIMESTAMP}oidcpocapilambdas.zip

    # Clean up
    rm -f ${TIMESTAMP}dependenciesLayer.zip
    rm -f ${TIMESTAMP}oidcpocapilambdas.zip

    cd ../build
fi

echo "Packaging CloudFormation template..."

if [ "$SKIP_BUILD" = "true" ]; then
    # Use the template that was already updated by buildoidcall.sh
    if [ ! -f "oidcpoc-backend.json" ]; then
        echo "Error: Pre-built template not found in build directory"
        exit 1
    fi
    echo "Using pre-built template from buildoidcall.sh"
else
    # Update CloudFormation template with timestamped artifacts
    cp ../infrastructure/oidcpoc-backend.json oidcpoc-backend.json
    sed -i "s/oidcpocapilambdas\.zip/${TIMESTAMP}oidcpocapilambdas\.zip/g" oidcpoc-backend.json
fi

# Use CloudFormation package to upload artifacts and update template with S3 URIs
aws cloudformation package \
    --use-json \
    --template-file oidcpoc-backend.json \
    --s3-bucket ${S3CODEBUCKET} \
    --output-template-file ${TIMESTAMP}oidcpoc-backend.json \
    --region eu-west-2

if [ $? -ne 0 ]; then
    echo "Failed to package CloudFormation template"
    exit 1
fi

echo "Deploying CloudFormation stack..."

# Deploy the stack using the packaged template
aws cloudformation deploy \
    --template-file ${TIMESTAMP}oidcpoc-backend.json \
    --stack-name "$STACK_NAME" \
    --parameter-overrides $PARAMETERS \
    --capabilities CAPABILITY_NAMED_IAM \
    --region eu-west-2

if [ $? -eq 0 ]; then
    echo "OIDC POC deployment successful!"
    
    # Get stack outputs
    echo "Stack outputs:"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table \
        --region eu-west-2
else
    echo "OIDC POC deployment failed!"
    exit 1
fi

# Clean up build directory only if we created it (not called from buildoidcall.sh)
if [ "$SKIP_BUILD" != "true" ]; then
    cd ..
    rm -fR build
    cd infrastructure
fi

echo "Build and deployment complete!"
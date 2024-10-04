#!/bin/bash

#APIENVIRONMENT="internal-dev-sandbox"
#APIENVIRONMENT="internal-dev"
ENVIRONMENT="dev"
echo $ENVIRONMENT
#read parameter overrides into variable
PARAMETERS=$(<parameters-${ENVIRONMENT}.txt)
echo $PARAMETERS
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
REGION="eu-west-2"

cd ..
mkdir build
cd build
# update cloudformation templates
cp ../infrastructure/kinesisstreampoc-prereqs.json kinesisstreampoc-prereqs.json

# deploy cloudformation templates
aws cloudformation deploy --template-file kinesisstreampoc-prereqs.json --stack-name ${ENVIRONMENT}-mabr8-kinesiscwstack-prereq --capabilities "CAPABILITY_NAMED_IAM" --region ${REGION} --parameter-overrides ${PARAMETERS}

cd ..
rm -fR build
cd infrastructure

echo "built and deployed application"
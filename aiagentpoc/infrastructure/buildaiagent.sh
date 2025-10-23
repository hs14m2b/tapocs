#!/bin/bash

#APIENVIRONMENT="internal-dev-sandbox"
#APIENVIRONMENT="internal-dev"
APIENVIRONMENT=$1
echo $APIENVIRONMENT
#read parameter overrides into variable
PARAMETERS=$(<parameters-${APIENVIRONMENT}.txt)
echo $PARAMETERS
TIMESTAMP=$2
echo $TIMESTAMP
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"

#change to build directory
cd ../build
#backend
aws cloudformation package --use-json --template-file aiagentpoc-backend.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}aiagentpoc-backend.json --region "eu-west-2"
aws cloudformation deploy --template-file ${TIMESTAMP}aiagentpoc-backend.json --stack-name ${APIENVIRONMENT}-mabr8-aiagentpocbestack --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --s3-bucket ${S3CODEBUCKET}  --parameter-overrides APIENVIRONMENT=${APIENVIRONMENT} ${PARAMETERS}

echo "deployed application to ${APIENVIRONMENT} environment"
cd ../infrastructure

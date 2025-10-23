#!/bin/bash

#APIENVIRONMENT="internal-dev-sandbox"
#APIENVIRONMENT="internal-dev"
APIENVIRONMENT="int"
echo $APIENVIRONMENT
#read parameter overrides into variable
PARAMETERS=$(<parameters-${APIENVIRONMENT}.txt)
echo $PARAMETERS
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"

cd ..
mkdir build
#change to build directory
cd build
cp ../infrastructure/aiagentpoc-agents.json aiagentpoc-agents.json
#agents
aws cloudformation package --use-json --template-file aiagentpoc-agents.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}aiagentpoc-agents.json --region "eu-west-2"
aws cloudformation deploy --template-file ${TIMESTAMP}aiagentpoc-agents.json --stack-name ${APIENVIRONMENT}-mabr8-aiagentpocagentsstack --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --s3-bucket ${S3CODEBUCKET}  --parameter-overrides APIENVIRONMENT=${APIENVIRONMENT} ${PARAMETERS}

cd ..
rm -fR build
cd infrastructure

echo "deployed AI Bedrock Agents to ${APIENVIRONMENT} environment"
cd ../infrastructure

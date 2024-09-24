#!/bin/bash

#APIENVIRONMENT="internal-dev-sandbox"
#APIENVIRONMENT="internal-dev"
ENVIRONMENT=dev #$1
echo $ENVIRONMENT
#read parameter overrides into variable
PARAMETERS=$(<parameters-${ENVIRONMENT}.txt)
echo $PARAMETERS
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
mkdir build
cd build
# update cloudformation templates
cp ../infrastructure/kafkaintegrationcomponents.json kafkaintegrationcomponents.json
aws cloudformation deploy --template-file kafkaintegrationcomponents.json --stack-name ${ENVIRONMENT}-mabr8-kafkapocintcomps --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --parameter-overrides ${PARAMETERS}

cd ..
rm -fR build
cd infrastructure

echo "deployed components"
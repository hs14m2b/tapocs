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
REGION="eu-west-2"

# build lambda code
cd ..
mkdir build
cd lambdas
npm install
zip -qr ${TIMESTAMP}firehosetransformlambdas.zip ./*
cd ..
cd build
cp ../lambdas/${TIMESTAMP}firehosetransformlambdas.zip ${TIMESTAMP}firehosetransformlambdas.zip
rm ../lambdas/${TIMESTAMP}firehosetransformlambdas.zip
# update cloudformation templates
cp ../infrastructure/kafkaintegrationcomponents.json kafkaintegrationcomponents.json
sed -i "s/firehosetransformlambdas\.zip/${TIMESTAMP}firehosetransformlambdas\.zip/g" kafkaintegrationcomponents.json

#backend
aws cloudformation package --use-json --template-file kafkaintegrationcomponents.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}kafkaintegrationcomponents.json --region ${REGION}
aws cloudformation deploy --template-file ${TIMESTAMP}kafkaintegrationcomponents.json --stack-name ${ENVIRONMENT}-mabr8-kafkapocintcomps --capabilities "CAPABILITY_NAMED_IAM" --region ${REGION} --parameter-overrides ${PARAMETERS}


cd ..
rm -fR build
cd infrastructure

echo "deployed components"
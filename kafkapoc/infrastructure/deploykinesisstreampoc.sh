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
cd lambdas
npm install
zip -qr ${TIMESTAMP}firehosetransformlambdas.zip ./*
cd ..
cd build
cp ../lambdas/${TIMESTAMP}firehosetransformlambdas.zip ${TIMESTAMP}firehosetransformlambdas.zip
rm ../lambdas/${TIMESTAMP}firehosetransformlambdas.zip
# update cloudformation templates
cp ../infrastructure/kinesisstreampoc.json kinesisstreampoc.json
sed -i "s/firehosetransformlambdas\.zip/${TIMESTAMP}firehosetransformlambdas\.zip/g" kinesisstreampoc.json
aws cloudformation package --use-json --template-file kinesisstreampoc.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}kinesisstreampoc.json --region ${REGION}

# deploy cloudformation templates
aws cloudformation deploy --template-file ${TIMESTAMP}kinesisstreampoc.json --stack-name ${ENVIRONMENT}-mabr8-kinesiscwstack --capabilities "CAPABILITY_NAMED_IAM" --region ${REGION} --parameter-overrides ${PARAMETERS}

cd ..
rm -fR build
cd infrastructure

echo "built and deployed application"
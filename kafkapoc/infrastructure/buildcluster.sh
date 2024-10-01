#!/bin/bash

#APIENVIRONMENT="internal-dev-sandbox"
#APIENVIRONMENT="internal-dev"
ENVIRONMENT=$1
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
cp ../infrastructure/kafkacluster.json kafkacluster.json
#sed -i "s/code\.zip/${TIMESTAMP}code\.zip/g" kafkacluster.json
#sed -i "s/dependenciesLayer\.zip/${TIMESTAMP}dependenciesLayer\.zip/g" kafkacluster.json
#sed -i "s/mhdpocapilambdas\.zip/${TIMESTAMP}mhdpocapilambdas\.zip/g" kafkacluster.json
#sed -i "s/mhdpocapilambdas\.zip/${TIMESTAMP}mhdpocapilambdas\.zip/g" mhdpoc-edge.json
#sed -i "s/BLDTIME/${TIMESTAMP}/g" mhdpoc-edge.json

#backend
#no code build as yet, so no need to package up
#aws cloudformation package --use-json --template-file kafkacluster.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}kafkacluster.json --region "eu-west-2"
#aws cloudformation deploy --template-file ${TIMESTAMP}kafkacluster.json --stack-name ${APIENVIRONMENT}-mabr8-mhdpocbestack --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --s3-bucket ${S3CODEBUCKET}  --parameter-overrides APIENVIRONMENT=${APIENVIRONMENT} ${PARAMETERS}
aws cloudformation deploy --template-file kafkacluster.json --stack-name ${ENVIRONMENT}-mabr8-kafkapocstack --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --parameter-overrides ${PARAMETERS}

cd ..
rm -fR build
cd infrastructure

echo "built and deployed application"
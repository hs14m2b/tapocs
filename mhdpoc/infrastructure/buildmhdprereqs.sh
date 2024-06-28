#!/bin/sh

#APIENVIRONMENT="internal-dev-sandbox"
#APIENVIRONMENT="internal-dev"
#APIENVIRONMENT="internal-qa"
#APIENVIRONMENT="internal-qa-sandbox"
#APIENVIRONMENT="sandbox"
#APIENVIRONMENT="dev"
#APIENVIRONMENT="int"
#APIENVIRONMENT="ref"
APIENVIRONMENT=$1
echo $APIENVIRONMENT
ENVIRONMENT="mhdpocbe"
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

#prereqs
aws cloudformation deploy --template-file mhdpoc-prereqs.json --stack-name ${APIENVIRONMENT}-mabr8-mhdpocprereqsstack --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --parameter-overrides "APIENVIRONMENT=${APIENVIRONMENT}"

echo "built and deployed application"
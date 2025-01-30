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
ENVIRONMENT="barspocbe"
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

#prereqs
aws cloudformation deploy --template-file barspoc-prereqs.json --stack-name ${APIENVIRONMENT}-mabr8-barspocprereqsstack --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --parameter-overrides "APIENVIRONMENT=${APIENVIRONMENT}"

echo "built and deployed application"
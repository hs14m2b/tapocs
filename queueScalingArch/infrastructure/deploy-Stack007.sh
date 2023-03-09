#!/bin/sh

ENVIRONMENT="nhsukpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodenextjspocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
cd lambdas
npm install
zip -qr ${TIMESTAMP}stack007lambdas.zip ./*
#zip -qr ${TIMESTAMP}stack007layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack007.json queueScalingArch-Stack007.json
sed -i "s/stack007lambdas\.zip/${TIMESTAMP}stack007lambdas\.zip/g" queueScalingArch-Stack007.json
#sed -i "s/stack007layer\.zip/${TIMESTAMP}stack007layer\.zip/g" queueScalingArch-Stack007.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack007.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack007.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack007.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack007.json --stack-name main-queuescaling-mabr8-stack007 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack007lambdas.zip
#rm ${TIMESTAMP}stack007layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack007.json
rm queueScalingArch-Stack007.json


cd ../infrastructure

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
zip -qr ${TIMESTAMP}stack004lambdas.zip ./*
#zip -qr ${TIMESTAMP}stack004layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack004.json queueScalingArch-Stack004.json
sed -i "s/stack004lambdas\.zip/${TIMESTAMP}stack004lambdas\.zip/g" queueScalingArch-Stack004.json
#sed -i "s/stack004layer\.zip/${TIMESTAMP}stack004layer\.zip/g" queueScalingArch-Stack004.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack004.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack004.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack004.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack004.json --stack-name main-queuescaling-mabr8-stack004 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack004lambdas.zip
#rm ${TIMESTAMP}stack004layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack004.json
rm queueScalingArch-Stack004.json


cd ../infrastructure

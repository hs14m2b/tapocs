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
zip -qr ${TIMESTAMP}stack005lambdas.zip ./*
#zip -qr ${TIMESTAMP}stack005layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack005.json queueScalingArch-Stack005.json
sed -i "s/stack005lambdas\.zip/${TIMESTAMP}stack005lambdas\.zip/g" queueScalingArch-Stack005.json
#sed -i "s/stack005layer\.zip/${TIMESTAMP}stack005layer\.zip/g" queueScalingArch-Stack005.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack005.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack005.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack005.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack005.json --stack-name main-queuescaling-mabr8-stack005 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack005lambdas.zip
#rm ${TIMESTAMP}stack005layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack005.json
rm queueScalingArch-Stack005.json


cd ../infrastructure

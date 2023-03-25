#!/bin/sh

ENVIRONMENT="nhsukpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodenextjspocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
cd lambdas
mkdir nodejs
cp package.json nodejs/package.json
cd nodejs
npm install
cd ..
#zip -qr ${TIMESTAMP}stack000lambdas.zip ./*
zip -qr ${TIMESTAMP}queuescalinglayer.zip nodejs
#rm -fr nodejs
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack000.json queueScalingArch-Stack000.json
#sed -i "s/stack000lambdas\.zip/${TIMESTAMP}stack000lambdas\.zip/g" queueScalingArch-Stack000.json
sed -i "s/queuescalinglayer\.zip/${TIMESTAMP}queuescalinglayer\.zip/g" queueScalingArch-Stack000.json
sed -i "s/S3CODEBUCKET/${S3CODEBUCKET}/g" queueScalingArch-Stack000.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack000.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack000.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack000.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack000.json --stack-name main-queuescaling-mabr8-stack000 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

#rm ${TIMESTAMP}stack000lambdas.zip
#rm ${TIMESTAMP}queuescalinglayer.zip
rm ${TIMESTAMP}queueScalingArch-Stack000.json
rm queueScalingArch-Stack000.json


cd ../infrastructure

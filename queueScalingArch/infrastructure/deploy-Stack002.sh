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
zip -qr ${TIMESTAMP}stack002lambdas.zip ./*
#zip -qr ${TIMESTAMP}stack002layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack002.json queueScalingArch-Stack002.json
sed -i "s/stack002lambdas\.zip/${TIMESTAMP}stack002lambdas\.zip/g" queueScalingArch-Stack002.json
#sed -i "s/stack002layer\.zip/${TIMESTAMP}stack002layer\.zip/g" queueScalingArch-Stack002.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack002.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack002.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack002.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack002.json --stack-name main-queuescaling-mabr8-stack002 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack002lambdas.zip
#rm ${TIMESTAMP}stack002layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack002.json
rm queueScalingArch-Stack002.json


cd ../infrastructure

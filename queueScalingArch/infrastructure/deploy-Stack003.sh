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
zip -qr ${TIMESTAMP}stack003lambdas.zip ./*
#zip -qr ${TIMESTAMP}stack003layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack003.json queueScalingArch-Stack003.json
sed -i "s/stack003lambdas\.zip/${TIMESTAMP}stack003lambdas\.zip/g" queueScalingArch-Stack003.json
#sed -i "s/stack003layer\.zip/${TIMESTAMP}stack003layer\.zip/g" queueScalingArch-Stack003.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack003.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack003.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack003.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack003.json --stack-name main-queuescaling-mabr8-stack003 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack003lambdas.zip
#rm ${TIMESTAMP}stack003layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack003.json
rm queueScalingArch-Stack003.json


cd ../infrastructure

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
zip -qr ${TIMESTAMP}stack008lambdas.zip ./*
#zip -qr ${TIMESTAMP}stack008layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack008.json queueScalingArch-Stack008.json
sed -i "s/stack008lambdas\.zip/${TIMESTAMP}stack008lambdas\.zip/g" queueScalingArch-Stack008.json
#sed -i "s/stack008layer\.zip/${TIMESTAMP}stack008layer\.zip/g" queueScalingArch-Stack008.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack008.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack008.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack008.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack008.json --stack-name main-queuescaling-mabr8-stack008 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack008lambdas.zip
#rm ${TIMESTAMP}stack008layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack008.json
rm queueScalingArch-Stack008.json


cd ../infrastructure

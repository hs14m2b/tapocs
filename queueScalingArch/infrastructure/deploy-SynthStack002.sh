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
zip -qr ${TIMESTAMP}synthstack002lambdas.zip ./*
#zip -qr ${TIMESTAMP}synthstack002layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-SynthStack002.json queueScalingArch-SynthStack002.json
sed -i "s/synthstack002lambdas\.zip/${TIMESTAMP}synthstack002lambdas\.zip/g" queueScalingArch-SynthStack002.json
#sed -i "s/stack002layer\.zip/${TIMESTAMP}stack002layer\.zip/g" queueScalingArch-SynthStack002.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-SynthStack002.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-SynthStack002.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-SynthStack002.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-SynthStack002.json --stack-name main-queuescaling-mabr8-synthstack002 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}synthstack002lambdas.zip
#rm ${TIMESTAMP}synthstack002layer.zip
rm ${TIMESTAMP}queueScalingArch-SynthStack002.json
rm queueScalingArch-SynthStack002.json


cd ../infrastructure

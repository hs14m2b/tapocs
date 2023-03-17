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
zip -qr ${TIMESTAMP}synthstack001lambdas.zip ./*
#zip -qr ${TIMESTAMP}synthstack001layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-SynthStack001.json queueScalingArch-SynthStack001.json
sed -i "s/synthstack001lambdas\.zip/${TIMESTAMP}synthstack001lambdas\.zip/g" queueScalingArch-SynthStack001.json
#sed -i "s/stack002layer\.zip/${TIMESTAMP}stack002layer\.zip/g" queueScalingArch-SynthStack001.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-SynthStack001.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-SynthStack001.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-SynthStack001.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-SynthStack001.json --stack-name main-queuescaling-mabr8-synthstack001 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}synthstack001lambdas.zip
#rm ${TIMESTAMP}synthstack001layer.zip
rm ${TIMESTAMP}queueScalingArch-SynthStack001.json
rm queueScalingArch-SynthStack001.json


cd ../infrastructure

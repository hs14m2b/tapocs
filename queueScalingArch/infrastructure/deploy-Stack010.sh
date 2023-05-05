#!/bin/sh

ENVIRONMENT="nhsukpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodenextjspocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
cd lambdas
#npm install
zip -qr ${TIMESTAMP}stack010lambdas.zip *.mjs
#zip -qr ${TIMESTAMP}stack010layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack010.json queueScalingArch-Stack010.json
sed -i "s/stack010lambdas\.zip/${TIMESTAMP}stack010lambdas\.zip/g" queueScalingArch-Stack010.json
#sed -i "s/stack010layer\.zip/${TIMESTAMP}stack010layer\.zip/g" queueScalingArch-Stack010.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack010.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack010.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack010.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack010.json --stack-name main-queuescaling-mabr8-stack010 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack010lambdas.zip
#rm ${TIMESTAMP}stack010layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack010.json
rm queueScalingArch-Stack010.json


cd ../infrastructure

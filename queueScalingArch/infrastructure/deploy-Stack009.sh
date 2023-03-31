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
zip -qr ${TIMESTAMP}stack009lambdas.zip *.mjs
#zip -qr ${TIMESTAMP}stack009layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack009.json queueScalingArch-Stack009.json
sed -i "s/stack009lambdas\.zip/${TIMESTAMP}stack009lambdas\.zip/g" queueScalingArch-Stack009.json
#sed -i "s/stack009layer\.zip/${TIMESTAMP}stack009layer\.zip/g" queueScalingArch-Stack009.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack009.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack009.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack009.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack009.json --stack-name main-queuescaling-mabr8-stack009 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack009lambdas.zip
#rm ${TIMESTAMP}stack009layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack009.json
rm queueScalingArch-Stack009.json


cd ../infrastructure

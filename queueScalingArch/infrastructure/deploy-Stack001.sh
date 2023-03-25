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
zip -qr ${TIMESTAMP}stack001lambdas.zip *.mjs
#zip -qr ${TIMESTAMP}queuescalinglayer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack001.json queueScalingArch-Stack001.json
sed -i "s/stack001lambdas\.zip/${TIMESTAMP}stack001lambdas\.zip/g" queueScalingArch-Stack001.json
#sed -i "s/queuescalinglayer\.zip/${TIMESTAMP}queuescalinglayer\.zip/g" queueScalingArch-Stack001.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack001.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack001.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack001.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack001.json --stack-name main-queuescaling-mabr8-stack001 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack001lambdas.zip
#rm ${TIMESTAMP}queuescalinglayer.zip
rm ${TIMESTAMP}queueScalingArch-Stack001.json
rm queueScalingArch-Stack001.json


cd ../infrastructure

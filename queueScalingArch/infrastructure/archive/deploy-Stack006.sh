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
zip -qr ${TIMESTAMP}stack006lambdas.zip *.mjs
#zip -qr ${TIMESTAMP}stack006layer.zip node_modules
# update cloudformation templates
cp ../infrastructure/queueScalingArch-Stack006.json queueScalingArch-Stack006.json
sed -i "s/stack006lambdas\.zip/${TIMESTAMP}stack006lambdas\.zip/g" queueScalingArch-Stack006.json
#sed -i "s/stack006layer\.zip/${TIMESTAMP}stack006layer\.zip/g" queueScalingArch-Stack006.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" queueScalingArch-Stack006.json

#backend
aws cloudformation package --use-json --template-file queueScalingArch-Stack006.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}queueScalingArch-Stack006.json
aws cloudformation deploy --template-file ${TIMESTAMP}queueScalingArch-Stack006.json --stack-name main-queuescaling-mabr8-stack006 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack006lambdas.zip
#rm ${TIMESTAMP}stack006layer.zip
rm ${TIMESTAMP}queueScalingArch-Stack006.json
rm queueScalingArch-Stack006.json


cd ../infrastructure

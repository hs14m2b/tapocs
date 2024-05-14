#!/bin/sh

APIENVIRONMENT="internal-dev-sandbox"
#APIENVIRONMENT="internal-dev"
ENVIRONMENT="mhdpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodemhdpocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
mkdir build
# build lambda code
cd lambdas
mkdir nodejs
cp package.json nodejs/package.json
cd nodejs
npm install
cd ..
#zip -qr ${TIMESTAMP}stack000lambdas.zip ./*
zip -qr ${TIMESTAMP}dependenciesLayer.zip nodejs
rm -fR nodejs
# need to include node modules due to bug in Lambda that doesn't enable the AWS SDK v2 to be loaded via Layer
npm install
zip -qr ${TIMESTAMP}mhdpocapilambdas.zip *
cp ${TIMESTAMP}dependenciesLayer.zip ../build/${TIMESTAMP}dependenciesLayer.zip
cp ${TIMESTAMP}mhdpocapilambdas.zip ../build/${TIMESTAMP}mhdpocapilambdas.zip
rm -f ${TIMESTAMP}dependenciesLayer.zip
rm -f ${TIMESTAMP}mhdpocapilambdas.zip
cd ../build
# update cloudformation templates
cp ../infrastructure/mhdpoc-backend.json mhdpoc-backend.json
#cp ../../infrastructure/mhdpoc-frontend.json ${TIMESTAMP}mhdpoc-frontend.json
sed -i "s/code\.zip/${TIMESTAMP}code\.zip/g" mhdpoc-backend.json
sed -i "s/dependenciesLayer\.zip/${TIMESTAMP}dependenciesLayer\.zip/g" mhdpoc-backend.json
sed -i "s/mhdpocapilambdas\.zip/${TIMESTAMP}mhdpocapilambdas\.zip/g" mhdpoc-backend.json
#sed -i "s/mhdpocapilambdas\.zip/${TIMESTAMP}mhdpocapilambdas\.zip/g" mhdpoc-edge.json
#sed -i "s/BLDTIME/${TIMESTAMP}/g" mhdpoc-edge.json

#backend
aws cloudformation package --use-json --template-file mhdpoc-backend.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}mhdpoc-backend.json --region "eu-west-2"
aws cloudformation deploy --template-file ${TIMESTAMP}mhdpoc-backend.json --stack-name ${APIENVIRONMENT}-mabr8-mhdpocbestack --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2" --s3-bucket ${S3CODEBUCKET}  --parameter-overrides "APIENVIRONMENT=${APIENVIRONMENT}"

cd ..
rm -fR build

echo "built and deployed application"
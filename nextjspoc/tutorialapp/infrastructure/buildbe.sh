#!/bin/sh

ENVIRONMENT="nhsukpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
cd nextjs-blog
npm run build
npx --package @sladg/nextjs-lambda cli pack
cd next.out
cp assetsLayer.zip ${TIMESTAMP}assetsLayer.zip
cp code.zip ${TIMESTAMP}code.zip
cp dependenciesLayer.zip ${TIMESTAMP}dependenciesLayer.zip
cp ../../infrastructure/nextjspoc-backend.json nextjspoc-backend.json
cp ../../infrastructure/nextjspoc-frontend.json ${TIMESTAMP}nextjspoc-frontend.json
sed -i "s/code\.zip/${TIMESTAMP}code\.zip/g" nextjspoc-backend.json
sed -i "s/dependenciesLayer\.zip/${TIMESTAMP}dependenciesLayer\.zip/g" nextjspoc-backend.json

aws cloudformation package --use-json --template-file nextjspoc-backend.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}nextjspoc-backend.json
aws cloudformation deploy --template-file ${TIMESTAMP}nextjspoc-backend.json --stack-name main-mabr8-nextjspocbestack --capabilities "CAPABILITY_NAMED_IAM"
#aws cloudformation create-stack --template-body file://${TIMESTAMP}nhsukpoc-backend.json --stack-name main-mabr8-nextjspocbestack --capabilities "CAPABILITY_NAMED_IAM" "CAPABILITY_AUTO_EXPAND"
#aws cloudformation deploy --template-file ${TIMESTAMP}nextjspoc-frontend.json --stack-name main-mabr8-nextjspocfestack --capabilities "CAPABILITY_NAMED_IAM"

mkdir assets
unzip ${TIMESTAMP}assetsLayer.zip -d assets
cd assets
aws s3 sync . s3://main-mabr8-nextjsassets

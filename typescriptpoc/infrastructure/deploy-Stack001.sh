#!/bin/sh

ENVIRONMENT="typescriptpoc"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodenextjspocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
cd lambdas
npm install
# transpile the typescript to javascript modeules
tsc
cd out
zip -qr ${TIMESTAMP}stack001lambdas.zip *.mjs
cp ${TIMESTAMP}stack001lambdas.zip ../${TIMESTAMP}stack001lambdas.zip
rm -f *
cd ..
#zip -qr ${TIMESTAMP}typescriptpoclayer.zip node_modules
# update cloudformation templates
cp ../infrastructure/typescriptPoC-Stack001.json typescriptPoC-Stack001.json
sed -i "s/stack001lambdas\.zip/${TIMESTAMP}stack001lambdas\.zip/g" typescriptPoC-Stack001.json
#sed -i "s/typescriptpoclayer\.zip/${TIMESTAMP}typescriptpoclayer\.zip/g" typescriptPoC-Stack001.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" typescriptPoC-Stack001.json

#backend
aws cloudformation package --use-json --template-file typescriptPoC-Stack001.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}typescriptPoC-Stack001.json
aws cloudformation deploy --template-file ${TIMESTAMP}typescriptPoC-Stack001.json --stack-name main-typescriptpoc-mabr8-stack001 --capabilities "CAPABILITY_NAMED_IAM" --region "eu-west-2"

rm ${TIMESTAMP}stack001lambdas.zip
#rm ${TIMESTAMP}typescriptpoclayer.zip
rm ${TIMESTAMP}typescriptPoC-Stack001.json
rm typescriptPoC-Stack001.json


cd ../infrastructure

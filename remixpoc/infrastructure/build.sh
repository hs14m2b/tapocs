#!/bin/sh

#switch to the correct node version before running the build
# nvm use lts/iron
ENVIRONMENT="remixpoc"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
REGION="eu-west-2"

cd ..
cd remix-aws-tutorial
npm install
npm run build
#create package for the lambda functions
node build.cjs
#zip contents of assets folder
cd build
mkdir cloudformation
cd client
zip -qr ${TIMESTAMP}assetsLayer.zip .
cp ${TIMESTAMP}assetsLayer.zip ../cloudformation
rm ${TIMESTAMP}assetsLayer.zip

#copy the node_modules folder into a nodejs folder.
cd .. #back to the build folder
mkdir dependencies
cd dependencies
mkdir nodejs
cp -r ../../node_modules nodejs
zip -qr ${TIMESTAMP}dependenciesLayer.zip .
cp ${TIMESTAMP}dependenciesLayer.zip ../cloudformation
rm ${TIMESTAMP}dependenciesLayer.zip

#zip contents of packaged lambda folder
cd ../lambda
zip -qr ${TIMESTAMP}code.zip .
cp ${TIMESTAMP}code.zip ../cloudformation
rm ${TIMESTAMP}code.zip

#cd to lambda folder
#cd ../../../../lambdas
#npm install
#zip -qr ${TIMESTAMP}remixpocapilambdas.zip ./*
#cd ..
#cd nextjs-blog
#cd open-next-build
#cp ../../lambdas/${TIMESTAMP}remixpocapilambdas.zip ${TIMESTAMP}remixpocapilambdas.zip
#rm ../../lambdas/${TIMESTAMP}remixpocapilambdas.zip

#cd to cloudformation folder
cd ../cloudformation
ls -al

#copy the cloudformation templates
cp ../../../infrastructure/remixpoc-backend.json remixpoc-backend.json
#cp ../../../infrastructure/remixpoc-edge.json remixpoc-edge.json
cp ../../../infrastructure/remixpoc-frontend.json ${TIMESTAMP}remixpoc-frontend.json
sed -i "s/code\.zip/${TIMESTAMP}code\.zip/g" remixpoc-backend.json
#sed -i "s/dependenciesLayer\.zip/${TIMESTAMP}dependenciesLayer\.zip/g" remixpoc-backend.json
#sed -i "s/remixpocapilambdas\.zip/${TIMESTAMP}remixpocapilambdas\.zip/g" remixpoc-backend.json
#sed -i "s/remixpocapilambdas\.zip/${TIMESTAMP}remixpocapilambdas\.zip/g" remixpoc-edge.json
#sed -i "s/BLDTIME/${TIMESTAMP}/g" remixpoc-edge.json


aws cloudformation package --use-json --template-file remixpoc-backend.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}remixpoc-backend.json --region ${REGION}
aws cloudformation deploy --template-file ${TIMESTAMP}remixpoc-backend.json --stack-name main-mabr8-remixpocbestack --capabilities "CAPABILITY_NAMED_IAM" --region ${REGION}

#aws cloudformation deploy --template-file ${TIMESTAMP}remixpoc-frontend.json --stack-name main-mabr8-remixpocfestack --capabilities "CAPABILITY_NAMED_IAM"  --region ${REGION}

#sync the static content to S3
cd ../client
aws s3 sync . s3://main-mabr8-remixassets
#remove the cloudformation folder
cd ..
rm -rf cloudformation
#remove the dependencies folder
rm -rf dependencies
echo "application available at https://main-remixfe.nhsdta.com/"
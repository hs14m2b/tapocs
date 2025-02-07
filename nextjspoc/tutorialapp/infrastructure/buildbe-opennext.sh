#!/bin/sh

ENVIRONMENT="nhsukpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
REGION="eu-west-2"
OPEN_NEXT_DEBUG=true

cd ..
cd nextjs-blog
npm install
npm run build
npx open-next@latest build
mkdir open-next-build
cd .open-next
cd assets
#zip contents of assets folder
zip -r ${TIMESTAMP}assetsLayer.zip .
cp ${TIMESTAMP}assetsLayer.zip ../../open-next-build
rm ${TIMESTAMP}assetsLayer.zip

#copy the node_modules folder into a nodejs folder.
cd .. #back to the .open-next folder
mkdir dependencies
cd dependencies
mkdir nodejs
cp -r ../server-functions/default/node_modules nodejs
zip -r ${TIMESTAMP}dependenciesLayer.zip .
cp ${TIMESTAMP}dependenciesLayer.zip ../../open-next-build
rm ${TIMESTAMP}dependenciesLayer.zip

#zip contents of code folder
cd ../server-functions/default
#do not remove the node_modules folder as bug in lambda in not supporting layers for .mjs files
#rm -rf node_modules
#update the cache.cjs file to enable debugging
if [ "$OPEN_NEXT_DEBUG" = true ]; then
    sed -i "s/openNextDebug = false/openNextDebug = true/g" cache.cjs
fi
zip -r ${TIMESTAMP}code.zip .
cp ${TIMESTAMP}code.zip ../../../open-next-build
rm ${TIMESTAMP}code.zip

#cd to lambda folder
cd ../../../../lambdas
npm install
zip -qr ${TIMESTAMP}nextjspocapilambdas.zip ./*
cd ..
cd nextjs-blog
cd open-next-build
cp ../../lambdas/${TIMESTAMP}nextjspocapilambdas.zip ${TIMESTAMP}nextjspocapilambdas.zip
rm ../../lambdas/${TIMESTAMP}nextjspocapilambdas.zip

#cd to open-next-build folder
cd ../../../open-next-build
ls -al

#copy the cloudformation templates
cp ../../infrastructure/nextjspoc-backend.json nextjspoc-backend.json
cp ../../infrastructure/nextjspoc-edge.json nextjspoc-edge.json
cp ../../infrastructure/nextjspoc-frontend.json ${TIMESTAMP}nextjspoc-frontend.json
sed -i "s/code\.zip/${TIMESTAMP}code\.zip/g" nextjspoc-backend.json
sed -i "s/dependenciesLayer\.zip/${TIMESTAMP}dependenciesLayer\.zip/g" nextjspoc-backend.json
sed -i "s/nextjspocapilambdas\.zip/${TIMESTAMP}nextjspocapilambdas\.zip/g" nextjspoc-backend.json
sed -i "s/nextjspocapilambdas\.zip/${TIMESTAMP}nextjspocapilambdas\.zip/g" nextjspoc-edge.json
sed -i "s/BLDTIME/${TIMESTAMP}/g" nextjspoc-edge.json


aws cloudformation package --use-json --template-file nextjspoc-backend.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}nextjspoc-backend.json --region ${REGION}
aws cloudformation deploy --template-file ${TIMESTAMP}nextjspoc-backend.json --stack-name main-mabr8-nextjspocbestack --capabilities "CAPABILITY_NAMED_IAM" --region ${REGION}

#aws cloudformation deploy --template-file ${TIMESTAMP}nextjspoc-frontend.json --stack-name main-mabr8-nextjspocfestack --capabilities "CAPABILITY_NAMED_IAM"  --region ${REGION}

mkdir assets
unzip ${TIMESTAMP}assetsLayer.zip -d assets
mkdir code
unzip ${TIMESTAMP}code.zip -d code
cp ./code/.next/server/pages/*.html ./assets/
cd assets
aws s3 sync . s3://main-mabr8-nextjsassets
#remove the open-next-build folder
cd ../../
rm -rf open-next-build
echo "application available at https://main-nextjsfe.nhsdta.com/"
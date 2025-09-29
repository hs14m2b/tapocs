#!/bin/sh

S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
REGION="eu-west-2"
OPEN_NEXT_DEBUG=true
APIENVIRONMENT="int"

cd ..
cd next-ui
npm install
npm run build
npx open-next@latest build
mkdir open-next-build
cd .open-next
cd assets
#zip contents of assets folder
zip -qr ${TIMESTAMP}assetsLayer.zip .
cp ${TIMESTAMP}assetsLayer.zip ../../open-next-build
rm ${TIMESTAMP}assetsLayer.zip

#copy the node_modules folder into a nodejs folder.
cd .. #back to the .open-next folder
mkdir dependencies
cd dependencies
mkdir nodejs
cp -r ../server-functions/default/node_modules nodejs
zip -qr ${TIMESTAMP}dependenciesLayer.zip .
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
zip -qr ${TIMESTAMP}code.zip .
cp ${TIMESTAMP}code.zip ../../../open-next-build
rm ${TIMESTAMP}code.zip

#cd to next-ui-lambdas folder
cd ../../../next-ui-lambdas
npm install
zip -qr ${TIMESTAMP}nextjsuiapilambdas.zip ./*
#cd to open-next-build folder
cd ../open-next-build
cp ../next-ui-lambdas/${TIMESTAMP}nextjsuiapilambdas.zip ${TIMESTAMP}nextjsuiapilambdas.zip
rm ../next-ui-lambdas/${TIMESTAMP}nextjsuiapilambdas.zip

ls -al

#copy the cloudformation templates
cp ../../infrastructure/nextjsui-backend.json nextjsui-backend.json
cp ../../infrastructure/nextjsui-frontend.json ${TIMESTAMP}nextjsui-frontend.json
sed -i "s/code\.zip/${TIMESTAMP}code\.zip/g" nextjsui-backend.json
sed -i "s/dependenciesLayer\.zip/${TIMESTAMP}dependenciesLayer\.zip/g" nextjsui-backend.json
sed -i "s/nextjsuiapilambdas\.zip/${TIMESTAMP}nextjsuiapilambdas\.zip/g" nextjsui-backend.json
#sed -i "s/nextjsuiapilambdas\.zip/${TIMESTAMP}nextjsuiapilambdas\.zip/g" nextjsui-edge.json
#sed -i "s/BLDTIME/${TIMESTAMP}/g" nextjsui-edge.json


aws cloudformation package --use-json --template-file nextjsui-backend.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}nextjsui-backend.json --region ${REGION}
aws cloudformation deploy --template-file ${TIMESTAMP}nextjsui-backend.json --stack-name main-mabr8-nextjsuibestack-barspoc --capabilities "CAPABILITY_NAMED_IAM" --region ${REGION} --parameter-overrides APIENVIRONMENT=${APIENVIRONMENT}

aws cloudformation deploy --template-file ${TIMESTAMP}nextjsui-frontend.json --stack-name main-mabr8-nextjsuifestack-barspoc --capabilities "CAPABILITY_NAMED_IAM"  --region ${REGION}

mkdir assets
unzip -q ${TIMESTAMP}assetsLayer.zip -d assets
mkdir code
unzip -q ${TIMESTAMP}code.zip -d code
cp ./code/.next/server/pages/*.html ./assets/
cd assets
#CHANGE THE S3 BUCKET NAME
aws s3 sync . s3://main-mabr8-barspocui-nextjsassets
#remove the open-next-build folder
cd ../../
rm -rf open-next-build
echo "application available at https://main-mabr8-barspocui-nextjsfe.nhsdta.com/"
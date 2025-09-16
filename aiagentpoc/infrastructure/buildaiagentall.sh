#!/bin/bash

echo $SHELL

#ENVIRONMENTLIST=( internal-dev-sandbox internal-dev internal-qa internal-qa-sandbox sandbox dev int ref )
#ENVIRONMENTLIST=( internal-dev-sandbox )
#ENVIRONMENTLIST=( int ref )
ENVIRONMENTLIST=( int )

#do initial build once
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
mkdir build
cd lambdas

# set up test libraries
cd ../tests/spec
npm install
cd ../../lambdas
npm install
# run the tests
npx jasmine --config="../tests/spec/support/jasmine.json"
jasRetVal=$?
if [ $jasRetVal -ne 0 ]; then
    echo "Jasmine has determined there is a test failure - stopping build"
    cd ..
    rm -fR build

    echo "build failed"
    exit $jasRetVal
else
    echo "Jasmine has determined the tests are fine - continuing build"
fi

# build lambda code
mkdir nodejs
cp package.json nodejs/package.json
cd nodejs
npm install --omit=dev
cd ..
zip -qr ${TIMESTAMP}dependenciesLayer.zip nodejs
rm -fR nodejs
mkdir certs
#cp ../certs/tsassolarchdemoapi.* certs
# need to include node modules due to bug in Lambda that doesn't enable the AWS SDK v2 to be loaded via Layer
npm install
zip -qr ${TIMESTAMP}aiagentpocapilambdas.zip *
cp ${TIMESTAMP}dependenciesLayer.zip ../build/${TIMESTAMP}dependenciesLayer.zip
cp ${TIMESTAMP}aiagentpocapilambdas.zip ../build/${TIMESTAMP}aiagentpocapilambdas.zip
rm -f ${TIMESTAMP}dependenciesLayer.zip
rm -f ${TIMESTAMP}aiagentpocapilambdas.zip
rm -fR certs
cd ../build
# update cloudformation templates
cp ../infrastructure/aiagentpoc-backend.json aiagentpoc-backend.json
sed -i "s/code\.zip/${TIMESTAMP}code\.zip/g" aiagentpoc-backend.json
sed -i "s/dependenciesLayer\.zip/${TIMESTAMP}dependenciesLayer\.zip/g" aiagentpoc-backend.json
sed -i "s/aiagentpocapilambdas\.zip/${TIMESTAMP}aiagentpocapilambdas\.zip/g" aiagentpoc-backend.json

echo "built application in the 'build' folder"
cd ../infrastructure


for i in "${ENVIRONMENTLIST[@]}"
do
	. ./buildaiagent.sh $i ${TIMESTAMP}
done

cd ..
rm -fR build
cd infrastructure

echo "built and deployed application"

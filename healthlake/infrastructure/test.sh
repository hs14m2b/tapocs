#!/bin/sh

ENVIRONMENT="healthlakepoc"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
#REGION="us-east-1"
REGION="eu-west-2"

# build lambda code with devDependencies
cd ..
mkdir build
cd lambdas
npm install
# set up test libraries
cd ../tests/spec
npm install
cd ../../lambdas
# run the tests
npx jasmine --config="../tests/spec/support/jasmine.json"
jasRetVal=$?
if [ $jasRetVal -ne 0 ]; then
    echo "Jasmine has determined there is a test failure - stopping build"
else
    echo "Jasmine has determined the tests are fine - continuing build"
    # build lambda code without devDependencies
    npm install --omit=dev
fi



cd ..
rm -fR build

echo "build finished"
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
    cd ..
    rm -fR build

    echo "build failed"
    exit $jasRetVal
else
    echo "Jasmine has determined the tests are fine - continuing build"
fi

# build lambda code without devDependencies
npm install --omit=dev

zip -qr ${TIMESTAMP}healthlakepoclambdas.zip ./*
cd ..
cd build
cp ../lambdas/${TIMESTAMP}healthlakepoclambdas.zip ${TIMESTAMP}healthlakepoclambdas.zip
rm ../lambdas/${TIMESTAMP}healthlakepoclambdas.zip
# update cloudformation templates
cp ../infrastructure/healthlakepoc.json healthlakepoc.json
sed -i "s/healthlakepoclambdas\.zip/${TIMESTAMP}healthlakepoclambdas\.zip/g" healthlakepoc.json

#backend
aws cloudformation package --use-json --template-file healthlakepoc.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}healthlakepoc.json --region ${REGION}
aws cloudformation deploy --template-file ${TIMESTAMP}healthlakepoc.json --stack-name main-mabr8-healthlakepocstack --capabilities "CAPABILITY_NAMED_IAM" --region ${REGION}

##aws cloudformation create-stack --template-body file://${TIMESTAMP}nhsukpoc-backend.json --stack-name main-mabr8-nextjspocbestack --capabilities "CAPABILITY_NAMED_IAM" "CAPABILITY_AUTO_EXPAND"

cd ..
rm -fR build

echo "build finished"
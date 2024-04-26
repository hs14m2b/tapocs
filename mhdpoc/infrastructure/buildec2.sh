#!/bin/sh

ENVIRONMENT="xcapocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodexcapocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..
mkdir build
cd build
# update cloudformation templates
cp ../infrastructure/xcagateway-ec2.json xcagateway-ec2.json

#backend
aws cloudformation package --use-json --template-file xcagateway-ec2.json --s3-bucket ${S3CODEBUCKET} --output-template-file ${TIMESTAMP}xcagateway-ec2.json
aws cloudformation deploy --template-file ${TIMESTAMP}xcagateway-ec2.json --stack-name main-mabr8-xcapocec2stack --capabilities "CAPABILITY_NAMED_IAM"

cd ..
rm -fR build

echo "built and deployed application"
#!/bin/sh

ENVIRONMENT="nhsukpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodenextjspocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
REGION="eu-west-2"

cd ..
cd nextjs-blog
npm install
npm run build
npm run start

echo "application available at https://main-nextjsfe.nhsdta.com/"
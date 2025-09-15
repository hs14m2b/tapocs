#!/bin/sh

ENVIRONMENT="nhsukpocbe"
S3CODEBUCKET="codepipeline-eu-west-2-467564981221"
USS3CODEBUCKET="lambdacodenextjspocedge"
#OPENSSL_CONF=/dev/null
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
REGION="eu-west-2"

cd ..
cd next-ui
npm install
npm run build
npm run start

echo "application available at https://main-mabr8-barspocui-nextjsfe.nhsdta.com/"
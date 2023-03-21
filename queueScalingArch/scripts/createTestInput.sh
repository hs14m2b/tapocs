#!/bin/sh
TIMESTAMP=$(date +%s)
FILENAME="testData${TIMESTAMP}.csv"
CLIENTID="BLAHBLAH"
echo $FILENAME
node node/createTestInput.js $FILENAME $TIMESTAMP $CLIENTID

aws s3 cp $FILENAME s3://main-queuescaling-mabr8-inputs/input/$FILENAME --metadata clientid=${CLIENTID},batchid=${TIMESTAMP}

rm $FILENAME

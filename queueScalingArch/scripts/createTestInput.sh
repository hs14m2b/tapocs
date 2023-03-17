#!/bin/sh
TIMESTAMP=$(date +%s)
FILENAME="testData${TIMESTAMP}.csv"
echo $FILENAME
node node/createTestInput.js $FILENAME $TIMESTAMP

aws s3 cp $FILENAME s3://main-queuescaling-mabr8-inputs/input/$FILENAME --metadata clientid=12345,batchid=${TIMESTAMP}

rm $FILENAME

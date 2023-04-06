#!/bin/sh

aws cloudformation delete-stack --stack-name main-queuescaling-mabr8-stack002  --region "eu-west-2"

STACKSTATUS=$(aws cloudformation describe-stacks --stack-name main-queuescaling-mabr8-stack002  --region "eu-west-2" | jq '.Stacks[0].StackStatus')
echo "Stack status is [$STACKSTATUS]"
while [ "$STACKSTATUS" = "\"DELETE_IN_PROGRESS\"" ]
do
    sleep 10s
    STACKSTATUS=$(aws cloudformation describe-stacks --stack-name main-queuescaling-mabr8-stack002  --region "eu-west-2" | jq '.Stacks[0].StackStatus')
    echo "Stack status is $STACKSTATUS"
done
echo "Final status of stack is $STACKSTATUS"

#!/bin/sh

aws s3 rm s3://main-queuescaling-mabr8-inputs --recursive

aws cloudformation delete-stack --stack-name main-queuescaling-mabr8-stack001  --region "eu-west-2"

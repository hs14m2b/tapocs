#!/bin/sh
TIMESTAMP=$(date +%s)

aws s3 rm s3://main-queuescaling-mabr8-inputs --recursive

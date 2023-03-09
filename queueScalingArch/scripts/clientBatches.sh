#!/bin/sh
TIMESTAMP=$(date +%s)

aws dynamodb query --table-name main-queuescaling-requestsTable --key-condition-expression "request_partition=:rp" --filter-expression "record_type=:rt" --expression-attribute-values "{\":rp\" :{\"S\":\"12345\"}, \":rt\" :{\"S\":\"REQBATCH\"}}"


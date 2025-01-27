#!/bin/sh

. ./setHealthlakeEndpoint.sh


aws healthlake start-fhir-import-job \
--input-data-config S3Uri=s3://healthlakepoc-main-healthlakeinputbucket/input-files/ \
--datastore-id bbeafea565992204fdbdd324cb458824 \
--data-access-role-arn "arn:aws:iam::865198111306:role/service-role/healthlakepoc-main-servicerole" \
--job-output-data-config '{"S3Configuration": {"S3Uri":"s3://healthlakepoc-main-healthlakeoutputbucket/output-files","KmsKeyId":"arn:aws:kms:us-east-1:865198111306:key/fbde1ce8-d6da-49c8-9baa-8988bcbb0c85"}}' \
--region us-east-1
        
#!/bin/sh

EMAILADDRESS=$(aws ssm get-parameter --name mabr8-ews-email | jq '.Parameter.Value' -r)
EMAILPWD=$(aws ssm get-parameter --name mabr8-ews-email-pwd --with-decryption | jq '.Parameter.Value' -r)
CLIENTID=$(aws ssm get-parameter --name mabr8-ews-client-id --with-decryption | jq '.Parameter.Value' -r)
CLIENTTOKEN=$(aws ssm get-parameter --name mabr8-ews-client-token --with-decryption | jq '.Parameter.Value' -r)

python send_email_smtp.py $EMAILADDRESS $EMAILPWD $CLIENTID $CLIENTTOKEN

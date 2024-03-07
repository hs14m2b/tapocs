#!/bin/sh

aws ssm put-parameter \
    --name "main-nextjspoc-nhsmail" \
    --value "tobeupdated" \
    --type "SecureString" \
    --region "eu-west-2"

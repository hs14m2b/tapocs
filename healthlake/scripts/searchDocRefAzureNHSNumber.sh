#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET "${HEALTHLAKEENDPOINT}DocumentReference" \
    -G --data-urlencode 'nhsnumber=6700028191' \
    -G --data-urlencode 'type=http://snomed.info/sct|736253002' \
    -H "Authorization: Bearer ${token}"

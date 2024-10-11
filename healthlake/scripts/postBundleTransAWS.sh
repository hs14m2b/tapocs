#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X POST ${HEALTHLAKEENDPOINT} \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@bundleTrans.json" --verbose
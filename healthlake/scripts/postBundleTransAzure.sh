#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X POST ${HEALTHLAKEENDPOINT} \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer ${token}" \
    --data "@bundleTrans.json" --verbose
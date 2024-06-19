#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X PUT ${HEALTHLAKEENDPOINT}DocumentReference/03a6a02c-2408-44f1-bf55-0bd15e916965 \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer ${token}" \
    --data "@docrefupdate.json"
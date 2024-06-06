#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X POST ${HEALTHLAKEENDPOINT}Patient \
    -H "Content-Type: application/fhir+json" \
    --header "Authorization: Bearer ${token}" \
    --data "@patient-6700028191.json" --verbose


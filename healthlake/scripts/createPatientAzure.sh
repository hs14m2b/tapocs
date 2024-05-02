#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X POST ${HEALTHLAKEENDPOINT}Patient \
    -H "Content-Type: application/fhir+json" \
    --header "Authorization: Bearer ${token}" \
    --data "@patient-9000000009.json" --verbose


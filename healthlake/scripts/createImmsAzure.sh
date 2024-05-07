#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X POST ${HEALTHLAKEENDPOINT}Immunization \
    -H "Content-Type: application/fhir+json" \
    --header "Authorization: Bearer ${token}" \
    --data "@imms-001.json" --verbose


#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X POST ${HEALTHLAKEENDPOINT}Immunization \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@imms-001.json"

curl -X POST ${HEALTHLAKEENDPOINT}Immunization \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@imms-002.json"

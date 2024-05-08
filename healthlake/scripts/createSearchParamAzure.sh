#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X POST ${HEALTHLAKEENDPOINT}SearchParameter \
    -H "Content-Type: application/fhir+json" \
    --header "Authorization: Bearer ${token}" \
    --data "@searchParamSubjIdentifier.json" --verbose


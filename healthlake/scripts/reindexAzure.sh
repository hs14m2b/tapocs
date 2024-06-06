#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X POST "${HEALTHLAKEENDPOINT}\$reindex" \
    --header "Authorization: Bearer ${token}" \
    -H "Content-Type: application/fhir+json" \
    --data "@reindexParams.json" --verbose


#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X POST ${HEALTHLAKEENDPOINT}DocumentReference \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer ${token}" \
    --data "@docref.json"
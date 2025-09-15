#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X POST ${HEALTHLAKEENDPOINT}DocumentReference \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@docref.json"
#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X PUT ${HEALTHLAKEENDPOINT}DocumentReference/033f9fcd-f74d-48ba-b9e9-84ee919af77b \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@docref.json"
#!/bin/sh

. ./setHealthlakeEndpoint.sh

#curl -X POST ${HEALTHLAKEENDPOINT}Appointment/4a3836f5-2d42-4d3e-87c1-680173b7fa5c \
curl -X PUT ${HEALTHLAKEENDPOINT}Schedule/bc5fa28f-88f1-467d-b021-921446be32e4 \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@schedule-001.json" --verbose
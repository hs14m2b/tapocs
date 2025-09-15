#!/bin/sh

. ./setHealthlakeEndpoint.sh

#curl -X POST ${HEALTHLAKEENDPOINT}Appointment/4a3836f5-2d42-4d3e-87c1-680173b7fa5c \
curl -X POST ${HEALTHLAKEENDPOINT}Slot \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@slot-001.json" --verbose
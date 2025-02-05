#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X GET "${HEALTHLAKEENDPOINT}Appointment" \
    -G --data-urlencode 'patient%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|6700028191' \
    -H "Authorization: Bearer THISISTHETOKEN"

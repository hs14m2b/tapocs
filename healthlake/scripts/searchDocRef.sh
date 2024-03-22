#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X GET "${HEALTHLAKEENDPOINT}DocumentReference" \
    -G --data-urlencode 'subject%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|6700028191' \
    -G --data-urlencode 'type=http://snomed.info/sct|736253002' \
    -H "Authorization: Bearer THISISTHETOKEN"

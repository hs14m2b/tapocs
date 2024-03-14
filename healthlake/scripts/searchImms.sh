#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X GET "${HEALTHLAKEENDPOINT}Immunization" \
    -G --data-urlencode 'patient.identifier=https://fhir.nhs.uk/Id/nhs-number|6700028191' \
    -G --data-urlencode 'vaccine-code=http://snomed.info/sct|39114911000001105' \
    -H "Authorization: Bearer THISISTHETOKEN"



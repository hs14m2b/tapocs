#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X GET "${HEALTHLAKEENDPOINT}Immunization" \
    -G --data-urlencode 'patient%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|9000000009' \
    -H "Authorization: Bearer THISISTHETOKEN" --verbose


#    -G --data-urlencode 'vaccine-code=http://snomed.info/sct|39114911000001105' \
#    -G --data-urlencode '_tag=https://fhir.nhs.uk/Id/ods-organization-code|RX809' \

#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET "${HEALTHLAKEENDPOINT}Immunization" \
    -G --data-urlencode 'nhsnumber=9000000009' \
    -H "Authorization: Bearer ${token}"

#    -G --data-urlencode 'patient=Patient/1635af25-2397-45e5-b81b-139a71a2f7b1' \
#    -G --data-urlencode 'vaccine-code=http://snomed.info/sct|39114911000001105' \
#    -G --data-urlencode 'patient%3APatient.identifier=https://fhir.nhs.uk/Id/nhs-number|9000000009' \


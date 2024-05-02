#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET "${HEALTHLAKEENDPOINT}Immunization" \
    -G --data-urlencode 'patient=Patient/1635af25-2397-45e5-b81b-139a71a2f7b1' \
    -H "Authorization: Bearer ${token}"

#    -G --data-urlencode 'vaccine-code=http://snomed.info/sct|39114911000001105' \


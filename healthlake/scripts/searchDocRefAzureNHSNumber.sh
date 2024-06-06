#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET "${HEALTHLAKEENDPOINT}DocumentReference" \
     -G --data-urlencode 'nhsnumber=6700028191' \
     -H "x-ms-use-partial-indices: true" \
   -H "Authorization: Bearer ${token}"

#    -G --data-urlencode 'subject%3APatient.identifier=https://fhir.nhs.uk/Id/nhs-number|6700028191' \
#    -G --data-urlencode 'nhsnumbersi=6700028191' \
#    -G --data-urlencode 'type=http://snomed.info/sct|736253002' \

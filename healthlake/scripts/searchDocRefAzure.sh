#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET "${HEALTHLAKEENDPOINT}DocumentReference" \
    -G --data-ur\lencode 'subject%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|4409815415' \
   -H "Authorization: Bearer ${token}"

#    -G --data-urlencode 'custodian.identifier=https://fhir.nhs.uk/Id/ods-organization-code|Y05868' \
#    -G --data-ur\lencode 'subject%3APatient.identifier=https://fhir.nhs.uk/Id/nhs-number|6700028191' \
#    -G --data-urlencode 'nhsnumbersi=6700028191' \
#    -G --data-urlencode 'nhsnumber=4409815415' \
#    -G --data-urlencode 'odscode=Y05868' \
#    -G --data-urlencode 'type=http://snomed.info/sct|736253002' \
#    -G --data-urlencode '_id=03a6a02c-2408-44f1-bf55-0bd15e916965' \

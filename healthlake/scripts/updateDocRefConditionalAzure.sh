#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X PUT "${HEALTHLAKEENDPOINT}DocumentReference?_id=03a6a02c-2408-44f1-bf55-0bd15e916965&odscode=C86023" \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer ${token}" \
    --verbose --data "@docrefupdate.json" 

    #    -G --data-urlencode '_id=03a6a02c-2408-44f1-bf55-0bd15e916965' \
#    -G --data-urlencode 'custodian=https://fhir.nhs.uk/Id/ods-organization-code|Y05868' \

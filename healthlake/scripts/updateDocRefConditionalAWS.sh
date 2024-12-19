#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X PUT "${HEALTHLAKEENDPOINT}DocumentReference?_id=033f9fcd-f74d-48ba-b9e9-84ee919af77b&custodian%3Aidentifier=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fods-organization-code%7CY05868" \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --verbose --data "@docrefupdate.json" 

    #    -G --data-urlencode '_id=03a6a02c-2408-44f1-bf55-0bd15e916965' \
#    -G --data-urlencode 'custodian=https://fhir.nhs.uk/Id/ods-organization-code|Y05868' \

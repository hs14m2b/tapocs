#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X GET "${HEALTHLAKEENDPOINT}List/7697b867-43c9-4972-be6f-fe6a6625e0b3x" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    -H "Accept: application/fhir+json;version=1" \
    -H "X-Request-ID: a28f134a-bae7-41e5-998c-dc20add65630" --verbose



#    -G --data-urlencode 'subject%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|4409815415' \
#    -G --data-urlencode 'status=current' \
#    -G --data-urlencode 'code=submissionset' \
#    -G --data-urlencode 'identifier=urn:oid:1.2.10.255.255.254.2024.10.7.13.18.26.774.2' \
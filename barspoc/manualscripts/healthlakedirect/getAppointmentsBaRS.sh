#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X POST "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/getappointments" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    -H "Accept: application/fhir+json;version=1" \
    -H "X-Request-ID: a28f134a-bae7-41e5-998c-dc20add65630" \
    --data "addresspostcode=&nhsnumber=9693893123&favcolour=blue" --verbose



#    -G --data-urlencode 'subject%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|4409815415' \
#    -G --data-urlencode 'status=current' \
#    -G --data-urlencode 'code=submissionset' \
#    -G --data-urlencode 'identifier=urn:oid:1.2.10.255.255.254.2024.10.7.13.18.26.774.2' \

#!/bin/sh

. ./setHealthlakeEndpoint.sh

curl -X GET "${HEALTHLAKEENDPOINT}List?code=submissionset&identifier=urn%3Aoid%3A1.2.10.255.255.254.2024.10.7.14.17.4.371.2&status=current&subject%3Aidentifier=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fnhs-number%7C4409815415" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    -H "Accept: application/fhir+json;version=1" \
    -H "X-Request-ID: a28f134a-bae7-41e5-998c-dc20add65630"



#    -G --data-urlencode 'subject%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|4409815415' \
#    -G --data-urlencode 'status=current' \
#    -G --data-urlencode 'code=submissionset' \
#    -G --data-urlencode 'identifier=urn:oid:1.2.10.255.255.254.2024.10.7.13.18.26.774.2' \

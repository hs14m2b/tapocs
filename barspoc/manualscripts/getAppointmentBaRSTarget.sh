#!/bin/sh

curl -vk https://bars-int-x26.tsassolarch.thirdparty.nhs.uk/barspoc/FHIR/R4/Appointment/4a3836f5-2d42-4d3e-87c1-680173b7fa5c \
--cert ../certs/BaRS-INT-X26.TSASSolArch.thirdparty.nhs.uk.crt \
--key ../certs/BaRS-INT-X26.TSASSolArch.thirdparty.nhs.uk.key



#    -G --data-urlencode 'subject%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|4409815415' \
#    -G --data-urlencode 'status=current' \
#    -G --data-urlencode 'code=submissionset' \
#    -G --data-urlencode 'identifier=urn:oid:1.2.10.255.255.254.2024.10.7.13.18.26.774.2' \

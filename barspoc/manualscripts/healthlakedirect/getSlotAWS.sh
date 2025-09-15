#!/bin/sh

. ./setHealthlakeEndpoint.sh

#curl -X GET "${HEALTHLAKEENDPOINT}Slot/7ad9d19e-1f0b-422e-ae95-4b7b9379ee02" \
curl -X GET "${HEALTHLAKEENDPOINT}Slot?" \
    -G --data-urlencode 'schedule.actor=HealthcareService/63bf8f0c-3902-4a2a-a4ec-3393d22ae658' \
    -H "Authorization: Bearer THISISTHETOKEN" \
    -H "Accept: application/fhir+json;version=1" \
    -H "X-Request-ID: a28f134a-bae7-41e5-998c-dc20add65630" --verbose



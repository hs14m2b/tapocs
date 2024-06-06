#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET ${HEALTHLAKEENDPOINT}Immunization \
    --header "Authorization: Bearer ${token}"


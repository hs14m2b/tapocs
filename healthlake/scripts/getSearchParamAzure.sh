#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET ${HEALTHLAKEENDPOINT}SearchParameter \
    --header "Authorization: Bearer ${token}"


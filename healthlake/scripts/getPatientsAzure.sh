#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET "${HEALTHLAKEENDPOINT}Patient" \
    -H "Authorization: Bearer ${token}"



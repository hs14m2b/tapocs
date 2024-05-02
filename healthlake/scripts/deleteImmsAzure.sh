#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X DELETE "${HEALTHLAKEENDPOINT}Immunization/be239d03-a658-4614-a727-213c211cf020" \
    -H "Authorization: Bearer ${token}"



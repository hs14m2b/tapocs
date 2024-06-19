#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET ${HEALTHLAKEENDPOINT}DocumentReference/03a6a02c-2408-44f1-bf55-0bd15e916965 \
    --header "Authorization: Bearer ${token}"


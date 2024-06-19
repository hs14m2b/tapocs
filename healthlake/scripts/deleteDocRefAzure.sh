#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X DELETE "${HEALTHLAKEENDPOINT}DocumentReference/03a6a02c-2408-44f1-bf55-0bd15e916965" \
    -H "Authorization: Bearer ${token}"



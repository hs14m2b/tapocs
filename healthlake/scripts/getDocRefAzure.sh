#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET ${HEALTHLAKEENDPOINT}DocumentReference/1031090a-beb4-4db7-8cb1-55f3057d5efa \
    --header "Authorization: Bearer ${token}" --verbose


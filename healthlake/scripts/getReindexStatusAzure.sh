#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET ${HEALTHLAKEENDPOINT}_operations/reindex/c3cd14a1-dc71-49fd-ae5a-6f353896be9c \
    --header "Authorization: Bearer ${token}"


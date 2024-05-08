#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X GET ${HEALTHLAKEENDPOINT}DocumentReference/18bd6490-0689-4b69-a907-7db2f294c5fb/%24reindex \
    -H "Authorization: Bearer ${token}" 

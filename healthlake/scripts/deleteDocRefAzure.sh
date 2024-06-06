#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X DELETE "${HEALTHLAKEENDPOINT}DocumentReference/18bd6490-0689-4b69-a907-7db2f294c5fb" \
    -H "Authorization: Bearer ${token}"



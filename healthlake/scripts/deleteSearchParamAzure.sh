#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X DELETE "${HEALTHLAKEENDPOINT}SearchParameter/957beebf-a041-47f5-a10a-2e0b154318ee" \
    -H "Authorization: Bearer ${token}"

curl -X DELETE "${HEALTHLAKEENDPOINT}SearchParameter/6ca5001f-1fa7-40ca-b088-20fb52936e90" \
    -H "Authorization: Bearer ${token}"


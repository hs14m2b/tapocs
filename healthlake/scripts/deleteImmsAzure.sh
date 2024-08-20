#!/bin/sh

. ./setHealthlakeEndpointAzure.sh

curl -X DELETE "${HEALTHLAKEENDPOINT}Immunization/70abd0ac-29db-483e-809e-606e69f57aee" \
    -H "Authorization: Bearer ${token}"



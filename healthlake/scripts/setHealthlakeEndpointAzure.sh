#!/bin/sh

export HEALTHLAKEENDPOINT="https://mabr8ukshdsvssworkspace-healthlake.fhir.azurehealthcareapis.com/"
echo $HEALTHLAKEENDPOINT

export token=$(az account get-access-token --resource=https://mabr8ukshdsvssworkspace-healthlake.fhir.azurehealthcareapis.com --query accessToken --output tsv)
echo $token

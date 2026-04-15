#!/bin/bash
# This script reads content from Confluence using the REST API and saves it to a file.
# Usage: ./readconfluence.sh <space_key> <page_title> <output_file>

API_KEY=$(<../keys/api.key)
SPACE_KEY=$1
PAGE_TITLE=$2
OUTPUT_FILE=$3
# Base URL for Confluence API
BASE_URL="https://nhsd-confluence.digital.nhs.uk/rest/api/space"
# Make the API request and save the response to the output file
curl -v -H "Authorization: Bearer $API_KEY" "$BASE_URL"

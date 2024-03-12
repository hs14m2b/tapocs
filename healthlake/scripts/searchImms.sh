curl -X GET "https://healthlake.us-east-1.amazonaws.com/datastore/22a0fb0dbfb52c17ca716f0b92c64d11/r4/Immunization" \
    -G --data-urlencode 'patient%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|6700028191' \
    -H "Authorization: Bearer THISISTHETOKEN"

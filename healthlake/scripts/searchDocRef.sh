curl -X GET "https://healthlake.us-east-1.amazonaws.com/datastore/7b4ecba72dc7fef0b302931ab19d5f32/r4/DocumentReference" \
    -G --data-urlencode 'subject%3Aidentifier=https://fhir.nhs.uk/Id/nhs-number|6700028191' \
    -H "Authorization: Bearer THISISTHETOKEN" --verbose

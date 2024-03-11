curl -X POST https://healthlake.us-east-1.amazonaws.com/datastore/7b4ecba72dc7fef0b302931ab19d5f32/r4/DocumentReference \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@docref.json"
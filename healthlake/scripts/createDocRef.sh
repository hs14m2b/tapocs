curl -X POST https://healthlake.us-east-1.amazonaws.com/datastore/22a0fb0dbfb52c17ca716f0b92c64d11/r4/DocumentReference \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer THISISTHETOKEN" \
    --data "@docref.json"
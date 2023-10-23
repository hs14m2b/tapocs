curl -X POST \
    --header "Accept: */*" \
    --header "Content-type: application/json" \
    -d '{"data": {"type": "MessageBatch","attributes": {"routingPlanId": "b838b13c-f98c-4def-93f0-515d4e4f4ee1","messageBatchReference": "da0b1495-c7cb-468c-9d81-07dee089d728","messages": [{"messageReference": "703b8008-545d-4a04-bb90-1f2946ce1575","recipient": {"nhsNumber": "9686368973","dateOfBirth": "1982-03-17"},"personalisation": {}}]}}}' \
    https://sandbox.api.service.nhs.uk/comms/v1/message-batches

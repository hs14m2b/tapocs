# aiagentpoc

A PoC to build an AI Agent using Amazon Bedrock to
- find appointments for a person based on their NHS number
- allow them to reschedule their appointment

Design
- three lambda functions to support the AI Agent
    - Find Appointments - takes in NHS number and invokes BaRS (actually uses PDM) to retrieve appointment pointers and then appointment details (via BaRS)
    - Find Slots - for a specific appointment, invokes BaRS to find available slots for the service
    - Reschedule Appointment - links the chosen appointment to the new slot and sends update via BaRS


- AI Agent - starting based on tutorial and hard-coding things to get started.

https://docs.aws.amazon.com/bedrock/latest/userguide/agent-tutorial.html

https://docs.aws.amazon.com/bedrock/latest/userguide/agents-lambda.html



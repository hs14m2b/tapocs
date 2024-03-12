#!/bin/sh

aws healthlake create-fhir-datastore  --region us-east-1 --cli-input-json file://healthlake-datastore.json




#--datastore-name "healthlakepoc-main-mabr8-202403081735" \
#    --datastore-type "R4" \
#    --sse-configuration KmsEncryptionConfig={CmkType=CUSTOMER_MANAGED_KMS_KEY,KmsKeyId=fbde1ce8-d6da-49c8-9baa-8988bcbb0c85} \
#     --identity-provider-configuration AuthorizationStrategy=SMART_ON_FHIR_V1,FineGrainedAuthorizationEnabled=false,Metadata={"authorization_endpoint":"https://endpoint/authorization","grant_types_supported":["authorization_code","client_credentials"],"token_endpoint":"https://endpoint/token","code_challenge_methods_supported":["S256"],"capabilities":["launch-standalone","client-confidential-symmetric","sso-openid-connect"]},IdpLambdaArn=arn:aws:lambda:us-east-1:865198111306:function:healthlakepoc-main-smartonfhirauth \
#   --region us-east-1 \
#    --debug

#    --identity-provider-configuration AuthorizationStrategy=SMART_ON_FHIR_V1,FineGrainedAuthorizationEnabled=false,Metadata={\"authorization_endpoint\":\"https://endpoint/authorization\",\"grant_types_supported\":[\"authorization_code\",\"client_credentials\"],\"token_endpoint\":\"https://endpoint/token\",\"code_challenge_methods_supported\":[\"S256\"],\"capabilities\":[\"launch-standalone\",\"client-confidential-symmetric\",\"sso-openid-connect\"]},IdpLambdaArn=arn:aws:lambda:us-east-1:865198111306:function:healthlakepoc-main-smartonfhirauth \
#    --identity-provider-configuration AuthorizationStrategy=SMART_ON_FHIR_V1,FineGrainedAuthorizationEnabled=false,Metadata={},IdpLambdaArn=arn:aws:lambda:us-east-1:865198111306:function:healthlakepoc-main-smartonfhirauth \
#    --identity-provider-configuration "{"AuthorizationStrategy":"SMART_ON_FHIR_V1","FineGrainedAuthorizationEnabled":false,"Metadata":"{\"authorization_endpoint\":\"https://endpoint/authorization\",\"grant_types_supported\":[\"authorization_code\",\"client_credentials\"],\"token_endpoint\":\"https://endpoint/token\",\"code_challenge_methods_supported\":[\"S256\"],\"capabilities\":[\"launch-standalone\",\"client-confidential-symmetric\",\"sso-openid-connect\"]}","IdpLambdaArn":"arn:aws:lambda:us-east-1:865198111306:function:healthlakepoc-main-smartonfhirauth"}" \





#--cli-input-json healthlake-datastore.json --debug

#--datastore-type-version "R4"
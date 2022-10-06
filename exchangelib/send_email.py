from email import message
from http import client
import telnetlib
from exchangelib import Credentials, OAuth2LegacyCredentials,OAuth2Credentials, Account, Message 
from exchangelib import Mailbox, Configuration, DELEGATE, IMPERSONATION, Identity
from exchangelib import OAUTH2
from azure.identity import ClientSecretCredential, UsernamePasswordCredential
import sys
import boto3
import logging
from exchangelib.util import PrettyXmlHandler

#logging.basicConfig(level=logging.DEBUG, handlers=[PrettyXmlHandler()])

client = boto3.client('ssm')

if len(sys.argv) >= 5:
    email_address=sys.argv[1]
    email_pwd=sys.argv[2]
    client_id=sys.argv[3]
    client_secret=sys.argv[4]
else:
    email_address = client.get_parameter(
        Name='mabr8-ews-email',
        WithDecryption=False
    )['Parameter']['Value']

    email_pwd = client.get_parameter(
        Name='mabr8-ews-email-pwd',
        WithDecryption=True
    )['Parameter']['Value']

    client_id = client.get_parameter(
        Name='mabr8-ews-client-id',
        WithDecryption=True
    )['Parameter']['Value']

    client_secret = client.get_parameter(
        Name='mabr8-ews-client-token',
        WithDecryption=True
    )['Parameter']['Value']


to_email_address="matthew.brown1@nhs.net"
if len(sys.argv) == 2:
    to_email_address=sys.argv[1]

if len(sys.argv) == 6:
    to_email_address=sys.argv[5]

print(to_email_address)

tenant_id='37c354b2-85b0-47f5-b222-07b48d774ee3'
basic_auth=False
send_mail=True
if basic_auth :
    #Basic authentication
    credentials = Credentials(username=email_address, password=email_pwd)
    # either of the configuration lines below appears to work fine
    #config = Configuration(service_endpoint='https://outlook.office365.com/ews/exchange.asmx', credentials=credentials)
    config = Configuration(server='outlook.office365.com', credentials=credentials)
    #Basic Auth
    account = Account(primary_smtp_address=email_address, config=config, autodiscover=False, access_type=DELEGATE)
    if send_mail :
        message = Message(
            account=account,
            subject='Test Email sent via EWS',
            body='This is the body of a test email',
            to_recipients=[Mailbox(email_address=to_email_address)])
        message.send()
else:
    #OAuth2
    identity=Identity(primary_smtp_address=email_address)
    credentials = OAuth2Credentials(
        client_id=client_id, 
        client_secret=client_secret, 
        tenant_id=tenant_id,
        identity=identity)
    config = Configuration(
        server='outlook.office365.com', 
        credentials=credentials, 
        auth_type=OAUTH2)
    account = Account(
        email_address, 
        config=config, 
        autodiscover=False, 
        access_type=DELEGATE)
    if send_mail :
        message = Message(
            account=account,
            subject='Test Email sent via EWS using OAuth2',
            body='This is the body of a test email sent using OAuth2',
            to_recipients=[Mailbox(email_address=to_email_address)])
        message.send()

from email import message
from http import client
from exchangelib import Credentials, OAuth2Credentials, Account, Message, Mailbox, Configuration, DELEGATE
import sys
import boto3

client = boto3.client('ssm')

email_address = client.get_parameter(
    Name='mabr8-ews-email',
    WithDecryption=False
)['Parameter']['Value']

client_id = client.get_parameter(
    Name='mabr8-ews-client-id',
    WithDecryption=True
)['Parameter']['Value']

client_secret = client.get_parameter(
    Name='mabr8-ews-client-token',
    WithDecryption=True
)['Parameter']['Value']

email_pwd = client.get_parameter(
    Name='mabr8-ews-email-pwd',
    WithDecryption=True
)['Parameter']['Value']



to_email_address="matthew.brown1@nhs.net"
if len(sys.argv) == 2:
    to_email_address=sys.argv[1]

print(to_email_address)

#OAuth2 authentication
#credentials = OAuth2Credentials(client_id, client_secret)
#Basic authentication
credentials = Credentials(username=email_address, password=email_pwd)
# either of the configuration lines below appears to work fine
config = Configuration(service_endpoint='https://outlook.office365.com/ews/exchange.asmx', credentials=credentials)
#config = Configuration(server='outlook.office365.com', credentials=credentials)
account = Account(primary_smtp_address=email_address, config=config, autodiscover=False, access_type=DELEGATE)
message = Message(account=account,
    subject='Test Email sent via EWS',
    body='This is the body of a test email',
    to_recipients=[Mailbox(email_address=to_email_address)])
message.send()
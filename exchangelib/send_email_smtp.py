from email import message
from http import client
from re import M
import sys
import boto3
import smtplib
import ssl

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


"""
Opens an SMTP connection, optionally starts TLS, and logs in to the SMTP server
"""
# local_hostname is required to be provided as smtplib is not working it out
# properly. See SPII-11953 for more details.
local_hostname = '127.0.0.1'
context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
smtpServer = None

#the below appear to require HSCN to successfully send
#smtp.office365.com
#send.nhs.net

try:
    print("about to generate smtp server")
    smtpServer = smtplib.SMTP(
        "send.nhs.net",
        587,
        local_hostname=local_hostname,
        timeout=30
    )
    print("generated smtp server")
    smtpServer.starttls(context=context)
    print("started TLS")
    smtpServer.ehlo()

    smtpServer.login(email_address, email_pwd)
    print("logged into smtp server")

except Exception as e:
    print("Got an error connecting " + str(e))

else:
    msg = message.EmailMessage()
    msg.set_content('This is the body of a test email')

    msg['Subject'] = 'Test Email sent via SMTP'
    msg['From'] = email_address
    msg['To'] = to_email_address
    #response = smtpServer.sendmail(email_address, [to_email_address], 'This is the body of a test email')
    response = smtpServer.send_message(msg)
    smtpServer.quit()

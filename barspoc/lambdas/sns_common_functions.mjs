import { v4 as uuidv4 } from 'uuid';
import {
  SNSClient,
  PublishCommand
} from "@aws-sdk/client-sns";

const REGION = "eu-west-2";
let snsclient;

const publishEvent = async (message, snsTopicArn) => {
    if (!snsclient || snsclient === undefined) snsclient = new SNSClient({ region: REGION });
    let input = {
        "Message": message,
        "TopicArn": snsTopicArn
    }
    console.log("Publishing event to SNS topic ", snsTopicArn);
    const command = new PublishCommand(input);
    const response = await snsclient.send(command);
    console.log("response from SNS publish ", response);
    return response;
}

export class snsCommonFunctionObject{
  constructor(){
    this.publishEvent = publishEvent;
  }
}

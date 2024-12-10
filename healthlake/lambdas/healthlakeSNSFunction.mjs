
export const handler = async (event) => {
  console.log(JSON.stringify(event));
  try {
    for (let record of event.Records) {
      let messageString = record.Sns.Message;
      let messageJson = JSON.parse(messageString);
      console.log("Message is " + JSON.stringify(messageJson));
    }
  } catch (error) {
    
  }
}


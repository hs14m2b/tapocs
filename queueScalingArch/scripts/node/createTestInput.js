const uuidv4 = require('uuid').v4;
const fs = require('node:fs/promises');
const maxRows = 20000;


const main = async (argv) => {
  console.log(argv[2]);
  let fileName = argv[2];
  let batch_id = argv[3];
  let fileHandle = await fs.open("./" + fileName, "w","775");
  let wrtStrm = fileHandle.createWriteStream();
  //write header
  let header = "messageid,nhsnumber,time,b64json\n";
  await wrtStrm.write(header);
  for (let i = 0; i < maxRows; i++){
    let id = uuidv4()+ i.toString().padStart(10, '0');;
    let nhsnumber = i.toString().padStart(10, '9');
    let __time = Date.now().toString();
    let personalisation = {
      "title": "Mr",
      "familyname": "Brown",
      "givenname": "Matthew",
      "nhsnumberformatted": nhsnumber.substring(0, 3) + " " + nhsnumber.substring(3, 6) + " " + nhsnumber.substring(6)
    };
    let request = {
      request_id: id,
      request_time: __time,
      nhs_number: nhsnumber,
      client_id: "12345",
      batch_id: batch_id,
      personalisation: personalisation
    }
    let b64request = Buffer.from(JSON.stringify(request)).toString("base64");
    await wrtStrm.write(id + "," + nhsnumber + "," + __time + "," +b64request + "\n");
  }
  wrtStrm.close();
  fileHandle.close();
  //open read stream from file
  //fileHandle = await fs.open(fileName, "r");
  //let rdStrm = fileHandle.createReadStream({ "start": 0 });
  //let buf = readFileSync(fileName);
  //console.log("got read stream");
  //let params = {Bucket: 'main-queuescaling-mabr8-inputs', Key: "input/"+fileName, Body: rdStrm};
  //v2 
  //let s3 = new AWS.S3();
  //await s3.putObject(params).promise();
  //v3
  //const client = new S3Client({region: "eu-west-2"});
  //const command = new PutObjectCommand(params);
  //const response = await client.send(command);

  //rdStrm.close();
  //fileHandle.close();
}

main(process.argv);

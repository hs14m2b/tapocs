const uuidv4 = require('uuid').v4;
const fs = require('node:fs/promises');
const maxRows = 10000;


const main = async (argv) => {
  console.log(argv[2]);
  let fileName = argv[2];
  let fileHandle = await fs.open("./" + fileName, "w","775");
  let wrtStrm = fileHandle.createWriteStream();
  //write header
  let header = "messageid,nhsnumber,time\n";
  await wrtStrm.write(header);
  for (let i = 0; i < maxRows; i++){
    let id = uuidv4();
    let nhsnumber = i.toString().padStart(10, '9');
    let __time = Date.now().toString();
    await wrtStrm.write(id + "," + nhsnumber + "," + __time + "\n");
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

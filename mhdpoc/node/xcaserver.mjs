import { readFileSync } from 'node:fs';
let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}

https
  .createServer(
{   
      // ...
      cert: readFileSync('main-xcapoc-xcapocbe.nhsdta.com.pem'),
      key: readFileSync('main-xcapoc-xcapocbe.nhsdta.com.key'),
      //requestCert: true,
      //rejectUnauthorized: false,
      ca: readFileSync('gazelle-ca.pem'),
      // ...
    },
    (req, res) => {
      console.log(JSON.stringify(req));
      res.writeHead(200);
      res.end('Hello, world!');
    }
  )
  .listen(9443);
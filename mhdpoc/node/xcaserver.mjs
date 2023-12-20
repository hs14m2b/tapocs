import { inspect } from 'node:util';
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
      requestCert: true,
      rejectUnauthorized: false,
      ca: readFileSync('gazelle-ca.pem'),
      // ...
    },
    (req, res) => {
      //console.log(inspect(req, false, 2));
      console.log("got a request");
      console.log(req.url);
      console.log(JSON.stringify(req.headers));
      res.writeHead(200);
      res.end('Hello, world!');
    }
  )
  .listen(9443);
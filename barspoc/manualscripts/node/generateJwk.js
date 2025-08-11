var fs = require('fs');
var rsaPemToJwk = require('rsa-pem-to-jwk');
console.log("Hello, World!");
var pem = fs.readFileSync('../../certs/mhdtest001.rsa.key', 'utf8');
console.log(pem);
var jwk = rsaPemToJwk(pem, {use: 'sig'}, 'private');
console.log(jwk);
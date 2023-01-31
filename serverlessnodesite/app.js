var express = require("express");
var server     = express();
var exphbs  = require('express-handlebars');
var path    = require("path");
const bodyParser = require('body-parser');
const https = require('https');
const querystring = require('querystring');
const STATICPREFIX = process.env.STATICPREFIX;
const STATICDOMAIN = process.env.STATICDOMAIN;


//server.use(express.static(__dirname + '/assets'));
//server.use(express.static(__dirname + '/static'));
server.engine('handlebars', exphbs());
server.set('view engine', 'handlebars');
server.set('views',(path.join(__dirname+'/views')));
server.use(bodyParser.urlencoded({ extended: true }));

server.get('/default',function(req,res){
  res.sendFile((path.join(__dirname+'/default.html')));
});
server.get('/tactical.html',function(req,res){
  res.sendFile((path.join(__dirname+'/tactical.html')));
});
server.get('/begin',function(req,res){
  res.sendFile((path.join(__dirname+'/selfisolate.html')));
});
server.get('/keyworker',function(req,res){
  res.sendFile((path.join(__dirname+'/details.html')));
});
server.get('/confirm',function(req,res){
  res.sendFile((path.join(__dirname+'/confirm.html')));
});
server.get('/',function(req,res){
  res.redirect('/default');
});
server.get('/tactical', function (req, res) {
  let staticpath='https://'+STATICDOMAIN+"/"+STATICPREFIX+"/";
  console.log("static path is " + staticpath);
  res.render('tactical', {
    staticpath: staticpath
  });
});
server.post('/details', function (req, res) {
  console.log('Got body:', req.body);
  if (!req.body['selfisolating'] || ! req.body['keyworker']){
    res.render('selfisolate');
  }
  else{
    let blah='mysecretcode';
    res.render('details', {
      blah: blah
    });
  }
});
server.post('/callapi', function (req, res) {
  console.log('Got body:', req.body);
  //6Le9ZOgUAAAAAFa7bM9wUegT00LkKWLRIyOVFh0k
  //https://www.google.com/recaptcha/api/siteverify
  if (req.body['g-recaptcha-response'] && req.body['g-recaptcha-response'] !='')
  {
    let postData = querystring.stringify({
      "secret": "6Le9ZOgUAAAAAFa7bM9wUegT00LkKWLRIyOVFh0k",
      "response": req.body['g-recaptcha-response']
    });
    console.log(postData);
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'serverlication/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    var req2 = https.request(options, function (res2) {
			var result = '';
			res2.on('data', function (chunk) {
				result += chunk;
			});
			res2.on('end', function () {
        console.log(result);
        let resultJson = JSON.parse(result);
        if (resultJson['success'])
        {
          
        }
        let urlCode = "456456456";
        res.redirect("https://localhost?urlCode="+urlCode);
            });
			res2.on('error', function (err) {
				console.log(err);
				reject(err);
			})
		});
		 
		// req error
		req2.on('error', function (err) {
		  console.log(err);
		});
		 
		//send request witht the postData form
		req2.write(postData);
		req2.end();   

  }
  else
  {
    let urlCode = "123123123";
    res.redirect("https://localhost?urlCode="+urlCode);
    }
});
server.get('/intro', function (req, res) {
  let blah='mysecretcode';
  res.render('intro', {
    blah: blah
  });
});
server.get('/selfisolate', function (req, res) {
  let blah='mysecretcode';
  res.render('selfisolate', {
    blah: blah
  });
});

module.exports = server;
console.log("exported server");

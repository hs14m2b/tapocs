import Cookies from 'cookies';
import { serialize } from "cookie";

const FORMDATACOOKIENAME = "formdata";
const REFERERMAP = {
  "/form1": "/form2",
  "/form2": "/formx",
  "/formx": "/confirmdata"
}
const DEFAULTROUTE = "/confirmdata";
const UNKNOWN = "unknown";

export const config = {
  api: {
    bodyParser: true,
  },
}

function bodyBufferToObject(body) {
  const parsedBody = new URLSearchParams(body.toString());
  const result = {}
  for(const [key, value] of parsedBody) { // each 'entry' is a [key, value] tuple
    result[key] = value;
  }
  return result;
}

export default function handler(req, res) {
  // Get data submitted in request's body.
  let body = (Buffer.isBuffer(req.body)) ? Object.fromEntries(new URLSearchParams(req.body.toString())) : req.body;
  console.log("body -> " + JSON.stringify(body));
  console.log(typeof body);
  console.log(req.headers);
  let referer = (req.headers.referer) ? req.headers.referer : UNKNOWN;
  console.log(referer);
  const cookies = new Cookies(req, res);
  const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
  let formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));

  console.log(JSON.stringify(formdataCookie));

  for (let key in body) {
    //if (body.hasOwnProperty(key)) {
      console.log("adding " + key + " -> " + body[key] + " to cookie");
      formdataCookie[key] = body[key];
    //}
  }

  console.log("cookie is now " + JSON.stringify(formdataCookie));


  const cookie = serialize(FORMDATACOOKIENAME, JSON.stringify(formdataCookie), {
    httpOnly: false,
    path: "/",
  });
  res.setHeader("Set-Cookie", cookie);
  console.log("have set cookie header");
  let foundRedirect = false;
  let confirmScreenShown = (formdataCookie.confirmScreenShown) ? true : false;
  console.log("has confirm screen been shown yet? " + confirmScreenShown);
  // Sends a HTTP success code
  if (confirmScreenShown) {
    console.log("confirm screen has been shown - sending user back to confirm screen");
    foundRedirect = true;
    res.redirect(302, DEFAULTROUTE);
  }
  else if (referer != UNKNOWN) {
    console.log("referer is known");
    for (let key in REFERERMAP) {
      //if (REFERERMAP.hasOwnProperty(key)) {
      console.log("checking " + key);
      if (referer.endsWith(key)) {
        foundRedirect = true;
        res.redirect(302, REFERERMAP[key]);
        break;
      }
      //}
    }
  }
  else
  {
    console.log("referer is not known");
    let target = (body.nextpage) ? body['nextpage'] : UNKNOWN;
    console.log("target is " + target);
    if (target != UNKNOWN) {
      foundRedirect = true;
      res.redirect(302, target);
    }
  }

  if (!foundRedirect) res.redirect(302, DEFAULTROUTE);
  
}
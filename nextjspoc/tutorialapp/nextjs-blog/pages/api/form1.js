import { serialize } from "cookie";

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
  // Optional logging to see the responses
  // in the command line where next.js app is running.
/*  if (Buffer.isBuffer(body))
  {
    console.log("body is a buffer");
    console.log('body', body.toString())
    body = bodyBufferToObject(body);
    console.log('body: ', body);
  }
  else
  {*/
    console.log('body: ', body);
  //}

  // Guard clause checks for first and last name,
  // and returns early if they are not found
  if (!body['givenname'] || !body['familyname']) {
    // Sends a HTTP bad request error code
    return res.status(400).json({ data: 'Given Name or Family Name not found' })
  }

  // Found the name.
  let personName = {
    givenname: body['givenname'],
    familyname: body['familyname']
  }
  const cookie = serialize("personname-cookie", JSON.stringify(personName), {
    httpOnly: false,
    path: "/",
  });
    res.setHeader("Set-Cookie", cookie);
  // Sends a HTTP success code
  res.redirect(302, "/form2");
}
import { serialize } from "cookie";

export default function handler(req, res) {
  // Get data submitted in request's body.
  const body = req.body

  // Optional logging to see the responses
  // in the command line where next.js app is running.
  console.log('body: ', body)

  // Guard clause checks for first and last name,
  // and returns early if they are not found
  if (!body['address-postcode']) {
    // Sends a HTTP bad request error code
    return res.status(400).json({ data: 'Postcode not found' })
  }

  // Found the postcode.
  const cookie = serialize("postcode-cookie", body['address-postcode'], {
    httpOnly: false,
    path: "/",
  });
    res.setHeader("Set-Cookie", cookie);
  // Sends a HTTP success code
  res.redirect(302, "/form1data");
}
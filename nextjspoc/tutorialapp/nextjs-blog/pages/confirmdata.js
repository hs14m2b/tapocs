import Cookies from 'cookies';
import Head from 'next/head';
import Link from 'next/link';
import bodyParser from "body-parser";
import util from "util";

const getBody = util.promisify(bodyParser.urlencoded());

export default function Home({ allData }) {
  const hasData = allData.hasData;
  return (
    <>
      <Head>
        <title>Next App form</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h1 className="nhsuk-heading-xl">
        A page that shows the data collected from the user
      </h1>
      
      <div className={(!hasData || allData.postcodeerror) ? "nhsuk-error-summary" : "nhsuk-error-summary nhsuk-hidden"} aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
        <h2 className="nhsuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h2>
        <div className="nhsuk-error-summary__body">
          <p>
            The postcode supplied is not valid
          </p>
          <ul className="nhsuk-list nhsuk-error-summary__list" role="list">
            <li>
              <Link href="/form2">Please update the postcode</Link>
            </li>
          </ul>
        </div>
      </div>
      
      <dl className="nhsuk-summary-list">
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">
            Postcode
          </dt>
          <dd className="nhsuk-summary-list__value">
            {allData.postcode}
          </dd>
          <dd className="nhsuk-summary-list__actions">
            <a href="/form2">
              Change
            </a>
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">
            Name
          </dt>
          <dd className="nhsuk-summary-list__value">
            {allData.givenname + " " + allData.familyname}
          </dd>
          <dd className="nhsuk-summary-list__actions">
            <a href="/form1">
              Change<span > name</span>
            </a>
          </dd>
        </div>
      </dl>

      <Link href="/form1">Back to the start</Link>
    </>
  )
}

export async function getServerSideProps({ req, res }) {
  // Get data submitted in request's body.
  const method = req.method;
  console.log(method);
  //either processing cookies or a posted body
  if (method=="GET")
  {
    console.log("processing cookies");
    const cookies = new Cookies(req, res);
    const postcodeCookie = decodeURIComponent(cookies.get('postcode-cookie'));
    const personnameCookie = decodeURIComponent(cookies.get('personname-cookie'));
    console.log(personnameCookie);
    console.log(JSON.stringify(postcodeCookie));
    let personNameObject = JSON.parse(personnameCookie);
    const allData = {
      "hasData": true,
      "postcode": postcodeCookie,
      "postcodeerror": false,
      "givenname": personNameObject.givenname,
      "familyname": personNameObject.familyname
    };
    if (!valid_postcode(postcodeCookie)) allData.postcodeerror = true;
    return {
      props: {
        allData,
      },
    };
  }
  else {
    await getBody(req, res);
    console.log(req.method, req.body);
    console.log("processing a body")
    const allData = {
      "hasData": true,
      "postcode": req.body.postcodehdn,
      "givenname": req.body.givennamehdn,
      "familyname": req.body.familynamehdn
    };
    if (!valid_postcode(req.body.postcodehdn)) allData.postcodeerror = true;
    return {
      props: {
        allData,
      },
    };
  }
}

function valid_postcode(postcode) {
    postcode = postcode.replace(/\s/g, "");
    const regex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]{0,1} ?[0-9][A-Z]{2}$/i;
    return regex.test(postcode);
}

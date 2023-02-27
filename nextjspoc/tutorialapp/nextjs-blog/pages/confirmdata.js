import Cookies from 'cookies';
import Head from 'next/head';
import Link from 'next/link';
import formFunctions from '../utils/formfunctions';
import parse from 'urlencoded-body-parser';
import { serialize } from "cookie";
import { useRouter } from 'next/router';
const FORMDATACOOKIENAME = "formdata";



function Home( props ) {
  const router = useRouter();
  const hasData = props.hasData;
  function navToCheckData(e) {
    e.preventDefault();
    router.push("/checkdata");
    return true;
  }

  return (
    <>
      <Head>
        <title>Next App summary page rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        A page that shows the data collected from the user
      </h2>
      
      <div className={(!hasData || props.postcodeerror) ? "nhsuk-error-summary" : "nhsuk-error-summary nhsuk-hidden"} aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
        <h3 className="nhsuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h3>
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
      
      <form action="/checkdata" method="post" className="form" id="checkdata" onSubmit={(e) => { navToCheckData(e) }}>
        <dl className="nhsuk-summary-list">
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Postcode
            </dt>
            <dd className="nhsuk-summary-list__value">
              {props.addresspostcode}
            </dd>
            <dd className="nhsuk-summary-list__actions">
              <Link href="/formx">
                Change
              </Link>
            </dd>
          </div>
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Name
            </dt>
            <dd className="nhsuk-summary-list__value">
              {props.givenname + " " + props.familyname}
            </dd>
            <dd className="nhsuk-summary-list__actions">
              <Link href="/form1">
                Change<span > name</span>
              </Link>
            </dd>
          </div>
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Favourite Colour
            </dt>
            <dd className="nhsuk-summary-list__value">
              {(props.favcolour)? props.favcolour : ""}
            </dd>
            <dd className="nhsuk-summary-list__actions">
              <Link href="/form2">
                Change
              </Link>
            </dd>
          </div>
        </dl>

        <input id="addresspostcode" name="addresspostcode" value={props.addresspostcode} type="hidden" />
        <input id="givenname" name="givenname" value={ props.givenname } type="hidden" />
        <input id="familyname" name="familyname" value={ props.familyname } type="hidden" />
        <input id="favcolour" name="favcolour" value={ props.favcolour } type="hidden" />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Check data
        </button>
      </form>
      <p />
      <Link href="/form1">Back to the start</Link>
    </>
  )
}

Home.getInitialProps = async (ctx) => {
  console.log("in initial props");
  let props = {
    "hasData": true,
    "execlocation": "server",
    "givenname": "",
    "familyname": "",
    "gnerror": false,
    "fnerror": false,
    "favcolour": "",
    "fcerror": false,
    "addresspostcode": "",
    "pcerror": false,
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  else {
    console.log("running on client");
    props["execlocation"] = "client";
    props["addresspostcode"] = formFunctions.getSavedItem('addresspostcode');
    props["givenname"] = formFunctions.getSavedItem('givenname');
    props["familyname"] = formFunctions.getSavedItem('familyname');
    props["favcolour"] = formFunctions.getSavedItem('favcolour');
    props['confirmScreenShown'] = true;
    props = formFunctions.checkData(props);
    formFunctions.saveDataLocally(props);
    return props;
  }
  //check if POST or GET
  const cookies = new Cookies(ctx.req, ctx.res);
  const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
  let formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));
  console.log(JSON.stringify(formdataCookie));
  if (ctx.req.method == "GET") {
    const { givenname, familyname, addresspostcode, favcolour } = formdataCookie;
    props["givenname"] = givenname;
    props["familyname"] = familyname;
    props["addresspostcode"] = addresspostcode;
    props["favcolour"] = favcolour;
  }
  else if (ctx.req.method == "POST")
  {
    //no situation in which this will be triggered - all requests are redirects or client side
    const data = await parse(ctx.req);
    console.log('BODY', data);
    const { givennamehdn, familynamehdn, postcodehdn, favcolourhdn } = data;
    props["givenname"] = givennamehdn;
    props["familyname"] = familynamehdn;
    props["addresspostcode"] = postcodehdn;
    props["favcolour"] = favcolourhdn;
  }
  else {
    //unanticipated method - just return
  }
  formdataCookie['addresspostcode'] = props["addresspostcode"].toUpperCase();
  formdataCookie['givenname'] = props["givenname"];
  formdataCookie['familyname'] = props["familyname"];
  formdataCookie['favcolour'] = props["favcolour"];
  formdataCookie['confirmScreenShown'] = true;
  const cookie = serialize(FORMDATACOOKIENAME, JSON.stringify(formdataCookie), {
    httpOnly: false,
    path: "/",
  });
  ctx.res.setHeader("Set-Cookie", cookie);
  props = formFunctions.checkData(props);
  return props;
}
 export default Home


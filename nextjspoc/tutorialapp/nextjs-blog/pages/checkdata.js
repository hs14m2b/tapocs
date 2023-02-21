import Cookies from 'cookies';
import Head from 'next/head';
import Hiddenform from '../components/hiddenform';
import Link from 'next/link';
import formFunctions from '../utils/formfunctions';
import parse from 'urlencoded-body-parser';
import { serialize } from "cookie";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
const FORMDATACOOKIENAME = "formdata";
const DEFAULTROUTE = "/confirmdata";

function Home(props) {
  const router = useRouter();

  function resetForm() {
      let addresspostcode = document.getElementById('addresspostcode');
      document.getElementById("postcode-error").classList.add("nhsuk-hidden");
      document.getElementById("addresspostcode-form-group").classList.remove("nhsuk-form-group--error");
      addresspostcode.classList.remove("nhsuk-input--error");
  }

  function checkFormXData(e) {
    resetForm();
    e.preventDefault();
    let formdata = {};
    console.log("saving answers in state");
    let addresspostcode = document.getElementById('addresspostcode');
    formdata["addresspostcode"] = addresspostcode.value;
    formFunctions.saveDataLocally(formdata);
    //check if postcode matches regex
    let result = formFunctions.valid_postcode(addresspostcode.value);
    if (!result || addresspostcode.value == null || addresspostcode.value == "")
    {
      document.getElementById("postcode-error").classList.remove("nhsuk-hidden");
      document.getElementById("addresspostcode-form-group").classList.add("nhsuk-form-group--error");
      addresspostcode.classList.add("nhsuk-input--error");
      addresspostcode.value = addresspostcode.value.toUpperCase();      
      result = false;
    }
    if (result) router.push("/confirmdata"); //formFunctions.populateHiddenForm();
    return result;
  }

  return (
    <>
      <Head>
        <title>Next App form rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h1 className="nhsuk-heading-xl">
        A page the invokes an external API to check the supplied data
      </h1>

      <div className={(! props.result) ? "nhsuk-error-summary" : "nhsuk-error-summary nhsuk-hidden"} aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
        <h2 className="nhsuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h2>
        <div className="nhsuk-error-summary__body">
          <p>
            {props.favcolour} is not {props.givenname + " " + props.familyname}'s favourite colour
          </p>
          <ul className="nhsuk-list nhsuk-error-summary__list" role="list">
            <li>
              <Link href="/form2">Please enter {props.givenname + " " + props.familyname}'s favourite colour</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={(props.result) ? "" : "nhsuk-hidden"}>
        <h1 className="nhsuk-heading-xl">
          Yes, {props.favcolour} is {props.givenname + " " + props.familyname}'s favourite colour!
        </h1>
      </div>
      <Link href="/form1">Back to start</Link>

      <Hiddenform></Hiddenform>
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
    "result": false,
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
    //call the API to get the result
    
    let apiResult = await fetch('https://main-nextjsfe.nhsdta.com/extapi/checkfavcolour', { method: "POST", cache: "no-cache", body: new URLSearchParams(props).toString() });
    let apiResultJson = await apiResult.json();
    console.log(JSON.stringify(apiResultJson));
    props['result'] = apiResultJson.result=="true";
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
    const { givenname, familyname, postcode, favcolour } = data;
    props["givenname"] = givenname;
    props["familyname"] = familyname;
    props["addresspostcode"] = postcode;
    props["favcolour"] = favcolour;
  }
  else {
    //unanticipated method - just return
    return props;
  }
  //call the API to get the result
  let apiResult = await fetch('https://main-nextjsfe.nhsdta.com/extapi/checkfavcolour', { method: "POST", cache: "no-cache", body: new URLSearchParams(props).toString() });
  let apiResultJson = await apiResult.json();
  console.log(JSON.stringify(apiResultJson));
  props['result'] = apiResultJson.result=="true";
  return props;
}


export default Home
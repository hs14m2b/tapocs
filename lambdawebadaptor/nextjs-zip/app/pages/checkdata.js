import { ApiError } from 'next/dist/server/api-utils';
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

async function getResult(url, body = {}, apitimeout = 1000) {
  const timeout = apitimeout;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let apiResult = await fetch(url, { method: "POST", cache: "no-cache", body: body, signal: controller.signal });
  clearTimeout(id);
  if (apiResult.status != "200") {
    console.log("response status is " + apiResult.status);
    throw new Error("API response error " + apiResult.status);
  }
  let apiResultJson = await apiResult.json();
  console.log(JSON.stringify(apiResultJson));
  let result = (apiResultJson.result) ? apiResultJson.result == "true" : false;
  return result;
}

async function checkResultLoop() {
  let retrievedResult = formFunctions.getSavedItem("retrievedResult");
  console.log("retrievedResult is " + retrievedResult);
  let loopNo = 1;
  let props = {};
  props["addresspostcode"] = formFunctions.getSavedItem('addresspostcode');
  props["givenname"] = formFunctions.getSavedItem('givenname');
  props["familyname"] = formFunctions.getSavedItem('familyname');
  props["favcolour"] = formFunctions.getSavedItem('favcolour');
  let body = new URLSearchParams(props).toString();
  while (!retrievedResult)
  {
    console.log("in loop number " + loopNo);
    try {
      let result = await getResult("/extapi/checkfavcolour", body, loopNo * 1000);
      retrievedResult = true;
      document.getElementById("checkingMessage").classList.add("nhsuk-hidden");
      if (result) {
        document.getElementById("yesMessage").classList.remove("nhsuk-hidden");
      }
      else
      {
        document.getElementById("noMessage").classList.remove("nhsuk-hidden");
      }
    } catch (error) {
      console.log("caught error - incrementing loop number");
      loopNo++;
      if (loopNo > 10) retrieveResult=true;
    }
  }
}

function Home(props) {
  const router = useRouter();
  useEffect(() => { 
    console.log("in useEffect");
    setTimeout(checkResultLoop, 1000);
  });

  return (
    <>
      <Head>
        <title>Next App form rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        A page the invokes an external API to check the supplied data
      </h2>

      <div id="noMessage" className={(props.retrievedResult && ! props.result) ? "nhsuk-error-summary" : "nhsuk-error-summary nhsuk-hidden"} aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
        <h3 className="nhsuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h3>
        <div className="nhsuk-error-summary__body">
          <p class="nhsuk-u-font-size-32">
            {props.favcolour} is not {props.givenname + " " + props.familyname}'s favourite colour
          </p>
          <ul className="nhsuk-list nhsuk-error-summary__list" role="list">
            <li>
              <Link href="/form2">Please enter {props.givenname + " " + props.familyname}'s favourite colour</Link>
            </li>
          </ul>
        </div>
      </div>
      <div id="yesMessage" className={(props.retrievedResult && props.result) ? "" : "nhsuk-hidden"}>
        <p className="nhsuk-u-font-size-32">
          Yes, {props.favcolour} is {props.givenname + " " + props.familyname}'s favourite colour!
        </p>
      </div>
      <div id="checkingMessage" className={(! props.retrievedResult) ? "" : "nhsuk-hidden"}>
        <p className="nhsuk-u-font-size-32">
          Checking that {props.favcolour} is {props.givenname + " " + props.familyname}'s favourite colour...
          <span class="nhsuk-loader"></span>
        </p>
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
    "retrievedResult": false,
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
    try {
      let apiResult = await getResult("/extapi/checkfavcolour", new URLSearchParams(props).toString(),200);
      props['result'] = apiResult.result == "true";
      props.retrievedResult = true;
    } catch (error) {
      console.log("caught error in calling API");
      props.retrievedResult = false;
    }
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
  let retrievedResult = false;
  let loopNo = 1;
  let body = new URLSearchParams(props).toString();
  props.retrievedResult = false;
  while (!retrievedResult)
  {
    console.log("in loop number " + loopNo);
    try {
      let result = await getResult("https://main-nextjsfe.nhsdta.com/extapi/checkfavcolour", body, loopNo * 1000);
      retrievedResult = true;
      props['result'] = result;
      props.retrievedResult = true;
    } catch (error) {
      console.log("caught error - incrementing loop number");
      loopNo++;
      if (loopNo > 10) retrieveResult=true;
    }
  }
  return props;
}


export default Home
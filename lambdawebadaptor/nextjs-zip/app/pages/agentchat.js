import { ApiError } from 'next/dist/server/api-utils';
import Cookies from 'cookies';
import Head from 'next/head';
import Hiddenform from '../components/hiddenform';
import Spinner from '../components/spinner';
import Link from 'next/link';
import formFunctions from '../utils/formfunctions';
import parse from 'urlencoded-body-parser';
import { serialize } from "cookie";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Spinner1 from '../components/spinner1';
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
  //headers and body
  //body.resourceType == Bundle
  //body.total > 0
  console.log(JSON.stringify(apiResultJson));
  let result = (apiResultJson.body) ? apiResultJson.body : false;
  return result;
}

async function checkResultLoop() {
  let retrievedResult = formFunctions.getSavedItem("retrievedResult");
  console.log("retrievedResult is " + retrievedResult);
  let loopNo = 1;
  let props = {};
  props["addresspostcode"] = formFunctions.getSavedItem('addresspostcode');
  props["nhsnumber"] = formFunctions.getSavedItem('nhsnumber');
  props["favcolour"] = formFunctions.getSavedItem('favcolour');
  let body = new URLSearchParams(props).toString();
  while (!retrievedResult)
  {
    console.log("in loop number " + loopNo);
    try {
      let result = await getResult("/extapi/getappointments", body, loopNo * 1000);
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
    //setTimeout(checkResultLoop, 1000);
  });

  let aiAgentInput;
  let messageUUID = "";
  async function submitMessage(props) {
    let message = document.getElementById("message").value;
    if (message.trim().length == 0) {
      alert("Please enter a message");
      return;
    }
    //enable the spinner
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    const timeout = 60000;
    const controller = new AbortController();
    const id = setTimeout(() => {controller.abort(); document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");}, timeout);
    const url = "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/sendaiagentmessage";
    let bodyJson = { "message": message };
    if (aiAgentInput && aiAgentInput.sessionId) {
      bodyJson["sessionId"] = aiAgentInput.sessionId;
    }
    if (aiAgentInput && aiAgentInput.sessionState) {
      bodyJson["sessionState"] = JSON.stringify(aiAgentInput.sessionState);
    }
    let body = new URLSearchParams(bodyJson).toString();
    let apiResult = await fetch(url, { method: "POST", cache: "no-cache", body: body, signal: controller.signal });
    //document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");
    clearTimeout(id);
    if (apiResult.status != "200") {
      console.log("response status is " + apiResult.status);
      document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");
      throw new Error("API response error " + apiResult.status);
    }
    let apiResultJson = await apiResult.json();
    aiAgentInput = (apiResultJson.aiInput) ? apiResultJson.aiInput : aiAgentInput;
    console.log(JSON.stringify(apiResultJson));
    document.getElementById("message").value = (apiResultJson.aiResponse) ? apiResultJson.aiResponse : apiResultJson.messageUUID + " uuid to check for response";
    messageUUID = (apiResultJson.messageUUID) ? apiResultJson.messageUUID : messageUUID;
    if (apiResultJson.aiResponse) 
    {
      //we have a direct response - hide the spinner
      document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");
    }
    else
    {
      //no direct response - keep the spinner and check for a response every second
      setTimeout(async () => {await checkResponse(props)}, 1000);
      setTimeout( () => document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden"), 60000);

    }
  }
  async function checkResponse(props) {
    //enable the spinner
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    const timeout = 60000;
    const controller = new AbortController();
    const id = setTimeout(() => {controller.abort(); document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");}, timeout);
    const url = "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/checkaiagentresponse";
    let bodyJson = { "messageuuid": messageUUID };
    let body = new URLSearchParams(bodyJson).toString();
    let apiResult = await fetch(url, { method: "POST", cache: "no-cache", body: body, signal: controller.signal });
    clearTimeout(id);
    if (apiResult.status != "200") {
      console.log("response status is " + apiResult.status);
      document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");
      throw new Error("API response error " + apiResult.status);
    }
    let apiResultJson;
    try {
      apiResultJson = await apiResult.json();
      console.log(JSON.stringify(apiResultJson));
      document.getElementById("message").value = (apiResultJson.aiResponse) ? apiResultJson.aiResponse : apiResultJson.messageUUID + " is still the uuid to check for response";
      messageUUID = (apiResultJson.messageUUID) ? apiResultJson.messageUUID : messageUUID;
      if (apiResultJson.aiInput) document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");
    } catch (error) {
      console.log("Error parsing API response:", error);
      setTimeout(async () => {await checkResponse(props)}, 2000);
    }
  }

  return (
    <>
      <Head>
        <title>BaRS Demonstrator UI rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        This page initiates a chat with an Amazon Bedrock AI agent to undertake appointment management functions
      </h2>


      <div id="yesMessage">

        <dl class="nhsuk-summary-list">

          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Enter Chat Here
            </dt>
            <dd class="nhsuk-summary-list__value">
              <textarea class="nhsuk-textarea" id="message" name="message" rows="5" aria-describedby="message-hint"></textarea>
            </dd>

          </div>

          <div class="nhsuk-summary-list__row">
          <dt class="nhsuk-summary-list__key">
            Submit Message
          </dt>
          <dd class="nhsuk-summary-list__value">

          <button className="nhsuk-button" data-module="nhsuk-button" type="submit" onClick={async ()=>{await submitMessage(props)}}>
            Submit Message
          </button>
          </dd>
          </div>

          <div class="nhsuk-summary-list__row">
          <dt class="nhsuk-summary-list__key">
            Check For AI Response
          </dt>
          <dd class="nhsuk-summary-list__value">

          <button className="nhsuk-button" data-module="nhsuk-button" type="submit" onClick={async ()=>{await checkResponse(props)}}>
            Check For AI Response
          </button>
          </dd>
          </div>

        </dl>
      </div>

      <Link href="/form1">Back to start</Link>
      <Spinner message="Invoking AI Agent, please wait"></Spinner>
      <Spinner1 message="Cancelling Appointment" id="pageTransitionMessagecancelappointment"></Spinner1>
      <Hiddenform></Hiddenform>
    </>
  )
}

Home.getInitialProps = async (ctx) => {
  console.log("in initial props");
  let props = {
    "hasData": true,
    "execlocation": "server",
    "nhsnumber": "",
    "gnerror": false,
    "fnerror": false,
    "favcolour": "",
    "fcerror": false,
    "addresspostcode": "",
    "pcerror": false,
    "result": false,
    "retrievedResult": false,
    ...ctx.query
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
    console.log(JSON.stringify(ctx.query));
  }
  else {
    console.log("running on client");
    props["execlocation"] = "client";
    props["nhsnumber"] = formFunctions.getSavedItem('nhsnumber');
    console.log("I am here");
    //call the API to get the result
    formFunctions.saveDataLocally(props);
    return props;
  }
  //check if POST or GET
  const cookies = new Cookies(ctx.req, ctx.res);
  const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
  let formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));
  console.log(JSON.stringify(formdataCookie));
  if (ctx.req.method == "GET") {
    const { nhsnumber } = formdataCookie;
    props["nhsnumber"] = nhsnumber;
  }
  else if (ctx.req.method == "POST")
  {
    //no situation in which this will be triggered - all requests are redirects or client side
    const data = await parse(ctx.req);
    console.log('BODY', data);
    const { nhsnumber } = data;
    props["nhsnumber"] = nhsnumber;
  }
  else {
    //unanticipated method - just return
    return props;
  }
  return props;
}


export default Home
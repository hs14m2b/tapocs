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
import { redirect } from 'next/navigation'
const FORMDATACOOKIENAME = "formdata";
const DEFAULTROUTE = "/confirmdata";

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function getResult(url, body = {}, apitimeout = 1000) {
  const timeout = apitimeout;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let apiResult = await fetch(url, { method: "POST", cache: "no-cache", body: (new URLSearchParams(body)).toString(), signal: controller.signal });
  clearTimeout(id);
  if (apiResult.status != "200") {
    console.log("response status is " + apiResult.status);
    throw new Error("API response error " + apiResult.status);
  }
  try {
    let apiResultJson = await apiResult.json();
    //headers and body
    //body.resourceType == Bundle
    //body.total > 0
    //console.log(JSON.stringify(apiResultJson));
    //let result = (apiResultJson.body) ? apiResultJson.body : false;
    return apiResultJson;
  } catch (error) {
    console.log("error parsing API response");
    console.log(error.message);
    return {};
  }
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
  console.log("in Home in agentchat2 - props are " + JSON.stringify(props, null, 2));
  let pageProps = { ...props };
  if (!pageProps.message) pageProps["message"] = "";
  if (!pageProps.sessionId) pageProps["sessionId"] = "";
  if (!pageProps.sessionState) pageProps["sessionState"] = "";
  const router = useRouter();
  useEffect(() => { 
    console.log("in useEffect");
    document.getElementById("pageTransitionMessage").classList.add("nhsuk-hidden");
    document.getElementById("message").focus();
    document.getElementById("message").value = pageProps.message;
    document.getElementById("sessionId").value = pageProps.sessionId;
    document.getElementById("sessionState").value = pageProps.sessionState;
    //setTimeout(checkResultLoop, 1000);
  });

  function resetForm() {}

  function checkAgentChatData(e) {
    resetForm();
    let message = document.getElementById("message").value;
    if (message.trim().length == 0) {
      alert("Please enter a message");
      e.preventDefault();
      return false;
    }
    //enable the spinner
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    return true;
  }

  function checkAgentChatData2(e) {
    resetForm();
    e.preventDefault();
    let message = document.getElementById("message").value;
    if (message.trim().length == 0) {
      alert("Please enter a message");
      return;
    }
    //enable the spinner
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    let formdata = {};
    console.log("saving answers in state");
    let sessionState = document.getElementById('sessionState');
    let sessionId = document.getElementById('sessionId');
    //check if populated
    if (sessionState.value && sessionState.value !== "") {
      formdata["sessionState"] = sessionState.value;
    }
    else {
      formdata["sessionState"] = ""; //set to default value
    }
    if (sessionId.value && sessionId.value !== "") {
      formdata["sessionId"] = sessionId.value;
    }
    else {
      formdata["sessionId"] = ""; //set to default value
    }
    formdata["message"] = message;
    formFunctions.saveDataLocally(formdata);
    router.push("/agentchat2");
    return true;
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
          <form action="/agentchat2" method="POST" className="form" id="favcolourform" >

          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Enter Chat Here
            </dt>
            <dd class="nhsuk-summary-list__value">
              <textarea class="nhsuk-textarea" id="message" name="message" rows="5" aria-describedby="message-hint" >{ pageProps.message }</textarea>
            </dd>

          </div>

          <div class="nhsuk-summary-list__row">
          <dt class="nhsuk-summary-list__key">
            Submit Message
          </dt>
          <dd class="nhsuk-summary-list__value">

          <button className="nhsuk-button" data-module="nhsuk-button" type="submit" onClick={(e) => { return checkAgentChatData(e); }}>
            Submit Message
          </button>
          </dd>
          </div>

          <input id="sessionId" name="sessionId" type="hidden" default={pageProps.sessionId} />
          <input id="sessionState" name="sessionState" type="hidden" default={pageProps.sessionState} />
          </form>

        </dl>
      </div>

      <Link href="/form1">Back to start</Link>
      <Spinner message="Invoking AI Agent, please wait"></Spinner>
      <Spinner1 message="Cancelling Appointment" id="pageTransitionMessagecancelappointment"></Spinner1>
      <Hiddenform></Hiddenform>
    </>
  )
}

//Home.getInitialProps = async (ctx) => {
//not using getServerSideProps as the risk of exceeding the 29 second API Gateway limit is too high. 
//It will need a breakout to client side code to check for completion
export const getServerSideProps = async (ctx) => {
  console.log("in getServerSideProps in agentchat2");
  let props = {
    "hasData": true,
    "execlocation": "server",
    "nhsnumber": "",
    "result": false,
    "retrievedResult": false,
    ...ctx.query
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
    console.log(JSON.stringify(ctx.query));
    const cookies = new Cookies(ctx.req, ctx.res);
    const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
    while (formdataCookieRaw !== null && typeof formdataCookieRaw == "string" && formdataCookieRaw.startsWith("%")) {
      console.log("formdataCookieRaw is " + formdataCookieRaw);
      try {
        formdataCookieRaw = decodeURIComponent(formdataCookieRaw);
      } catch (error) {
        console.error("Error decoding formdataCookieRaw:", error);
        break;
      }
    }
    console.log("formdataCookieRaw is " + formdataCookieRaw);
    let formdataCookie = {};
    try {
      formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined" || formdataCookieRaw=="") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));      
    } catch (error) {
      console.error("Error parsing formdataCookie:", error);
    }
    console.log(JSON.stringify(formdataCookie));
    let body = {};
    if (ctx.req.method == "GET") {
      body = {...((ctx.query)? ctx.query : {})};
    }
    if (ctx.req.method == "POST") {
      body = { ...(await parse(ctx.req)), ...((ctx.query)? ctx.query : {}) };
    }
    if (body.sessionId && (body.sessionId.trim() == "" || body.sessionId.trim() == "undefined")) delete body.sessionId;
    if (body.sessionState && (body.sessionState.trim() == "" || body.sessionState.trim() == "undefined")) delete body.sessionState;
    if (body.messageuuid && (body.messageuuid.trim() == "")) delete body.messageuuid;
    console.log("body is " + JSON.stringify(body));
    if (ctx.req.method != "POST" && ctx.req.method != "GET") {
      //unanticipated method - just return
      return props;
    }
    const { message, sessionId, sessionState, identity_token, messageuuid } = body;
    props["message"] = (message && message.trim() !== "") ? message : "";
    props["sessionId"] = (sessionId && sessionId.trim() !== "" && sessionId.trim() !== "undefined") ? sessionId : "";
    props["sessionState"] = (sessionState && sessionState.trim() !== "" && sessionState.trim() !== "undefined") ? sessionState : "";
    //messageuuid is only sent in to continue checking for a response
    props["messageuuid"] = (messageuuid && messageuuid.trim() !== "") ? messageuuid : "";
    if (identity_token && identity_token.trim() !== "") 
    {
      props["identity_token"] = identity_token;
    }
    else {
      //populate identity_token from cookie if not in body
      if (formdataCookie.identity_token && formdataCookie.identity_token.trim() !== "") {
        props["identity_token"] = formdataCookie.identity_token;
      }
    }
    //save the data in a cookie
    let cookieData = { ...formdataCookie, ...body };
    console.log("cookieData is " + JSON.stringify(cookieData));
    ctx.res.setHeader("Set-Cookie", serialize(FORMDATACOOKIENAME, JSON.stringify(cookieData), { path: '/' }));
  }
  else {
    console.log("running on client");
    props["execlocation"] = "client";
    props["nhsnumber"] = formFunctions.getSavedItem('nhsnumber');
    props["message"] = formFunctions.getSavedItem('message');
    props["sessionId"] = formFunctions.getSavedItem('sessionId');
    props["sessionState"] = formFunctions.getSavedItem('sessionState');
    props["identity_token"] = formFunctions.getSavedItem('identity_token');
    console.log("I am here on client");
  }
  //check if POST or GET
  //send the data into the AI Agent
  try {
    let aiAgentInput;
    let messageUUID = "";
    let message = props["message"];
    if ((message && message.trim() !== "") || (props["messageuuid"] && props["messageuuid"].trim() !== "")) {
      if (props["messageuuid"] && props["messageuuid"].trim() !== "") {
        //we are checking for a response to an earlier message
        messageUUID = props["messageuuid"];
      }
      else {
        //new message - send it to the AI Agent
        messageUUID = "";
        let sessionId = props["sessionId"];
        let sessionState = props["sessionState"];
        const url = "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/sendaiagentmessage";
        let bodyJson = { "message": message };
        if (sessionId && sessionId.trim() !== "") {
          bodyJson["sessionId"] = sessionId;
        }
        if (sessionState && sessionState.trim() !== "") {
          bodyJson["sessionState"] = sessionState;
        }
        if (props["identity_token"] && props["identity_token"].trim() !== "") {
          bodyJson["identity_token"] = props["identity_token"];
        }
        console.log("bodyJson is " + JSON.stringify(bodyJson));
        let aiResponse = await getResult(url, bodyJson, 25000);
        console.log(JSON.stringify(aiResponse));
        aiAgentInput = (aiResponse.aiInput) ? aiResponse.aiInput : aiAgentInput;
        messageUUID = (aiResponse.messageUUID) ? aiResponse.messageUUID : messageUUID;
        if (aiResponse.aiResponse) 
        {
          //we have a direct response
          props["message"] = aiResponse.aiResponse;
          if (aiAgentInput && aiAgentInput.sessionId) {
            props["sessionId"] = aiAgentInput.sessionId;
          }
          if (aiAgentInput && aiAgentInput.sessionState) {
            props["sessionState"] = JSON.stringify(aiAgentInput.sessionState);
          }
        }
      }
      //no direct response - keep the spinner and check for a response every two seconds
      const url2 = "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/checkaiagentresponse";
      let loopNo = 1;
      console.log("in loop to check for response");
      while(true) {
        await sleep(2000);
        let response = await getResult(url2, { "messageuuid": messageUUID }, 25000);
        console.log(JSON.stringify(response));
        if (response.aiResponse) {
          props["message"] = response.aiResponse;
          if (response.aiInput && response.aiInput.sessionId) {
            props["sessionId"] = response.aiInput.sessionId;
          }
          if (response.aiInput && response.aiInput.sessionState) {
            props["sessionState"] = JSON.stringify(response.aiInput.sessionState);
          }
          break;
        }
        loopNo++;
        if (loopNo > 5) 
        {
          props["location"] = "/agentchat2?messageuuid=" + messageUUID;
          break;
        }
      }
    }
    else {
      props["message"] = "Please enter a message to send to the AI Agent";
      props["sessionId"] = "";
      props["sessionState"] = "";
    }
  }
  catch (error) {
    console.log("caught error - incrementing loop number");
    console.log(error);
  }
  if (props.location && props.location !== "") {
    // Server-side redirect
    console.log("redirecting to " + props.location);
    return {"redirect": { destination: props.location, permanent: false }};
  }
  console.log("returning props " + JSON.stringify(props, null, 2 ));
  return {"props": props};
}


export default Home
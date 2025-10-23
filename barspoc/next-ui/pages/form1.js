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

function Home( props ) {
  const router = useRouter();

  function resetForm() {
      let nhsnumber = document.getElementById('nhsnumber');
      document.getElementById("nhsnumber-error").classList.add("nhsuk-hidden");
      document.getElementById("nhsnumber-form-group").classList.remove("nhsuk-form-group--error");
      nhsnumber.classList.remove("nhsuk-input--error");
  }

  function checkForm1Data(e) {
    //nhsuk-form-group--error
    //nhsuk-input--error
    console.log("about to debug");
    console.log(e);
    console.log(e.nativeEvent.submitter.name);
    console.log(e.nativeEvent.submitter.value);
    //retrieve the action
    let action = e.nativeEvent.submitter.value;
    resetForm();
    e.preventDefault();
    let formdata = {};
    console.log("saving answers in state");
    let nhsnumber = document.getElementById('nhsnumber');
    console.log(nhsnumber.value);
    //check if populated
    if (nhsnumber.value && nhsnumber.value !== "") {
      formdata["nhsnumber"] = nhsnumber.value;
    }
    else {
      formdata["nhsnumber"] = "9661034524"; //set to default value
    }
    formFunctions.saveDataLocally(formdata);
    //check if both populated
    let result = true;
    let formCheck = formFunctions.checkData(formdata);
    if (formCheck.gnerror)
    {
        document.getElementById("nhsnumber-error").classList.remove("nhsuk-hidden");
        document.getElementById("nhsnumber-form-group").classList.add("nhsuk-form-group--error");
        nhsnumber.classList.add("nhsuk-input--error");
        result = false;
    }
    if (result)
    {
      //enable the spinner
      document.getElementById("pageTransitionMessage" + action).classList.remove("nhsuk-hidden");
      let confirmScreenShown = formFunctions.confirmScreenShown();
      if (confirmScreenShown && confirmScreenShown != "")
      {
        console.log("sending to confirm screen");
        //router.push("/confirmdata");
        router.push("/"+action);
        //formFunctions.populateHiddenForm();
      }
      else {
        router.push("/"+action);
      }
    }
    return false;
  }

  return (
    <>
      <Head>
        <title>BaRS Demonstrator UI rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <form action="/form1" method="post" className="form" id="nameform" noValidate onSubmit={(e) => { checkForm1Data(e); return false;  }}>

        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--l">
            <h1 className="nhsuk-fieldset__heading">
              What is your NHS Number?
            </h1>
          </legend>

          <div className="nhsuk-form-group" id="nhsnumber-form-group">
            <label className="nhsuk-label" htmlFor="nhsnumber">
              What is your NHS Number?
            </label>
            <span className={(props.gnerror)? "nhsuk-error-message": "nhsuk-hidden nhsuk-error-message"} id="nhsnumber-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Enter your NHS Number
            </span>
            <input className="nhsuk-input" id="nhsnumber" name="nhsnumber" type="text" minLength="10"  defaultValue={ props.nhsnumber } placeholder="9661034524"/>
          </div>
        </fieldset>
        <input className="nhsuk-hidden" type="hidden" id="nextpage" name="nextpage" value="/getappointments" />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit" name="action" value="getappointments">
          Find Appointments
        </button>
        <br />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit" name="action" value="gettasks">
          Find Outstanding Tasks
        </button>
        <br />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit" name="action" value="createservicerequest">
          Create Service Request
        </button>
        <br />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit" name="action" value="agentchat2">
          Start AI Agent Chat
        </button>
      </form>
      <br />
      <a href="https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/oidcrequest" className="nhsuk-link">
      <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Continue to NHS login
      </button>
      </a>
      <br />
      <Spinner1 message="Finding your appointments" id="pageTransitionMessagegetappointments"></Spinner1>
      <Spinner1 message="Finding your service requests" id="pageTransitionMessagegetservicerequests"></Spinner1>
      <Spinner1 message="Finding your outstanding tasks" id="pageTransitionMessagegettasks"></Spinner1>
      <Spinner1 message="Creating new referral/service request" id="pageTransitionMessagecreateservicerequest"></Spinner1>
      <Spinner1 message="Launching AI Agent Chat" id="pageTransitionMessageagentchat2"></Spinner1>

      <Hiddenform></Hiddenform>
    </>
  )
}

Home.getInitialProps = async (ctx) => {
  console.log("in initial props in form1");
  let props = {
    "execlocation": "server",
    "nhsnumber": "",
    "gnerror": false,
    "fnerror": false
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  else {
    props["execlocation"] = "client";
    props["nhsnumber"] = formFunctions.getSavedItem('nhsnumber');
    if (ctx.query){
      let { nhsnumber } = ctx.query;
      if (nhsnumber) {
        props["nhsnumber"] = nhsnumber;
      }
    }
    return props;
  }
  //check if POST or GET
  const cookies = new Cookies(ctx.req, ctx.res);
  const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
  console.log(formdataCookieRaw);
  let formdataCookie = {};
  try {
    formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined" || formdataCookieRaw=="") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));
  } catch (error) {
    console.error("Error parsing formdataCookie:", error);
  }
  console.log(JSON.stringify(formdataCookie));
  if (ctx.req.method == "GET") {
    const { nhsnumber } = formdataCookie;
    props["nhsnumber"] = nhsnumber;
    if (ctx.query){
      let nhsnumber2 = ctx.query.nhsnumber;
      if (nhsnumber2) {
        props["nhsnumber"] = nhsnumber2;
      }
    }
    return props;
  }
  if (ctx.req.method == "POST")
  {
    const data = await parse(ctx.req);
    console.log('BODY', data);
    const { nhsnumber, nextpage } = data;
    props["nhsnumber"] = nhsnumber;
    if (ctx.query){
      let nhsnumber2 = ctx.query.nhsnumber;
      if (nhsnumber2) {
        props["nhsnumber"] = nhsnumber2;
      }
    }
    props = formFunctions.checkData(props);
    if (props.fnerror || props.gnerror) return props;
    //no error in the form data. Add it to a response cookie
    for (let key in data) {
      //if (body.hasOwnProperty(key)) {
        console.log("adding " + key + " -> " + data[key] + " to cookie");
        formdataCookie[key] = data[key];
      //}
    }
    console.log("cookie is now " + JSON.stringify(formdataCookie));
    const cookie = serialize(FORMDATACOOKIENAME, JSON.stringify(formdataCookie), {
      httpOnly: false,
      path: "/",
    });
    //ctx.res.setHeader("Set-Cookie", cookie);
    console.log("have set cookie header");
    let confirmScreenShown = (formdataCookie.confirmScreenShown) ? true : false;
    console.log("has confirm screen been shown yet? " + confirmScreenShown);
    if (confirmScreenShown) {
      console.log("confirm screen has been shown - sending user back to confirm screen");
      ctx.res.setHeader("Location", DEFAULTROUTE);
      ctx.res.statusCode=302;
    }
    else
    {
      ctx.res.setHeader("Location", nextpage);
      ctx.res.statusCode=302;
    }
    return props;
  }
  else {
    //unanticipated method - just return
    return props;
  }
}

export default Home
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
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    setTimeout(gotoAppointment, 1000);
  });

  const staticProps = props;

  function gotoAppointment() {
    console.log("here");
    let barsidentifier=staticProps.barsidentifier;
    let barsserviceid=staticProps.barsserviceid;
    router.push("/getappointment?barsidentifier=" + barsidentifier + "&barsserviceid=" + barsserviceid);
  }

  function checkData(props) {
    //enable the spinner
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    let barsidentifier=props.barsidentifier
    let barsserviceid=props.barsserviceid
    let healthcareServiceId=props.barsResponse.participant.find((participant) => participant.actor.type == "HealthcareService").actor.reference
    let appointmentId=props.barsResponse.id
    let appointmentb64=encodeURIComponent(Buffer.from(JSON.stringify(props.barsResponse)).toString('base64'))
    router.push("/getslots?barsidentifier=" + barsidentifier + "&barsserviceid=" + barsserviceid + "&healthcareServiceId=" + healthcareServiceId + "&appointmentId=" + appointmentId + "&appointmentb64=" + appointmentb64);
  }

  return (
    <>
      <Head>
        <title>BaRS Demonstrator UI rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        This page invokes the BaRS API to retrieve a single specified appointment for a patient
      </h2>

      <div id="noMessage" className={(props.retrievedResult && ! props.result) ? "nhsuk-error-summary" : "nhsuk-error-summary nhsuk-hidden"} aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
        <h3 className="nhsuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h3>
        <div className="nhsuk-error-summary__body">
          <p class="nhsuk-u-font-size-32">
            Unable to retrieve appointment {props.barsidentifier} for patient {props.nhsnumber}
          </p>
          <ul className="nhsuk-list nhsuk-error-summary__list" role="list">
            <li>
              <Link href="/form1">Please re-enter the NHS Number</Link>
            </li>
          </ul>
        </div>
      </div>
      <div id="yesMessage" className={(props.retrievedResult && props.result) ? "" : "nhsuk-hidden"}>
        <p className="nhsuk-u-font-size-32">
          Yes, rescheduled appointment details for {props.nhsnumber}!
        </p>

        <dl class="nhsuk-summary-list">

          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Appointment Id
            </dt>
            <dd class="nhsuk-summary-list__value">
              {props.barsResponse.id}
            </dd>

          </div>

          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Date / Time of appointment
            </dt>
            <dd class="nhsuk-summary-list__value">
              { new Date(props.barsResponse.start).toLocaleDateString() } at { new Date(props.barsResponse.start).toLocaleTimeString() }
            </dd>
          </div>

          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Appointment status
            </dt>
            <dd class="nhsuk-summary-list__value">
              {props.barsResponse.extension.find((extension) => extension.url == "https://fhir.nhs.uk/StructureDefinition/Extension-Appointment-Status").valueCoding.code}
            </dd>
          </div>

          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Appointment Location
            </dt>
            <dd class="nhsuk-summary-list__value">
              {props.barsResponse.participant.find((participant) => participant.actor.type == "Location").actor.display}
            </dd>

          </div>

          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Manage this appointment
            </dt>
            <dd class="nhsuk-summary-list__value">
              <a href={`${props.barsResponse.extension.find((extension) => extension.url == "https://fhir.nhs.uk/StructureDefinition/Extension-Portal-Link").valueUrl}`}>Launch Patient Portal</a>
            </dd>
          </div>

          { props.barsResponse.patientInstruction ? 
          <div class="nhsuk-summary-list__row">
            <dt class="nhsuk-summary-list__key">
              Patient Instructions
            </dt>
            <dd class="nhsuk-summary-list__value">
              {props.barsResponse.patientInstruction}
            </dd>
          </div> : null}


          { (new Date(props.barsResponse.start) > new Date()) ? 
          <div class="nhsuk-summary-list__row">
          <dt class="nhsuk-summary-list__key">
            Reschedule Appointment
          </dt>
          <dd class="nhsuk-summary-list__value">
          <button className="nhsuk-button" data-module="nhsuk-button" type="submit" onClick={()=>{checkData(props)}}>
            Reschedule Appointment
          </button>
          </dd>
        </div> : "BLAHHHHHH"}

        </dl>

      </div>
      <div id="checkingMessage" className={(! props.retrievedResult) ? "" : "nhsuk-hidden"}>
        <p className="nhsuk-u-font-size-32">
          Checking for appointments for {props.nhsnumber}...
          <span class="nhsuk-loader"></span>
        </p>
      </div>
      <Link href="/form1">Back to start</Link>
      <Spinner message="Retrieving Updated Appointment Details"></Spinner>

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
    props["addresspostcode"] = formFunctions.getSavedItem('addresspostcode');
    props["nhsnumber"] = formFunctions.getSavedItem('nhsnumber');
    props["favcolour"] = formFunctions.getSavedItem('favcolour');
    props['confirmScreenShown'] = true;
    let { barsidentifier, barsserviceid } = ctx.query;
    props['barsidentifier'] = barsidentifier;
    props = formFunctions.checkData(props);
    console.log(JSON.stringify(ctx.query));
    console.log("I am here");
    //call the API to get the result
    try {
      let apiResult = await getResult("https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/rescheduleappointment", new URLSearchParams(ctx.query).toString(),29000);
      props['result'] = (apiResult) ? true: false;
      props.retrievedResult = true;
      props['barsResponse'] = apiResult;
    } catch (error) {
      console.log("caught error in calling API xxxx");
      props.retrievedResult = true;
      props['result'] = false;
      props['barsResponse'] = {"entry": []};
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
    const { nhsnumber, addresspostcode, favcolour } = formdataCookie;
    props["nhsnumber"] = nhsnumber;
    props["addresspostcode"] = addresspostcode;
    props["favcolour"] = favcolour;
  }
  else if (ctx.req.method == "POST")
  {
    //no situation in which this will be triggered - all requests are redirects or client side
    const data = await parse(ctx.req);
    console.log('BODY', data);
    const { nhsnumber, postcode, favcolour } = data;
    props["nhsnumber"] = nhsnumber;
    props["addresspostcode"] = postcode;
    props["favcolour"] = favcolour;
  }
  else {
    //unanticipated method - just return
    return props;
  }
  let { barsidentifier, barsserviceid } = ctx.query;
  props['barsidentifier'] = barsidentifier;
//call the API to get the result
  let retrievedResult = false;
  let loopNo = 1;
  props.retrievedResult = false;
  while (!retrievedResult)
  {
    console.log("in loop number " + loopNo);
    try {
      let apiResult = await getResult("https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/rescheduleappointment", new URLSearchParams(ctx.query).toString(), 20000 + (loopNo * 1000));
      retrievedResult = true;
      props['result'] = (apiResult) ? true: false;
      props.retrievedResult = true;
      props['barsResponse'] = apiResult;
    } catch (error) {
      console.log("caught error - incrementing loop number");
      loopNo++;
      if (loopNo > 10) {
        retrievedResult=true;
        props.retrievedResult = true;
        props['result'] = false;
        props['barsResponse'] = {"entry": []};
      }
    }
  }
  return props;
}


export default Home
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

function Home(props) {
  const router = useRouter();
  useEffect(() => { 
    console.log("in useEffect");
    //setTimeout(checkResultLoop, 1000);
  });

  function checkData(propsandslot) {
    //enable the spinner
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    let slotb64=encodeURIComponent(Buffer.from(JSON.stringify(propsandslot.slot.resource)).toString('base64'));
    let servicerequestb64=encodeURIComponent(propsandslot.props.servicerequestb64);
    let barsidentifier=propsandslot.props.barsidentifier;
    let barsserviceid=propsandslot.props.barsserviceid;
    router.push("/booknewappointment?barsidentifier=" + barsidentifier + 
      "&barsserviceid=" + barsserviceid + 
      "&servicerequestId=" + servicerequestId + 
      "&servicerequestb64=" + servicerequestb64 +
      "&slotb64=" + slotb64);
  }

  return (
    <>
      <Head>
        <title>BaRS Demonstrator UI rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        This page invokes the BaRS API to retrieve slots for a given service to allow a new appointment to be created for a Service Request
      </h2>

      <div id="noMessage" className={(props.retrievedResult && ! props.result) ? "nhsuk-error-summary" : "nhsuk-error-summary nhsuk-hidden"} aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
        <h3 className="nhsuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h3>
        <div className="nhsuk-error-summary__body">
          <p class="nhsuk-u-font-size-32">
            Unable to find any slots for Healthcare Service {props.healthcareServiceId} and BaRS Service ID {props.barsserviceid}
          </p>
          <ul className="nhsuk-list nhsuk-error-summary__list" role="list">
            <li>
              <Link href="/form1">Please re-enter the NHS Number</Link>
            </li>
          </ul>
        </div>
      </div>
      {(props.retrievedResult && props.result) ?
      <div id="yesMessage" className={(props.retrievedResult && props.result) ? "" : "nhsuk-hidden"}>
        <p className="nhsuk-u-font-size-32">
          Yes, retrieved slots for Healthcare Service {props.healthcareServiceId} and BaRS Service ID {props.barsserviceid}
        </p>
        <table class="nhsuk-table">
          <caption class="nhsuk-table__caption">Available Appointment Slots</caption>
          <thead role="rowgroup" class="nhsuk-table__head">
            <tr role="row">
              <th role="columnheader" class="" scope="col">
                Slot ID
              </th>
              <th role="columnheader" class=" nhsuk-table__header--numeric" scope="col">
                Slot Date
              </th>
              <th role="columnheader" class=" nhsuk-table__header--numeric" scope="col">
                Appointment Type
              </th>
              <th role="columnheader" class=" nhsuk-table__header--numeric" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="nhsuk-table__body">
            {(props.barsResponse.entry.length > 0) && props.barsResponse.entry.map((slot) => (
              <tr role="row" class="nhsuk-table__row">
              <th class="nhsuk-table__header" scope="row">{slot.resource.id}</th>
              <td class="nhsuk-table__cell">{ new Date(slot.resource.start).toLocaleDateString() } at { new Date(slot.resource.start).toLocaleTimeString() }</td>
              <td class="nhsuk-table__cell nhsuk-table__cell--numeric">{slot.resource.appointmentType.coding[0].display}</td>
              <td class="nhsuk-table__cell">
              <button className="nhsuk-button" data-module="nhsuk-button" type="submit" onClick={()=>{checkData({ "props": props, "slot": slot })}}>
                Book this Slot
              </button>
              </td>
            </tr>
            ))}
          </tbody>
        </table>

      </div>
      : ""}
      <div id="checkingMessage" className={(! props.retrievedResult) ? "" : "nhsuk-hidden"}>
        <p className="nhsuk-u-font-size-32">
          Checking for appointments for {props.nhsnumber}...
          <span class="nhsuk-loader"></span>
        </p>
      </div>
      <Link href="/form1">Back to start</Link>
      <Spinner message="Booking Appointment..."></Spinner>

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
  // ctx.query has {barsidentifier, barsserviceid, healthcareServiceId, servicerequestId, servicerequestb64} where barsidentifier is for ServiceRequest
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
    props = formFunctions.checkData(props);
    console.log(JSON.stringify(ctx.query));
    //call the API to get the result
    try {
      let apiResult = await getResult("https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/getslots", new URLSearchParams(props).toString(),20000);
      props.retrievedResult = true;
      props['barsResponse'] = apiResult;
      props['result'] = (apiResult.resourceType == "Bundle") ? true : false;
      console.log("result is " + props.result);
      if (!props.result) {
        //set barsResponse to a default value
        props['barsResponse'] = {"type": "Bundle", "entry": []};
        console.log("setting default value for the query");
      }
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
  //call the API to get the result
  let retrievedResult = false;
  let loopNo = 1;
  let body = new URLSearchParams(props).toString();
  props.retrievedResult = false;
  while (!retrievedResult)
  {
    console.log("in loop number " + loopNo);
    try {
      let apiResult = await getResult("https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/getslots", new URLSearchParams(props).toString(),20000);
      retrievedResult = true;
      props.retrievedResult = true;
      props['barsResponse'] = apiResult;
      props['result'] = (apiResult.resourceType == "Bundle") ? true : false;
      console.log("result is " + props.result);
      if (!props.result) {
        //set barsResponse to a default value
        props['barsResponse'] = {"type": "Bundle", "entry": []};
        console.log("setting default value for the query");
      }
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
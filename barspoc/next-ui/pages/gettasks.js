import { ApiError } from 'next/dist/server/api-utils';
import Cookies from 'cookies';
import Head from 'next/head';
import Hiddenform from '../components/hiddenform';
import Link from 'next/link';
import Spinner from '../components/spinner';
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
    //setTimeout(checkResultLoop, 1000);
  });

  function checkData(task) {
    console.log("here");
    console.log(JSON.stringify(task));
    //enable the spinner
    document.getElementById("pageTransitionMessage").classList.remove("nhsuk-hidden");
    let barsidentifier=task.focus.reference
    let barsserviceid=task.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/dos-service-id").value
    router.push("/getservicerequest?barsidentifier=" + barsidentifier + "&barsserviceid=" + barsserviceid);
  }
  
  return (
    <>
      <Head>
        <title>BaRS Demonstrator UI rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        This page invokes the PDM API to retrieve the tasks for a patient
      </h2>

      <div id="noMessage" className={(props.retrievedResult && ! props.result) ? "nhsuk-error-summary" : "nhsuk-error-summary nhsuk-hidden"} aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
        <h3 className="nhsuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h3>
        <div className="nhsuk-error-summary__body">
          <p class="nhsuk-u-font-size-32">
            Unable to retrieve tasks for patient {props.nhsnumber}
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
          Yes, retrieved tasks for {props.nhsnumber}!
        </p>
        <table class="nhsuk-table">
          <caption class="nhsuk-table__caption">Upcoming Tasks</caption>
          <thead role="rowgroup" class="nhsuk-table__head">
            <tr role="row">
              <th role="columnheader" class="" scope="col">
                Task ID
              </th>
              <th role="columnheader" class=" nhsuk-table__header--numeric" scope="col">
                Service Dates
              </th>
              <th role="columnheader" class=" nhsuk-table__header--numeric" scope="col">
                Status
              </th>
              <th role="columnheader" class=" nhsuk-table__header--numeric" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="nhsuk-table__body">
            {props.barsResponse && props.barsResponse.entry && props.barsResponse.entry.map((task) => (
              <tr role="row" class="nhsuk-table__row">
              <th class="nhsuk-table__header" scope="row">{task.resource.id}</th>
              <td class="nhsuk-table__cell">Between { new Date(task.resource.executionPeriod.start).toLocaleDateString() } and { new Date(task.resource.executionPeriod.end).toLocaleDateString() }</td>
              <td class="nhsuk-table__cell">{task.resource.status} | {task.resource.intent} | {task.resource.priority}</td>
              <td class="nhsuk-table__cell">
              <button className="nhsuk-button" data-module="nhsuk-button" type="submit" onClick={()=>{checkData(task.resource)}}>
                  View Service Request Details
              </button>
              </td>
            </tr>
            ))}
          </tbody>
        </table>

      </div>
      <div id="checkingMessage" className={(! props.retrievedResult) ? "" : "nhsuk-hidden"}>
        <p className="nhsuk-u-font-size-32">
          Checking for service requests for {props.nhsnumber}...
          <span class="nhsuk-loader"></span>
        </p>
      </div>
      <Link href="/form1">Back to start</Link>
      <Spinner message="Retrieving Service Request Details"></Spinner>

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
    "retrievedResult": false
  };
  console.log(JSON.stringify(ctx.query));
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  else {
    console.log("running on client");
    props["execlocation"] = "client";
    props["nhsnumber"] = formFunctions.getSavedItem('nhsnumber');
    props['confirmScreenShown'] = true;
    console.log("getservicerequests props is " + JSON.stringify(props));
    //if (ctx.query && ctx.query != undefined){
    //  let { nhsnumber } = ctx.query;
    //  console.log("nhsnumber is " + nhsnumber);
    //  if (nhsnumber && nhsnumber != undefined) {
    //    props["nhsnumber"] = nhsnumber;
    //  }
    //}
    //call the API to get the result
    try {
      let apiResult = await getResult("https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/gettasks", new URLSearchParams(props).toString(),20000);
      props['result'] = (apiResult) ? true: false;
      props.retrievedResult = true;
      props['barsResponse'] = apiResult;
    } catch (error) {
      console.log("caught error in calling API xxxx");
      props.retrievedResult = true;
      props['result'] = false;
      props['barsResponse'] = {"entry": []};
    }
    //formFunctions.saveDataLocally(props);
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
  //if (ctx.query){
  //  let { nhsnumber } = ctx.query;
  //  if (nhsnumber) {
  //    props["nhsnumber"] = nhsnumber;
  //  }
  //}
  //call the API to get the result
  let retrievedResult = false;
  let loopNo = 1;
  let body = new URLSearchParams(props).toString();
  props.retrievedResult = false;
  while (!retrievedResult)
  {
    console.log("in loop number " + loopNo);
    try {
      let apiResult = await getResult("https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/gettasks", body, 10000 + (loopNo * 1000));
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
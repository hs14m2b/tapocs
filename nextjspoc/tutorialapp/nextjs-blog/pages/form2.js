import Cookies from 'cookies';
import Head from 'next/head';
import Hiddenform from '../components/hiddenform';
import Link from 'next/link';
import Script from 'next/script';
import formFunctions from '../utils/formfunctions';
import parse from 'urlencoded-body-parser';
import { serialize } from "cookie";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
const FORMDATACOOKIENAME = "formdata";
const DEFAULTROUTE = "/confirmdata";

function Home( props ) {
  const router = useRouter();

  function resetForm() {
      let favcolour = document.getElementById('favcolour');
      document.getElementById("favcolour-error").classList.add("nhsuk-hidden");
      document.getElementById("favcolour-form-group").classList.remove("nhsuk-form-group--error");
      favcolour.classList.remove("nhsuk-input--error");
  }

  function valid_favcolour(favcolour) {
    return true;
  }

  function checkForm2Data(e) {
    resetForm();
    e.preventDefault();
    let formdata = {};
    console.log("saving answers in state");
    let favcolour = document.getElementById('favcolour');
    formdata["favcolour"] = favcolour.value;
    formFunctions.saveDataLocally(formdata);
    //check if favcolour matches regex
    let result = valid_favcolour(favcolour.value);
    if (!result || favcolour.value == null || favcolour.value == "")
    {
        document.getElementById("favcolour-error").classList.remove("nhsuk-hidden");
        document.getElementById("favcolour-form-group").classList.add("nhsuk-form-group--error");
        favcolour.classList.add("nhsuk-input--error");
        result = false;
    }
    if (result) {
      let confirmScreenShown = formFunctions.confirmScreenShown();
      if (confirmScreenShown && confirmScreenShown != "") {
        console.log("sending to confirm screen");
        router.push("/confirmdata");
//        formFunctions.populateHiddenForm();
      }
      else {
        router.push("/formx");
      }
      return result;
    }
  }

  return (
    <>
      <Head>
        <title>Next App form rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        A form for submitting data and "remembering" the answer
      </h2>

      <form action="/form2" method="post" className="form" id="favcolourform" onSubmit={(e) => { checkForm2Data(e) }}>

        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--l">
            <h1 className="nhsuk-fieldset__heading">
              What is your favourite colour?
            </h1>
          </legend>

          <div className="nhsuk-form-group" id="favcolour-form-group">
            <label className="nhsuk-label" htmlFor="favcolour">
              Favourite Colour
            </label>
            <span className={(props.fcerror)? "nhsuk-error-message": "nhsuk-hidden nhsuk-error-message"} id="favcolour-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Please enter a valid colour
            </span>
            <input className="nhsuk-input nhsuk-input--width-10" id="favcolour" name="favcolour" type="text" defaultValue={ props.favcolour }/>
          </div>

        </fieldset>
        <input className="nhsuk-hidden" type="hidden" id="nextpage" name="nextpage" value="/formx" />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </form>
      <Link href="/form1">Back to previous question</Link>

      <Hiddenform></Hiddenform>
    </>
  )
}

Home.getInitialProps = async (ctx) => {
  console.log("in initial props");
  let props = {
    "execlocation": "server",
    "favcolour": "",
    "fcerror": false,
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  else {
    props["execlocation"] = "client";    
    props["favcolour"] = formFunctions.getSavedItem('favcolour');
    return props;
  }
  //check if POST or GET
  const cookies = new Cookies(ctx.req, ctx.res);
  const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
  let formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined" || formdataCookieRaw=="") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));
  console.log(JSON.stringify(formdataCookie));
  if (ctx.req.method == "GET") {
    const { favcolour } = formdataCookie;
    props["favcolour"] = favcolour;
    return props;
  }
  if (ctx.req.method == "POST")
  {
    const data = await parse(ctx.req);
    console.log('BODY', data);
    const { favcolour, nextpage } = data;
    props["favcolour"] = favcolour;
    props = formFunctions.checkData(props);
    if (props.fcerror ) return props;
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
    ctx.res.setHeader("Set-Cookie", cookie);
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
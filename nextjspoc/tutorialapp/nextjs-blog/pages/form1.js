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

function Home( props ) {
  const router = useRouter();

  function resetForm() {
      let givenname = document.getElementById('givenname');
      let familyname = document.getElementById('familyname');
      document.getElementById("givenname-error").classList.add("nhsuk-hidden");
      document.getElementById("givenname-form-group").classList.remove("nhsuk-form-group--error");
      givenname.classList.remove("nhsuk-input--error");
      document.getElementById("familyname-error").classList.add("nhsuk-hidden");
      document.getElementById("familyname-form-group").classList.remove("nhsuk-form-group--error");
      familyname.classList.remove("nhsuk-input--error");
  }

  function checkForm1Data(e) {
    //nhsuk-form-group--error
    //nhsuk-input--error
    resetForm();
    e.preventDefault();
    let formdata = {};
    console.log("saving answers in state");
    let givenname = document.getElementById('givenname');
    let familyname = document.getElementById('familyname');
    console.log(givenname.value + " " + familyname.value);
    formdata["givenname"] = givenname.value;
    formdata["familyname"] = familyname.value;
    formFunctions.saveDataLocally(formdata);
    //check if both populated
    let result = true;
    if (givenname.value == null || givenname.value == "")
    {
        document.getElementById("givenname-error").classList.remove("nhsuk-hidden");
        document.getElementById("givenname-form-group").classList.add("nhsuk-form-group--error");
        givenname.classList.add("nhsuk-input--error");
        result = false;
    }
    if (familyname.value == null || familyname.value == "")
    {
        document.getElementById("familyname-error").classList.remove("nhsuk-hidden");
        document.getElementById("familyname-form-group").classList.add("nhsuk-form-group--error");
        familyname.classList.add("nhsuk-input--error");
        result = false;
    }
    if (result)
    {
      let confirmScreenShown = formFunctions.confirmScreenShown();
      if (confirmScreenShown && confirmScreenShown != "")
      {
        console.log("sending to confirm screen");
        router.push("/confirmdata");
        //formFunctions.populateHiddenForm();
      }
      else {
        router.push("/form2");
      }
    }
    return false;
  }

  return (
    <>
      <Head>
        <title>Next App form rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        A set of forms for submitting data and "remembering" the answer
      </h2>

      <form action="/form1" method="post" className="form" id="nameform" noValidate onSubmit={(e) => { checkForm1Data(e); return false;  }}>

        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--l">
            <h1 className="nhsuk-fieldset__heading">
              What is your name?
            </h1>
          </legend>

          <div className="nhsuk-form-group" id="givenname-form-group">
            <label className="nhsuk-label" htmlFor="givenname">
              What is your given name?
            </label>
            <span className={(props.gnerror)? "nhsuk-error-message": "nhsuk-hidden nhsuk-error-message"} id="givenname-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Enter your full name
            </span>
            <input className="nhsuk-input" id="givenname" name="givenname" type="text" minLength="2"  defaultValue={ props.givenname } />
          </div>
          <div className="nhsuk-form-group" id="familyname-form-group">
            <label className="nhsuk-label" htmlFor="familyname">
              What is your family name?
            </label>
            <span className={(props.fnerror)? "nhsuk-error-message": "nhsuk-hidden nhsuk-error-message"} id="familyname-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Enter your full name
            </span>
            <input className="nhsuk-input" id="familyname" name="familyname" type="text" minLength="2" defaultValue={ props.familyname }/>
          </div>
        </fieldset>
        <input className="nhsuk-hidden" type="hidden" id="nextpage" name="nextpage" value="/form2" />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </form>
      <Hiddenform></Hiddenform>
    </>
  )
}

Home.getInitialProps = async (ctx) => {
  console.log("in initial props");
  let props = {
    "execlocation": "server",
    "givenname": "",
    "familyname": "",
    "gnerror": false,
    "fnerror": false
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  else {
    props["execlocation"] = "client";
    props["givenname"] = formFunctions.getSavedItem('givenname');
    props["familyname"] = formFunctions.getSavedItem('familyname');

return props;
  }
  //check if POST or GET
  const cookies = new Cookies(ctx.req, ctx.res);
  const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
  console.log(formdataCookieRaw);
  let formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined" || formdataCookieRaw=="") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));
  console.log(JSON.stringify(formdataCookie));
  if (ctx.req.method == "GET") {
    const { givenname, familyname } = formdataCookie;
    props["givenname"] = givenname;
    props["familyname"] = familyname;
    return props;
  }
  if (ctx.req.method == "POST")
  {
    const data = await parse(ctx.req);
    console.log('BODY', data);
    const { givenname, familyname, nextpost } = data;
    props["givenname"] = givenname;
    props["familyname"] = familyname;
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
      ctx.res.setHeader("Location", "/form2");
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
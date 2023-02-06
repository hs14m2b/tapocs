import Head from 'next/head';
import Hiddenform from '../components/hiddenform';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/router';

export default function Home() {
  const CONFIRMDATAROUTE = "/confirmdata";
  const FORMDATACOOKIENAME = "formdata";
  const router = useRouter();

  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
  
  function populateHiddenForm() {
      console.log("populating hidden form");
      let addresspostcode = document.getElementById('postcodehdn');
      let givenname = document.getElementById('givennamehdn');
      let familyname = document.getElementById('familynamehdn');
      let addresspostcodeLS = localStorage.getItem('addresspostcode');
      let givennameLS = localStorage.getItem('givenname');
      let familynameLS = localStorage.getItem('familyname');
      addresspostcode.value = (addresspostcodeLS != null) ? addresspostcodeLS : "";
      givenname.value = (givennameLS != null) ? givennameLS : "";
      familyname.value = (familynameLS != null) ? familynameLS : "";
      console.log("submitting hidden form");
      let nameform = document.getElementById('completesubmission');
      nameform.submit();
  }

  function addDataToCookie() {
    //get FORMDATACOOKIENAME
    let formdataCookie = getCookie(FORMDATACOOKIENAME);
    console.log(formdataCookie);
    //parse to object
    let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
    console.log(formdataCookieObject);
    //override name fields
    let givenname = document.getElementById('givenname');
    let familyname = document.getElementById('familyname');
    console.log(givenname.value + " " + familyname.value);
    formdataCookieObject["givenname"] = givenname.value;
    formdataCookieObject["familyname"] = familyname.value;
    //save cookie again
    document.cookie = FORMDATACOOKIENAME + "=" + JSON.stringify(formdataCookieObject) + "; path=/";
  }

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
    console.log("saving answers in state");
    let givenname = document.getElementById('givenname');
    let familyname = document.getElementById('familyname');
    console.log(givenname.value + " " + familyname.value);
    localStorage.setItem("givenname", givenname.value);
    localStorage.setItem("familyname", familyname.value);
    console.log("have set values in local storage");
    addDataToCookie();
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
      //get FORMDATACOOKIENAME
      let formdataCookie = getCookie(FORMDATACOOKIENAME);
      console.log(formdataCookie);
      //parse to object
      let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
      let confirmScreenShown = (formdataCookieObject.confirmScreenShown) ? formdataCookieObject.confirmScreenShown : false;
      console.log(confirmScreenShown);
      if (confirmScreenShown && confirmScreenShown != "")
      {
        console.log("sending to confirm screen");
        populateHiddenForm();
      }
      else {
        router.push("/form2");
      }
    }
    return false;
  }

  function populateForm1() {
      console.log("populating form");
      let givenname = document.getElementById('givenname');
      let familyname = document.getElementById('familyname');
      let givennameLS = localStorage.getItem('givenname');
      let familynameLS = localStorage.getItem('familyname');
      givenname.value = (givennameLS != null) ? givennameLS : "";
      familyname.value = (familynameLS != null) ? familynameLS : "";
  }

  function overrideFormBehaviour()
  {
      let nameform = document.getElementById('nameform');
      if (typeof nameform != "undefined") {
          console.log("got the form - will override action");
          //nameform.action="#";
          //nameform.removeAttribute("method");
          //console.log("have set action to blank");
          //nameform.addEventListener("submit", checkForm1Data);
          //console.log("added event listener to form");
          //populateForm1();
      }
  }

  setTimeout(populateForm1, 1000);
  setTimeout(overrideFormBehaviour, 1000);
  
  return (
    <>
      <Head>
        <title>Next App form</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h1 className="nhsuk-heading-xl">
        A set of forms for submitting data and "remembering" the answer
      </h1>

      <form action="/api/formprocessor" method="post" className="form" id="nameform" noValidate onSubmit={(e) => { checkForm1Data(e); return false;  }}>

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
            <span className="nhsuk-hidden nhsuk-error-message" id="givenname-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Enter your full name
            </span>
            <input className="nhsuk-input" id="givenname" name="givenname" type="text" minLength="2"/>
          </div>
          <div className="nhsuk-form-group" id="familyname-form-group">
            <label className="nhsuk-label" htmlFor="familyname">
              What is your family name?
            </label>
            <span className="nhsuk-hidden nhsuk-error-message" id="familyname-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Enter your full name
            </span>
            <input className="nhsuk-input" id="familyname" name="familyname" type="text" minLength="2"/>
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

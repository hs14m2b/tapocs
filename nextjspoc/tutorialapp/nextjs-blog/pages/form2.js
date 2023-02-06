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
  
  function sendToConfirmScreen()
  {
    addDataToCookie();
    //push to route
    router.push(CONFIRMDATAROUTE);
  }

  function addDataToCookie() {
    //get FORMDATACOOKIENAME
    let formdataCookie = getCookie(FORMDATACOOKIENAME);
    console.log(formdataCookie);
    //parse to object
    let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
    console.log(formdataCookieObject);
    //override name fields
    let addresspostcode = document.getElementById('address-postcode');
    console.log(addresspostcode.value );
    formdataCookieObject["address-postcode"] = addresspostcode.value;
    //save cookie again
    document.cookie = FORMDATACOOKIENAME + "=" + JSON.stringify(formdataCookieObject) + "; path=/";
  }

  function resetForm() {
      let addresspostcode = document.getElementById('address-postcode');
      document.getElementById("postcode-error").classList.add("nhsuk-hidden");
      document.getElementById("address-postcode-form-group").classList.remove("nhsuk-form-group--error");
      addresspostcode.classList.remove("nhsuk-input--error");
  }

  function valid_postcode(postcode) {
      postcode = postcode.replace(/\s/g, "");
      const regex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]{0,1} ?[0-9][A-Z]{2}$/i;
      return regex.test(postcode);
  }

  function checkForm2Data(e) {
    resetForm();
    e.preventDefault();
    console.log("saving answers in state");
    let addresspostcode = document.getElementById('address-postcode');
    console.log(addresspostcode.value);
    addresspostcode.value = addresspostcode.value.toUpperCase();
    localStorage.setItem("addresspostcode", addresspostcode.value);
    console.log("have set values in local storage");
    addDataToCookie();
    //check if postcode matches regex
    let result = valid_postcode(addresspostcode.value);
    if (!result || addresspostcode.value == null || addresspostcode.value == "")
    {
        document.getElementById("postcode-error").classList.remove("nhsuk-hidden");
        document.getElementById("address-postcode-form-group").classList.add("nhsuk-form-group--error");
        addresspostcode.classList.add("nhsuk-input--error");
        result = false;
    }
    if (result) populateHiddenForm();
    return result;
  }

  function populateForm2() {
      console.log("populating form");
      let addresspostcode = document.getElementById('address-postcode');
      let addresspostcodeLS = localStorage.getItem('addresspostcode');
      addresspostcode.value = (addresspostcodeLS != null) ? addresspostcodeLS : "";
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

  function overrideFormBehaviour()
  {
      let addressform = document.getElementById('addressform');
      if (typeof addressform != "undefined") {
          console.log("got the form - will override action");
          addressform.action="#";
          //nameform.removeAttribute("method");
          //console.log("have set action to blank");
          //nameform.addEventListener("submit", checkForm1Data);
          //console.log("added event listener to form");
          //populateForm1();
      }
  }


  setTimeout(populateForm2, 1000);
  setTimeout(overrideFormBehaviour, 1000);

  return (
    <>
      <Head>
        <title>Next App form</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h1 className="nhsuk-heading-xl">
        A form for submitting data and "remembering" the answer
      </h1>

      <form action="/api/formprocessor" method="post" className="form" id="addressform" onSubmit={(e) => { checkForm2Data(e) }}>

        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--l">
            <h1 className="nhsuk-fieldset__heading">
              What is your address?
            </h1>
          </legend>

          <div className="nhsuk-form-group" id="address-postcode-form-group">
            <label className="nhsuk-label" htmlFor="address-postcode">
              Postcode
            </label>
            <span className="nhsuk-hidden nhsuk-error-message" id="postcode-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Please enter a valid postcode
            </span>
            <input className="nhsuk-input nhsuk-input--width-10" id="address-postcode" name="address-postcode" type="text" />
          </div>

        </fieldset>
        <input className="nhsuk-hidden" type="hidden" id="nextpage" name="nextpage" value="/confirmdata" />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </form>
      <Link href="/form1">Back to previous question</Link>

      <Hiddenform></Hiddenform>
    </>
  )
}

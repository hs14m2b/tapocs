import Head from 'next/head';
import Hiddenform from '../components/hiddenform';
import Link from 'next/link';
import Script from 'next/script';
import formFunctions from '../utils/formfunctions';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
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
        formFunctions.populateHiddenForm();
      }
      else {
        router.push("/formx");
      }
      return result;
    }
  }

  function populateForm2() {
      console.log("populating form");
      let favcolour = document.getElementById('favcolour');
      let favcolourLS = formFunctions.getSavedItem('favcolour');
      favcolour.value = (favcolourLS != null) ? favcolourLS : "";
  }

  useEffect(() => { populateForm2() });  

  return (
    <>
      <Head>
        <title>Next App form</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h1 className="nhsuk-heading-xl">
        A form for submitting data and "remembering" the answer
      </h1>

      <form action="/api/formprocessor" method="post" className="form" id="favcolourform" onSubmit={(e) => { checkForm2Data(e) }}>

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
            <span className="nhsuk-hidden nhsuk-error-message" id="favcolour-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Please enter a valid colour
            </span>
            <input className="nhsuk-input nhsuk-input--width-10" id="favcolour" name="favcolour" type="text" />
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

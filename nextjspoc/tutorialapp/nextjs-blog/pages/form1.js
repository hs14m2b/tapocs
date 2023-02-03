import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Next App form</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
        <script id="form1ClientScript" src="/assets/js/form1Client.js"></script>
      </Head>
      <h1 className="nhsuk-heading-xl">
        A set of forms for submitting data and "remembering" the answer
      </h1>

      <form action="/api/form1" method="post" className="form" id="nameform" noValidate onSubmit={(e) => { if (checkForm1Data(e)) { router.push('/form2'); } else { return false; } }}>

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
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </form>
    </>
  )
}

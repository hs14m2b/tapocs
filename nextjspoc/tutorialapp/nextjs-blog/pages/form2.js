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
        <script id="form2ClientScript" src="/assets/js/form2Client.js" onLoad={() => {
          console.log('Script 2 has loaded');
          populateForm2();
        }}></script>
      </Head>
      <h1 className="nhsuk-heading-xl">
        A form for submitting data and "remembering" the answer
      </h1>

      <form action="/api/form2" method="post" className="form" id="addressform" onSubmit={(e) => { checkForm2Data(e) }}>

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
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </form>
      <Link href="/form1">Back to previous question</Link>

      <span className="nhsuk-hidden">
        <form action="/confirmdata" method="post" className="form" id="completesubmission">
          <input id="postcodehdn" name="postcodehdn" type="hidden" />
          <input id="givennamehdn" name="givennamehdn" type="hidden" />
          <input id="familynamehdn" name="familynamehdn" type="hidden" />
        </form>
      </span>
    </>
  )
}

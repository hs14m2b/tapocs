import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Next App form</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h1 className="nhsuk-heading-xl">
        A form for submitting data and "remembering" the answer
      </h1>

      <form action="/api/form1" method="post" className="form">

        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--l">
            <h1 className="nhsuk-fieldset__heading">
              What is your address?
            </h1>
          </legend>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="address-line-1">
              Building and street <span className="nhsuk-u-visually-hidden">line 1 of 2</span>
            </label>
            <input className="nhsuk-input" id="address-line-1" name="address-line-1" type="text" />
          </div>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="address-line-2">
              <span className="nhsuk-u-visually-hidden">Building and street line 2 of 2</span>
            </label>
            <input className="nhsuk-input" id="address-line-2" name="address-line-2" type="text" />
          </div>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="address-town">
              Town or city
            </label>
            <input className="nhsuk-input nhsuk-u-width-two-thirds" id="address-town" name="address-town" type="text" />
          </div>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="address-county">
              County
            </label>
            <input className="nhsuk-input nhsuk-u-width-two-thirds" id="address-county" name="address-county" type="text" />
          </div>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="address-postcode">
              Postcode
            </label>
            <input className="nhsuk-input nhsuk-input--width-10" id="address-postcode" name="address-postcode" type="text" />
          </div>

        </fieldset>
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </form>
    </>
  )
}

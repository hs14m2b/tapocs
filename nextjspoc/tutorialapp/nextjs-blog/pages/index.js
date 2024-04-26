import Head from 'next/head';
import Link from 'next/link';
const FORMDATACOOKIENAME = "formdata";

export default function Home() {
  function clearData() {
    document.cookie = FORMDATACOOKIENAME + "=; path=/";
    localStorage.clear();
    sessionStorage.clear();
  }
  return (
    <>
      <Head>
        <title>Dynamic UI Framework PoC</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
          Next.js app running in AWS Lambda
      </h2>
      <p>
        Access the <Link href="/form1">forms demo</Link>
        <br/>
        Access the <Link href="/nhsmailform">NHSmail authentication demo</Link>
        <Link className="nhsuk-u-visually-hidden" href="/form2" />
        <Link className="nhsuk-u-visually-hidden" href="/formx" />
        <Link className="nhsuk-u-visually-hidden" href="/confirmdata" />
        <Link className="nhsuk-u-visually-hidden" href="/home" />
      </p>
      <button className="nhsuk-button" data-module="nhsuk-button" onClick={clearData}>
          Clear Saved Data
      </button>


    </>
  )
}

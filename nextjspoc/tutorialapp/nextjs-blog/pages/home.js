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
        <title>Create Next App</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
        <h1 className="nhsuk-heading-xl">
          Next.js app running in AWS Lambda
        </h1>
        <p>
        Access the <Link href="/form1">forms demo</Link>
        <br/>
        Access the <Link href="/nhsmailform">NHSmail authentication demo</Link>
        <Link className="nhsuk-u-visually-hidden" href="/form2" />
        <Link className="nhsuk-u-visually-hidden" href="/formx" />
        <Link className="nhsuk-u-visually-hidden" href="/confirmdata" />
      </p>
      <button className="nhsuk-button" data-module="nhsuk-button" onClick={clearData}>
          Clear Saved Data
      </button>


    </>
  )
}

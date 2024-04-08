import Head from 'next/head';
import Link from 'next/link';
const FORMDATACOOKIENAME = "formdata";

export default function Home(props) {
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
          Next.js app running in AWS Lambda {props.prop1}
      </h2>
      <p>
        <a href='/extapi/oidcrequest'>Launch NHSmail authentication</a>
      </p>
      <p>
        <a href='/extapi/oidcrequest?prompt=login'>Launch NHSmail authentication forcing re-authentication</a>
      </p>


    </>
  )
}

export async function getServerSideProps(ctx) 
{
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  return({props: {
    "prop1": "blah"
  }})
}

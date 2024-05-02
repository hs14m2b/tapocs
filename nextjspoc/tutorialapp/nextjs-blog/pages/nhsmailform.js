import Head from 'next/head';
const FORMDATACOOKIENAME = "formdata";

function Home(props) {
  return (
    <>
      <Head>
        <title>Dynamic UI Framework PoC rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
          Next.js app running in AWS Lambda {props.prop1}
      </h2>
      <p>
        <a href='/extapi/oidcrequest'>Launch NHSmail authentication (v2 endpoint)</a>
      </p>
      <p>
        <a href='/extapi/oidcrequest?prompt=login'>Launch NHSmail authentication forcing re-authentication (v2 endpoint)</a>
      </p>
      <p>
        <a href='/extapi/oidcrequest?endpoint=v1'>Launch NHSmail authentication (v1 endpoint)</a>
      </p>
      <p>
        <a href='/extapi/oidcrequest?prompt=login&endpoint=v1'>Launch NHSmail authentication forcing re-authentication (v1 endpoint)</a>
      </p>


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
    "fnerror": false,
    "prop1": "blah"
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  else {
    props["execlocation"] = "client";
  }
  return props;
}

export default Home;
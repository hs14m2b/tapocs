import Cookies from 'cookies';
import Head from 'next/head';
import Link from 'next/link';

export default function Home({ allCookieData }) {
  const hasCookie = allCookieData.hasCookie;
  return (
    <>
      <Head>
        <title>Next App form</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h1 className="nhsuk-heading-xl">
        A page that shows the postcode submitted from the form
      </h1>

      {(hasCookie)? (<p>Postcode is {allCookieData.value}</p>): (<p>No postcode data found</p>)}
    </>
  )
}

export async function getServerSideProps({ req, res }) {
  const cookies = new Cookies(req, res);
  const postcodeCookie = cookies.get('postcode-cookie');
  console.log(JSON.stringify(postcodeCookie));
  const allCookieData = { "hasCookie": true, "name": "postcode-cookie", "value": postcodeCookie };
  return {
    props: {
      allCookieData,
    },
  };
}

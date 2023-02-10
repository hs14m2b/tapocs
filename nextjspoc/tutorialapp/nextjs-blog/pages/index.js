import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <Script>{`localStorage.clear();`}</Script>
        <h1 className="nhsuk-heading-xl">
          Next.js app running in AWS Lambda
        </h1>
        <p>
        Access the <Link href="/form1">forms demo</Link>
        <Link className="nhsuk-u-visually-hidden" href="/form2" />
        <Link className="nhsuk-hidden" href="/formx" />
        </p>

    </>
  )
}

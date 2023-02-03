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
          Next,js app running in AWS Lambda
        </h1>

        <p>
          Get started by <Link href="/postlist">going to the list of posts</Link>
        </p>
        <p>
          Access the <Link href="/form1">forms demo</Link>
        </p>

    </>
  )
}

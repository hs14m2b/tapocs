import Head from 'next/head';
import Link from 'next/link';
import { getSortedPostsData } from '../lib/posts';

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}

export default function Home({allPostsData}) {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <h1 className="nhsuk-heading-xl">
          Read <Link href="/posts/first-post">this page</Link> for the first post
        </h1>

        <p>
          Get started by editing <code>pages/index.js</code>
        </p>

        {/* Add this <section> tag below the existing <section> tag */}
        <section >
          <h2 className="nhsuk-heading-l">Blog</h2>
          <ul className="nhsuk-list">
            {allPostsData.map(({ id, date, title }) => (
              <li key={id}>
                {title}
                <br />
                {id}
                <br />
                {date}
              </li>
            ))}
          </ul>
        </section>
    </>
  )
}

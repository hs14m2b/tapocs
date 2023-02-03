// pages/_document.js
import { Head, Html, Main, NextScript } from 'next/document'

import Link from 'next/link';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <link rel="shortcut icon" href="assets/favicons/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="assets/favicons/apple-touch-icon-180x180.png" />
        <link rel="mask-icon" href="assets/favicons/favicon.svg" color="#005eb8" />
        <link rel="icon" sizes="192x192" href="assets/favicons/favicon-192x192.png" />
        <meta name="msapplication-TileImage" content="assets/favicons/mediumtile-144x144.png" />
        <meta name="msapplication-TileColor" content="#005eb8" />
        <meta name="msapplication-square70x70logo" content="assets/favicons/smalltile-70x70.png" />
        <meta name="msapplication-square150x150logo" content="assets/favicons/mediumtile-150x150.png" />
        <meta name="msapplication-wide310x150logo" content="assets/favicons/widetile-310x150.png" />
        <meta name="msapplication-square310x310logo" content="assets/favicons/largetile-310x310.png" />
      </Head>
      <body>
        <header className="nhsuk-header" role="banner">
          <div className="nhsuk-width-container nhsuk-header__container">
            <div className="nhsuk-header__logo nhsuk-header__logo--only">
              <Link className="nhsuk-header__link nhsuk-header__link--service " href="/index" aria-label="NHS homepage">
                <svg className="nhsuk-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 16" height="40" width="100">
                  <path className="nhsuk-logo__background" fill="#005eb8" d="M0 0h40v16H0z"></path>
                  <path className="nhsuk-logo__text" fill="#fff" d="M3.9 1.5h4.4l2.6 9h.1l1.8-9h3.3l-2.8 13H9l-2.7-9h-.1l-1.8 9H1.1M17.3 1.5h3.6l-1 4.9h4L25 1.5h3.5l-2.7 13h-3.5l1.1-5.6h-4.1l-1.2 5.6h-3.4M37.7 4.4c-.7-.3-1.6-.6-2.9-.6-1.4 0-2.5.2-2.5 1.3 0 1.8 5.1 1.2 5.1 5.1 0 3.6-3.3 4.5-6.4 4.5-1.3 0-2.9-.3-4-.7l.8-2.7c.7.4 2.1.7 3.2.7s2.8-.2 2.8-1.5c0-2.1-5.1-1.3-5.1-5 0-3.4 2.9-4.4 5.8-4.4 1.6 0 3.1.2 4 .6"></path>
                </svg>

                <span className="nhsuk-header__service-name">
                  Test Next.js Service
                </span>
              </Link>
            </div>
          </div>
        </header>
              
        <nav className="nhsuk-breadcrumb" aria-label="Breadcrumb">
          <div className="nhsuk-width-container">
            <ol className="nhsuk-breadcrumb__list">
              <li className="nhsuk-breadcrumb__item"><Link href="/index" className="nhsuk-breadcrumb__link">Home</Link></li>
            </ol>
            <p className="nhsuk-breadcrumb__back"><Link className="nhsuk-breadcrumb__backlink" href="/index">Back to Home</Link></p>
          </div>
        </nav>
        <div className="nhsuk-width-container ">
          <main className="nhsuk-main-wrapper " id="maincontent" role="main">
            <div className="nhsuk-grid-row">
              <div className="nhsuk-grid-column-two-thirds">
              <Main />
              <NextScript />
              </div>
            </div>
          </main>
        </div>
        <footer role="contentinfo">
          <div className="nhsuk-footer" id="nhsuk-footer">
            <div className="nhsuk-width-container">
              <h2 className="nhsuk-u-visually-hidden">Support links</h2>
              <ul className="nhsuk-footer__list">
                <li className="nhsuk-footer__list-item"><Link className="nhsuk-footer__list-item-link" href="/">Home</Link></li>
                <li className="nhsuk-footer__list-item"><Link className="nhsuk-footer__list-item-link" href="/postlist">Example page</Link></li>
              </ul>
              
              <p className="nhsuk-footer__copyright">&copy; Crown copyright</p>
            </div>
          </div>
        </footer>
      </body>
    </Html>
  )
}
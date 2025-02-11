import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";

import nhsUKStyles from "../styles/css/nhsuk-6.1.2.min.css?url";
import nhsUKStylesVisuallyHidden from "../styles/css/nhsuk-hidden.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: nhsUKStyles,
  },
  {
    rel: "stylesheet",
    href: nhsUKStylesVisuallyHidden,
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
      <header className="nhsuk-header" role="banner">
          <div className="nhsuk-width-container nhsuk-header__container">
            <div className="nhsuk-header__logo nhsuk-header__logo--only">
              <Link className="nhsuk-header__link nhsuk-header__link--service " to="/" aria-label="NHS homepage">
                <svg className="nhsuk-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 16" height="40" width="100">
                  <path className="nhsuk-logo__background" fill="#005eb8" d="M0 0h40v16H0z"></path>
                  <path className="nhsuk-logo__text" fill="#fff" d="M3.9 1.5h4.4l2.6 9h.1l1.8-9h3.3l-2.8 13H9l-2.7-9h-.1l-1.8 9H1.1M17.3 1.5h3.6l-1 4.9h4L25 1.5h3.5l-2.7 13h-3.5l1.1-5.6h-4.1l-1.2 5.6h-3.4M37.7 4.4c-.7-.3-1.6-.6-2.9-.6-1.4 0-2.5.2-2.5 1.3 0 1.8 5.1 1.2 5.1 5.1 0 3.6-3.3 4.5-6.4 4.5-1.3 0-2.9-.3-4-.7l.8-2.7c.7.4 2.1.7 3.2.7s2.8-.2 2.8-1.5c0-2.1-5.1-1.3-5.1-5 0-3.4 2.9-4.4 5.8-4.4 1.6 0 3.1.2 4 .6"></path>
                </svg>

                <span className="nhsuk-header__service-name">
                  Remix Service<noscript> running without Javascript</noscript>
                </span>
              </Link>
            </div>
          </div>
        </header>
        {children}
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
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <h1 className="nhsuk-heading-l">
            Welcome to <span className="nhsuk-u-visually-hidden">Remix</span>
          </h1>
        </header>
        <p>
        Access the <Link to="/form1">forms demo</Link>
        <br/>
        Access the <Link to="/nhsmailform">NHSmail authentication demo</Link>
        <Link className="nhsuk-u-visually-hidden" to="/form2" />
        <Link className="nhsuk-u-visually-hidden" to="/formx" />
        <Link className="nhsuk-u-visually-hidden" to="/confirmdata" />
        <Link className="nhsuk-u-visually-hidden" to="/" />
      </p>
      </div>
    </div>
  );
}

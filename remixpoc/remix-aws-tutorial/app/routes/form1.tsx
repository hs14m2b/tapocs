import type { MetaFunction,
  ActionFunctionArgs 
 } from "@remix-run/node";

import { json, 
  redirect,
 } from "@remix-run/node";

import { 
  Link, 
  Form } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Form1" },
    { name: "description", content: "Welcome to Form1" },
  ];
};

export async function action({
  request,
}: ActionFunctionArgs) {
  const body = await request.formData();
  console.log(JSON.stringify(Object.fromEntries(body)));
  const initProps = await getInitialProps(Object.fromEntries(body));
  return redirect("/form1");
}

let props = {
  "execlocation": "server",
  "givenname": "",
  "familyname": "",
  "gnerror": false,
  "fnerror": false
};

export default function Form1() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <h1 className="nhsuk-heading-l">
            Welcome to Form 1
          </h1>
        </header>
        <h2 className="nhsuk-heading-l">
        A set of forms for submitting data and "remembering" the answer
      </h2>

      <Form action="/form1" method="post" className="form" id="nameform" noValidate>

        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--l">
            <h1 className="nhsuk-fieldset__heading">
              What is your name?
            </h1>
          </legend>

          <div className="nhsuk-form-group" id="givenname-form-group">
            <label className="nhsuk-label" htmlFor="givenname">
              What is your given name?
            </label>
            <span className={(props.gnerror)? "nhsuk-error-message": "nhsuk-hidden nhsuk-error-message"} id="givenname-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Enter your full name
            </span>
            <input className="nhsuk-input" id="givenname" name="givenname" type="text" minLength="2"  defaultValue={ props.givenname } />
          </div>
          <div className="nhsuk-form-group" id="familyname-form-group">
            <label className="nhsuk-label" htmlFor="familyname">
              What is your family name?
            </label>
            <span className={(props.fnerror)? "nhsuk-error-message": "nhsuk-hidden nhsuk-error-message"} id="familyname-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Enter your full name
            </span>
            <input className="nhsuk-input" id="familyname" name="familyname" type="text" minLength="2" defaultValue={ props.familyname }/>
          </div>
        </fieldset>
        <input className="nhsuk-hidden" type="hidden" id="nextpage" name="nextpage" value="/form2" />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </Form>
      </div>
    </div>
  );
}

const getInitialProps = async (formData) => {
  console.log("in initial props");
  let intProps = {
    "execlocation": "server",
    "givenname": "",
    "familyname": "",
    "gnerror": false,
    "fnerror": false
  };
  const { givenname, familyname, nextpage } = formData;
  intProps["givenname"] = givenname;
  intProps["familyname"] = familyname;
  intProps = checkData(intProps);
  console.log(JSON.stringify(intProps));
  //gnerror or fnerror will be true if the name is blank
  props = intProps;
}

const checkData = function (formdata) {
  let { givenname, familyname } = formdata;
  let formdataResponse = formdata;
  (givenname == "" || !givenname || typeof givenname == "undefined") ? formdataResponse['gnerror'] = true : formdataResponse['gnerror'] = false;
  (familyname == "" || !familyname || typeof familyname == "undefined") ? formdataResponse['fnerror'] = true : formdataResponse['fnerror'] = false;
  console.log(JSON.stringify(formdataResponse));
  return formdataResponse;
}
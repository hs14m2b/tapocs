import Cookies from 'cookies';
import Head from 'next/head';
import Hiddenform from '../components/hiddenform';
import Link from 'next/link';
import formFunctions from '../utils/formfunctions';
import parse from 'urlencoded-body-parser';
import { serialize } from "cookie";
import { useRouter } from 'next/router';
const FORMDATACOOKIENAME = "formdata";
const DEFAULTROUTE = "/confirmdata";

function Home(props) {
  const router = useRouter();

  function resetForm() {
      let addresspostcode = document.getElementById('addresspostcode');
      document.getElementById("postcode-error").classList.add("nhsuk-hidden");
      document.getElementById("addresspostcode-form-group").classList.remove("nhsuk-form-group--error");
      addresspostcode.classList.remove("nhsuk-input--error");
  }

  function checkFormXData(e) {
    resetForm();
    e.preventDefault();
    let formdata = {};
    console.log("saving answers in state");
    let addresspostcode = document.getElementById('addresspostcode');
    formdata["addresspostcode"] = addresspostcode.value;
    formFunctions.saveDataLocally(formdata);
    //check if postcode matches regex
    let result = formFunctions.valid_postcode(addresspostcode.value);
    if (!result || addresspostcode.value == null || addresspostcode.value == "")
    {
      document.getElementById("postcode-error").classList.remove("nhsuk-hidden");
      document.getElementById("addresspostcode-form-group").classList.add("nhsuk-form-group--error");
      addresspostcode.classList.add("nhsuk-input--error");
      addresspostcode.value = addresspostcode.value.toUpperCase();      
      result = false;
    }
    if (result) router.push("/confirmdata"); //formFunctions.populateHiddenForm();
    return result;
  }

  return (
    <>
      <Head>
        <title>Next App form rendered on { props.execlocation }</title>
        <link rel="icon" href="/assets/favicons/favicon.ico" />
      </Head>
      <h2 className="nhsuk-heading-l">
        A form for submitting data and "remembering" the answer
      </h2>

      <form action="/formx" method="post" className="form" id="addressform" onSubmit={(e) => { checkFormXData(e) }}>

        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--l">
            <h1 className="nhsuk-fieldset__heading">
              What is your address?
            </h1>
          </legend>

          <div className="nhsuk-form-group" id="addresspostcode-form-group">
            <label className="nhsuk-label" htmlFor="addresspostcode">
              Postcode
            </label>
            <span className={(props.pcerror)? "nhsuk-error-message": "nhsuk-hidden nhsuk-error-message"} id="postcode-error">
                <span className="nhsuk-hidden nhsuk-input--error">Error:</span> Please enter a valid postcode
            </span>
            <input className="nhsuk-input nhsuk-input--width-10" id="addresspostcode" name="addresspostcode"
              type="text" defaultValue={props.addresspostcode} />
          </div>

        </fieldset>
        <input className="nhsuk-hidden" type="hidden" id="nextpage" name="nextpage" value="/confirmdata" />
        <button className="nhsuk-button" data-module="nhsuk-button" type="submit">
          Save and continue
        </button>
      </form>
      <Link href="/form2">Back to previous question</Link>

      <Hiddenform></Hiddenform>
    </>
  )
}

Home.getInitialProps = async (ctx) => {
  console.log("in initial props");
  let props = {
    "execlocation": "server",
    "addresspostcode": "",
    "pcerror": false,
  };
  if (ctx.req) {
    console.log("running on server");
    console.log(ctx.req.method);
  }
  else {
    props["execlocation"] = "client";
    props["addresspostcode"] = formFunctions.getSavedItem('addresspostcode');
    return props;
  }
  //check if POST or GET
  const cookies = new Cookies(ctx.req, ctx.res);
  const formdataCookieRaw = cookies.get(FORMDATACOOKIENAME);
  let formdataCookie = (formdataCookieRaw == null || typeof formdataCookieRaw == "undefined" || formdataCookieRaw=="") ? {} : JSON.parse(decodeURIComponent(formdataCookieRaw));
  console.log(JSON.stringify(formdataCookie));
  if (ctx.req.method == "GET") {
    const { addresspostcode } = formdataCookie;
    props["addresspostcode"] = addresspostcode;
    return props;
  }
  if (ctx.req.method == "POST")
  {
    const data = await parse(ctx.req);
    console.log('BODY', data);
    const { addresspostcode, nextpage } = data;
    props["addresspostcode"] = addresspostcode;
    props = formFunctions.checkData(props);
    if (props.pcerror ) return props;
    //no error in the form data. Add it to a response cookie
    for (let key in data) {
        console.log("adding " + key + " -> " + data[key] + " to cookie");
        formdataCookie[key] = data[key];
    }
    console.log("cookie is now " + JSON.stringify(formdataCookie));
    const cookie = serialize(FORMDATACOOKIENAME, JSON.stringify(formdataCookie), {
      httpOnly: false,
      path: "/",
    });
    ctx.res.setHeader("Set-Cookie", cookie);
    console.log("have set cookie header");
    let confirmScreenShown = (formdataCookie.confirmScreenShown) ? true : false;
    console.log("has confirm screen been shown yet? " + confirmScreenShown);
    if (confirmScreenShown) {
      console.log("confirm screen has been shown - sending user back to confirm screen");
      ctx.res.setHeader("Location", DEFAULTROUTE);
      ctx.res.statusCode=302;
    }
    else
    {
      ctx.res.setHeader("Location", nextpage);
      ctx.res.statusCode=302;
    }
    return props;
  }
  else {
    //unanticipated method - just return
    return props;
  }
}


export default Home
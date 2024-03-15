const FORMDATACOOKIENAME = "formdata";
const CONFIRMDATAROUTE = "/confirmdata";


module.exports.populateHiddenForm = function () {
    console.log("populating hidden form");
    let addresspostcode = document.getElementById('postcodehdn');
    let givenname = document.getElementById('givennamehdn');
    let familyname = document.getElementById('familynamehdn');
    let favcolour = document.getElementById('favcolourhdn');
    let formdataCookie = getCookie(FORMDATACOOKIENAME, JSON.stringify({}));
    let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
    addresspostcode.value = (formdataCookieObject['addresspostcode'] && typeof formdataCookieObject['addresspostcode'] == "string") ? formdataCookieObject['addresspostcode'] : "";
    givenname.value = (formdataCookieObject['givenname'] && typeof formdataCookieObject['givenname'] == "string") ? formdataCookieObject['givenname'] : "";
    familyname.value = (formdataCookieObject['familyname'] && typeof formdataCookieObject['familyname'] == "string") ? formdataCookieObject['familyname'] : "";
    favcolour.value = (formdataCookieObject['favcolour'] && typeof formdataCookieObject['favcolour'] == "string") ? formdataCookieObject['favcolour'] : "";
    console.log("submitting hidden form");
    let nameform = document.getElementById('completesubmission');
    nameform.submit();
}

module.exports.saveDataLocally = function(formdata) {
    console.log(formdata)
    //get FORMDATACOOKIENAME
    let formdataCookie = getCookie(FORMDATACOOKIENAME, JSON.stringify({}));
    console.log(formdataCookie);
    //parse to object
    let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
    console.log(formdataCookieObject);
    //override name fields
    for(const key of Object.keys(formdata)) { // each 'entry' is a [key, value] tuple
        formdataCookieObject[key] = formdata[key];
    }
    //save cookie again as well as localstorage
    document.cookie = FORMDATACOOKIENAME + "=" + JSON.stringify(formdataCookieObject) + "; path=/";
    sessionStorage.setItem(FORMDATACOOKIENAME, JSON.stringify(formdataCookieObject));
}

module.exports.getSavedItem = function(itemName) {
    console.log(itemName);
    //get FORMDATACOOKIENAME
    let formdataCookie = getCookie(FORMDATACOOKIENAME, JSON.stringify({}));
    console.log(formdataCookie);
    //parse to object
    let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
    console.log(formdataCookieObject);
    //override name fields
    return (Object.keys(formdataCookieObject).includes(itemName)) ? formdataCookieObject[itemName] : "";
}


module.exports.confirmScreenShown = function() {
    //get FORMDATACOOKIENAME
    let formdataCookie = getCookie(FORMDATACOOKIENAME, JSON.stringify({"confirmScreenShown": false}));
    console.log(formdataCookie);
    //parse to object
    let formdataCookieObject = (formdataCookie == "") ? {"confirmScreenShown": false} : JSON.parse(formdataCookie);
    let confirmScreenShown = (formdataCookieObject.confirmScreenShown) ? formdataCookieObject.confirmScreenShown : false;
    console.log(confirmScreenShown);
    return confirmScreenShown;
}

function getCookie(cname, defaultReturnValue) {
    let retVal = (defaultReturnValue == null || typeof defaultReturnValue == "undefined") ? "" : defaultReturnValue;
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return retVal;
}

module.exports.valid_postcode =  function(postcode) {
    postcode = postcode.replace(/\s/g, "");
    const regex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]{0,1} ?[0-9][A-Z]{2}$/i;
    return regex.test(postcode);
}

module.exports.checkData = function (formdata) {
    let { givenname, familyname, addresspostcode, favcolour } = formdata;
    let formdataResponse = formdata;
    (givenname == "" || !givenname || typeof givenname == "undefined") ? formdataResponse['gnerror'] = true : formdataResponse['gnerror'] = false;
    (familyname == "" || !familyname || typeof familyname == "undefined") ? formdataResponse['fnerror'] = true : formdataResponse['fnerror'] = false;
    (favcolour == "" || !favcolour || typeof favcolour == "undefined") ? formdataResponse['fcerror'] = true : formdataResponse['fcerror'] = false;
    (addresspostcode == "" || !addresspostcode || typeof addresspostcode == "undefined" || !this.valid_postcode(addresspostcode)) ? formdataResponse['pcerror'] = true : formdataResponse['pcerror'] = false;
    return formdataResponse;
}

function cancelNav(event){
    console.log("triggered the popstate handler " +JSON.stringify(event));
    history.go(1);
}

const beforeUnloadHandler = (event) => {
    console.log("triggered beforeunload");
    // Recommended
    event.preventDefault();
  
    // Included for legacy support, e.g. Chrome/Edge < 119
    event.returnValue = true;
};
console.log("loaded formfunctions");
try {
    //window.addEventListener('popstate', cancelNav);
    window.addEventListener("beforeunload", beforeUnloadHandler);
    console.log("added event listener");
} catch (error) {
    console.log("couldn't add event listener");
}
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
    addresspostcode.value = (formdataCookieObject['address-postcode'] && typeof formdataCookieObject['address-postcode'] == "string") ? formdataCookieObject['address-postcode'] : "";
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

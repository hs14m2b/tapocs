const FORMDATACOOKIENAME = "formdata";
const CONFIRMDATAROUTE = "/confirmdata";


module.exports.populateHiddenForm = function () {
    console.log("populating hidden form");
    let addresspostcode = document.getElementById('postcodehdn');
    let nhsnumber = document.getElementById('nhsnumberhdn');
    let favcolour = document.getElementById('favcolourhdn');
    let formdataCookie = getCookie(FORMDATACOOKIENAME, JSON.stringify({}));
    let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
    addresspostcode.value = (formdataCookieObject['addresspostcode'] && typeof formdataCookieObject['addresspostcode'] == "string") ? formdataCookieObject['addresspostcode'] : "";
    nhsnumber.value = (formdataCookieObject['nhsnumber'] && typeof formdataCookieObject['nhsnumber'] == "string") ? formdataCookieObject['nhsnumber'] : "";
    favcolour.value = (formdataCookieObject['favcolour'] && typeof formdataCookieObject['favcolour'] == "string") ? formdataCookieObject['favcolour'] : "";
    console.log("submitting hidden form");
    let nameform = document.getElementById('completesubmission');
    nameform.submit();
}

module.exports.saveDataLocally = function(formdata) {
    //console.log("in saveDataLocally");
    //console.log(formdata);
    //get FORMDATACOOKIENAME
    let formdataCookie = getCookie(FORMDATACOOKIENAME, JSON.stringify({}));
    //console.log(formdataCookie);
    //parse to object
    let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
    //console.log(formdataCookieObject);
    //override name fields
    for(const key of Object.keys(formdata)) { // each 'entry' is a [key, value] tuple
        formdataCookieObject[key] = formdata[key];
    }
    //save cookie again as well as localstorage
    //console.log("formdataCookieObject is " + JSON.stringify(formdataCookieObject, null, 2));
    //console.log("saving formdata to cookie");
    document.cookie = FORMDATACOOKIENAME + "=" + JSON.stringify(formdataCookieObject) + "; path=/";
    sessionStorage.setItem(FORMDATACOOKIENAME, JSON.stringify(formdataCookieObject));
}

module.exports.getSavedItem = function(itemName) {
    try {
        //console.log(itemName);
        //get from sessionStorage
        let formdataSession = decodeURIComponent(sessionStorage.getItem(FORMDATACOOKIENAME));
        //console.log(formdataSession);
        //parse to object
        let formdataSessionObject = (formdataSession == null || typeof formdataSession == "undefined" || formdataSession=="") ? {} : JSON.parse(formdataSession);
        //console.log(formdataSessionObject, null, 2);
        //return if found
        if (Object.keys(formdataSessionObject).includes(itemName)) return formdataSessionObject[itemName];
    } catch (error) {
        console.error("Error getting saved item from sessionStorage:", error);
    }
    try {
        //not found in sessionStorage so look in cookie
        //get FORMDATACOOKIENAME
        let formdataCookie = decodeURIComponent(getCookie(FORMDATACOOKIENAME, JSON.stringify({})));
        //console.log(formdataCookie);
        //parse to object
        let formdataCookieObject = (formdataCookie == "") ? {} : JSON.parse(formdataCookie);
        //console.log(formdataCookieObject);
        //override name fields
        return (Object.keys(formdataCookieObject).includes(itemName)) ? formdataCookieObject[itemName] : "";
    } catch (error) {
        console.error("Error getting saved item from cookie:", error);
    }
    //not found in either place
    return "";
}


module.exports.confirmScreenShown = function() {
    //get FORMDATACOOKIENAME
    let formdataCookie = getCookie(FORMDATACOOKIENAME, JSON.stringify({"confirmScreenShown": false}));
    //console.log(formdataCookie);
    //parse to object
    let formdataCookieObject = (formdataCookie == "") ? {"confirmScreenShown": false} : JSON.parse(formdataCookie);
    let confirmScreenShown = (formdataCookieObject.confirmScreenShown) ? formdataCookieObject.confirmScreenShown : false;
    //console.log(confirmScreenShown);
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
    let { nhsnumber, addresspostcode, favcolour } = formdata;
    let formdataResponse = formdata;
    (nhsnumber == "" || !nhsnumber || typeof nhsnumber == "undefined" || nhsnumber.length < 10 ) ? formdataResponse['gnerror'] = true : formdataResponse['gnerror'] = false;
    (favcolour == "" || !favcolour || typeof favcolour == "undefined") ? formdataResponse['fcerror'] = true : formdataResponse['fcerror'] = false;
    (addresspostcode == "" || !addresspostcode || typeof addresspostcode == "undefined" || !this.valid_postcode(addresspostcode)) ? formdataResponse['pcerror'] = true : formdataResponse['pcerror'] = false;
    return formdataResponse;
}
 

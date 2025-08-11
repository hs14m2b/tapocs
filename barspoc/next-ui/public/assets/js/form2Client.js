
function resetForm() {
    let addresspostcode = document.getElementById('address-postcode');
    document.getElementById("postcode-error").classList.add("nhsuk-hidden");
    document.getElementById("address-postcode-form-group").classList.remove("nhsuk-form-group--error");
    addresspostcode.classList.remove("nhsuk-input--error");
}

function valid_postcode(postcode) {
    postcode = postcode.replace(/\s/g, "");
    const regex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]{0,1} ?[0-9][A-Z]{2}$/i;
    return regex.test(postcode);
}

function checkForm2Data(e) {
    resetForm();
    e.preventDefault();
    console.log("saving answers in state");
    let addresspostcode = document.getElementById('address-postcode');
    console.log(addresspostcode.value);
    addresspostcode.value = addresspostcode.value.toUpperCase();
    localStorage.setItem("addresspostcode", addresspostcode.value);
    console.log("have set values in local storage");
    //check if postcode matches regex
    let result = valid_postcode(addresspostcode.value);
    if (!result || addresspostcode.value == null || addresspostcode.value == "")
    {
        document.getElementById("postcode-error").classList.remove("nhsuk-hidden");
        document.getElementById("address-postcode-form-group").classList.add("nhsuk-form-group--error");
        addresspostcode.classList.add("nhsuk-input--error");
        result = false;
    }
    if (result) populateHiddenForm();
    return result;
}

function populateForm2() {
    console.log("populating form");
    let addresspostcode = document.getElementById('address-postcode');
    let addresspostcodeLS = localStorage.getItem('addresspostcode');
    addresspostcode.value = (addresspostcodeLS != null) ? addresspostcodeLS : "";
}

function populateHiddenForm() {
    console.log("populating hidden form");
    let addresspostcode = document.getElementById('postcodehdn');
    let givenname = document.getElementById('givennamehdn');
    let familyname = document.getElementById('familynamehdn');
    let addresspostcodeLS = localStorage.getItem('addresspostcode');
    let givennameLS = localStorage.getItem('givenname');
    let familynameLS = localStorage.getItem('familyname');
    addresspostcode.value = (addresspostcodeLS != null) ? addresspostcodeLS : "";
    givenname.value = (givennameLS != null) ? givennameLS : "";
    familyname.value = (familynameLS != null) ? familynameLS : "";
    console.log("submitting hidden form");
    let nameform = document.getElementById('completesubmission');
    nameform.submit();
}

function overrideFormBehaviour()
{
    let addressform = document.getElementById('addressform');
    if (typeof addressform != "undefined") {
        console.log("got the form - will override action");
        addressform.action="#";
        //nameform.removeAttribute("method");
        //console.log("have set action to blank");
        //nameform.addEventListener("submit", checkForm1Data);
        //console.log("added event listener to form");
        //populateForm1();
    }
}


setTimeout(populateForm2, 1000);
//setTimeout(overrideFormBehaviour, 1000);
/*let addressform = document.getElementById('addressform');
if (typeof addressform != "undefined" || addressform != null) {
    console.log("got the form - will override action");
    addressform.action="#";
    addressform.removeAttribute("method");
    console.log("have set action to blank");
    //addressform.addEventListener("submit", checkForm2Data);
    //console.log("added event listener to form");
}*/

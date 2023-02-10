
function resetForm() {
    let givenname = document.getElementById('givenname');
    let familyname = document.getElementById('familyname');
    document.getElementById("givenname-error").classList.add("nhsuk-hidden");
    document.getElementById("givenname-form-group").classList.remove("nhsuk-form-group--error");
    givenname.classList.remove("nhsuk-input--error");
    document.getElementById("familyname-error").classList.add("nhsuk-hidden");
    document.getElementById("familyname-form-group").classList.remove("nhsuk-form-group--error");
    familyname.classList.remove("nhsuk-input--error");
}

function checkForm1Data(e) {
    //nhsuk-form-group--error
    //nhsuk-input--error
    resetForm();
    e.preventDefault();
    console.log("saving answers in state");
    let givenname = document.getElementById('givenname');
    let familyname = document.getElementById('familyname');
    console.log(givenname.value + " " + familyname.value);
    localStorage.setItem("givenname", givenname.value);
    localStorage.setItem("familyname", familyname.value);
    console.log("have set values in local storage");
    //check if both populated
    let result = true;
    if (givenname.value == null || givenname.value == "")
    {
        document.getElementById("givenname-error").classList.remove("nhsuk-hidden");
        document.getElementById("givenname-form-group").classList.add("nhsuk-form-group--error");
        givenname.classList.add("nhsuk-input--error");
        result = false;
    }
    if (familyname.value == null || familyname.value == "")
    {
        document.getElementById("familyname-error").classList.remove("nhsuk-hidden");
        document.getElementById("familyname-form-group").classList.add("nhsuk-form-group--error");
        familyname.classList.add("nhsuk-input--error");
        result = false;
    }
    return result;
}

function populateForm1() {
    console.log("populating form");
    let givenname = document.getElementById('givenname');
    let familyname = document.getElementById('familyname');
    let givennameLS = localStorage.getItem('givenname');
    let familynameLS = localStorage.getItem('familyname');
    givenname.value = (givennameLS != null) ? givennameLS : "";
    familyname.value = (familynameLS != null) ? familynameLS : "";
}

function overrideFormBehaviour()
{
    let nameform = document.getElementById('nameform');
    if (typeof nameform != "undefined") {
        console.log("got the form - will override action");
        //nameform.action="#";
        //nameform.removeAttribute("method");
        //console.log("have set action to blank");
        //nameform.addEventListener("submit", checkForm1Data);
        //console.log("added event listener to form");
        //populateForm1();
    }
}

setTimeout(populateForm1, 1000);
setTimeout(overrideFormBehaviour, 1000);
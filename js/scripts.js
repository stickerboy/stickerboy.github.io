/*!
* 
* Copyright 2022 @stickerboy / Kenny Cameron
* kenny.cx v1.1.0 (https://www.kenny.cx)
*/
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

if(document.getElementById("resume") !== null) {
    const resume = document.getElementById("resume");
    const email = "xc.ynnek@yeh";
    const subject = "Request for CV / Resume";
    const emailRev = email.split("").reverse().join("");
    resume.setAttribute("href", "mailto:" + emailRev + "?subject=" + subject);
}

const curious = document.getElementById("curious");
const curiouser = document.getElementById("curiouser");
curious.addEventListener("click", function() {
    this.classList.toggle("me-4");
    curiouser.classList.toggle("visually-hidden");
});

curiouser.addEventListener("click", function() {
    window.location = "../==wc19WayV3Y";
});
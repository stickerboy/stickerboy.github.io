/*!
* Start Bootstrap - Landing Page v6.0.5 (https://startbootstrap.com/theme/landing-page)
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-landing-page/blob/master/LICENSE)
*/
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
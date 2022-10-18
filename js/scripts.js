/*!
* Start Bootstrap - Landing Page v6.0.5 (https://startbootstrap.com/theme/landing-page)
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-landing-page/blob/master/LICENSE)
*/
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

if(document.getElementById("resume").length > 0) {
    const resume = document.getElementById("resume");
    const email = "xc.ynnek@yeh";
    const subject = "Request for CV / Resume";
    const emailRev = email.split("").reverse().join("");
    resume.setAttribute("href", "mailto:" + emailRev + "?subject=" + subject);
}
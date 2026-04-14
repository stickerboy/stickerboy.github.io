/*!
* scripts.js
*/

// ...existing code...

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

if (document.getElementById("resume") !== null) {
    const resume = document.getElementById("resume");
    const email = "xc.ynnek@yeh";
    const subject = "Request for CV / Resume";
    const emailRev = email.split("").reverse().join("");
    resume.setAttribute("href", "mailto:" + emailRev + "?subject=" + subject);
}

const curious = document.getElementById("curious");
const curiouser = document.getElementById("curiouser");
curious.addEventListener("click", function () {
    this.classList.toggle("me-4");
    curiouser.classList.toggle("visually-hidden");
});

curiouser.addEventListener("click", function () {
    window.location = "../==wc19WayV3Y";
});

if (document.body.classList.contains('homepage')) {
    const main = document.querySelector('main');

    document.querySelectorAll('a.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target && main) {
                e.preventDefault();
                // Get the position of the target relative to the main scroll container
                const elementPosition = target.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
                let scrollTo = elementPosition; // -8 for extra spacing

                // If scrolling would leave a gap at the bottom, adjust
                const maxScroll = main.scrollHeight - main.clientHeight;
                if (scrollTo > maxScroll) scrollTo = maxScroll;

                main.scrollTo({
                    top: scrollTo,
                    behavior: 'smooth'
                });
                history.replaceState(null, '', '#' + targetId);
            }
        });
    });
}
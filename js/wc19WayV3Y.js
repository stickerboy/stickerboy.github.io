let codeInput = document.getElementById("code");
function codeDrop() {
    codeInput.value = codeInput.value + this.innerHTML;
}
const elements = document.getElementsByClassName("btn--code"); 
Array.from(elements, c => c.addEventListener('click', codeDrop));

const verify = document.getElementById("verify");
verify.addEventListener("click", function() {
    console.log(codeInput.value);
    if(b64EncodeUnicode(codeInput.value) === "R3Y3M2o2alVWcQ==") {
        verify.classList.remove("btn-outline-secondary", "btn-danger");
        verify.classList.add("btn-success");
        codeInput.classList.remove("is-invalid");
        codeInput.classList.add("is-valid");
        setTimeout(() => {
            window.location ="../index.html";
        }, 2000);
        return;
    }
    verify.classList.remove("btn-outline-secondary", "btn-success");
    verify.classList.add("btn-danger");
    codeInput.classList.remove("is-valid");
    codeInput.classList.add("is-invalid");
});

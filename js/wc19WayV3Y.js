let verify = document.getElementById("code");
function codeDrop() {
    verify.value = verify.value + this.innerHTML;
}
const elements = document.getElementsByClassName("btn--code"); 
Array.from(elements, c => c.addEventListener('click', codeDrop));
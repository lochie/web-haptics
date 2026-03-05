import { trigger } from "web-haptics";

const button = document.getElementById("trigger-btn")!;
button.addEventListener("click", () => trigger());

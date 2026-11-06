/* Toast and modal dialog. */
import { $ } from "../util.js";

export function toast(t, ms=2400) {
  const el = $("toast");
  el.textContent = t; el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(()=>el.hidden=true, ms);
}

let onYes = null;

export function openModal({title, body, price, note=false, yes="OK", no="Cancel", cls="cash", cb}) {
  $("m-title").textContent = title; $("m-body").textContent = body;
  $("m-price").hidden = !price; $("m-price").textContent = price||""; $("m-note").hidden = !note;
  $("m-yes").textContent = yes; $("m-yes").className = "buy "+cls; $("m-no").hidden = !no; $("m-no").textContent = no||"";
  onYes = cb; $("modal").hidden = false; $("m-yes").focus();
}

export function initDialogs() {
  $("m-no").onclick = () => { $("modal").hidden = true; onYes = null; };
  $("m-yes").onclick = () => { $("modal").hidden = true; const f = onYes; onYes = null; f&&f(); };
}

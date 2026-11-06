/* Toast and modal dialog. */
import { $ } from "../util.js";

export function toast(t, ms=2400) {
  const el = $("toast");
  el.textContent = t; el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(()=>el.hidden=true, ms);
}

let onYes = null;

/** Open the modal. `field` adds a text box: {value, placeholder, readonly}; its text is passed to cb.
 *  `html` (trusted, built by us) replaces the plain-text body when given. */
export function openModal({title, body="", html, price, note=false, yes="OK", no="Cancel", cls="cash", cb, field}) {
  $("m-title").textContent = title;
  if (html) $("m-body").innerHTML = html; else $("m-body").textContent = body;
  $("m-price").hidden = !price; $("m-price").textContent = price||""; $("m-note").hidden = !note;
  const f = $("m-field");
  f.hidden = !field;
  if (field) { f.value = field.value||""; f.placeholder = field.placeholder||""; f.readOnly = !!field.readonly; }
  $("m-yes").hidden = !yes; $("m-yes").textContent = yes||""; $("m-yes").className = "buy "+cls; $("m-no").hidden = !no; $("m-no").textContent = no||"";
  onYes = cb; $("modal").hidden = false;
  if (field) { f.focus(); if (field.readonly) f.select(); } else if (yes) $("m-yes").focus(); else $("m-no").focus();
}

export const closeModal = () => { $("modal").hidden = true; onYes = null; };

export function initDialogs() {
  $("m-no").onclick = closeModal;
  $("m-yes").onclick = () => { $("modal").hidden = true; const f = onYes; onYes = null; f&&f($("m-field").value); };
}

/** Copy text to the clipboard, with a fallback for older browsers. */
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (e2) {}
    t.remove(); return ok;
  }
}

// Pequenos auxiliares de DOM, puros o bastante para serem testados sem navegador.

/** 'onInput' -> 'input'; devolve null se a prop não for um handler (onX com X maiúsculo). */
export function eventName(prop) {
  const m = /^on([A-Z][A-Za-z]*)$/.exec(prop);
  return m ? m[1].toLowerCase() : null;
}

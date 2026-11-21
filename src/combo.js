import { norm } from './text.js';

// Filtro das sugestões do campo "Tipo de tema" (lista própria do site; o datalist nativo abre no lugar errado).


/** Opções que casam com o texto (sem diferenciar maiúsculas nem acentos); quem começa com o texto vem primeiro. */
export function filterOptions(options, query) {
  const q = norm(query);
  if (!q) return [...options];
  const comeca = [];
  const contem = [];
  for (const o of options) {
    const n = norm(o);
    if (n.startsWith(q)) comeca.push(o);
    else if (n.includes(q)) contem.push(o);
  }
  return [...comeca, ...contem];
}

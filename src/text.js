// Normalização de texto para buscas: sem acento e sem diferenciar maiúsculas.

/** Minúsculas e sem acento, sem mexer nos espaços (o tamanho de cada letra se mantém, para mapear posições). */
export const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** `fold` sem os espaços das pontas. */
export const norm = (s) => fold(s).trim();

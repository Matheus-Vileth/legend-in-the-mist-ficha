// Janela de confirmação do próprio site (o confirm() nativo não aparece em alguns navegadores embutidos).
import { h } from './ui.js';

/** Resolve true se o usuário confirmar; false se cancelar, apertar Esc ou clicar fora. O foco inicial é "Cancelar" (o lado seguro). */
export function confirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancelar' }) {
  return new Promise((resolve) => {
    const previous = document.activeElement;
    const cancel = h('button', { type: 'button', class: 'btn ghost' }, cancelLabel);
    const ok = h('button', { type: 'button', class: 'btn wine' }, confirmLabel);
    const box = h('div', { class: 'card hero', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-title' },
      h('h2', { id: 'dlg-title' }, title),
      h('div', { class: 'body' }, h('p', {}, message), h('div', { class: 'actions' }, cancel, ok)));
    const overlay = h('div', { class: 'modal' }, box);

    const close = (value) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      previous?.focus?.();
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const order = [cancel, ok];
        const i = order.indexOf(document.activeElement);
        order[i < 0 ? 0 : (i + (e.shiftKey ? order.length - 1 : 1)) % order.length].focus();
      }
    };

    cancel.addEventListener('click', () => close(false));
    ok.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', onKey, true);
    document.body.append(overlay);
    cancel.focus();
  });
}

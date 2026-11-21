// Desenha um passo de edição a partir de LAYOUTS (layouts.js) e dos campos de fieldmap.js.
import { SLIDES } from './fieldmap.js';
import { LAYOUTS } from './layouts.js';
import { setValue, setExclusive } from './state.js';
import { h, img } from './ui.js';
import { filterOptions } from './combo.js';

export const MIGHT_ICON = { Origem: 'ornamento-folha-a', Aventura: 'ornamento-estrela', Grandeza: 'ornamento-coroa' };
const QUEST_TITLE = { Marcos: 'Marco' };
const NUMBERED = new Set(['Tags de mochila']);

const isTier = (f) => f.kind === 'check' && /^(Nível|Círculo) \d+$/.test(f.label);
const isScratch = (f) => f.kind === 'check' && f.label === 'riscada';
const isQuestGroup = (g) => !g.exclusive && g.fields.length > 0 && g.fields.every((f) => f.kind === 'check' && !isTier(f) && !isScratch(f));
const isSingleText = (g) => g.fields.length === 1 && g.fields[0].kind === 'text';

let seq = 0;
const uid = () => `f${seq++}`;

/** Campo de texto ligado ao estado. Devolve uma lista de nós (campos com `options` ganham a lista de sugestões). */
function textInput(f, ctx, { cls = 'line' } = {}) {
  const id = uid();
  const input = h('input', {
    type: 'text', id, class: cls, value: ctx.getState().values[f.name] ?? '', placeholder: f.label, 'aria-label': f.label,
    autocomplete: 'off', maxLength: 500,
    onInput: (e) => ctx.commit(setValue(ctx.getState(), f.name, e.target.value)),
  });
  return f.options ? [combo(input, f, ctx, id)] : [input];
}

/** Texto livre com sugestões (lista do próprio site, logo abaixo do campo; teclado: setas, Enter, Esc). */
function combo(input, f, ctx, id) {
  const list = h('ul', { id: `${id}-list`, class: 'combo-list', role: 'listbox', hidden: true });
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', `${id}-list`);
  let items = [];
  let active = -1;

  const paint = () => {
    list.replaceChildren(...items.map((o, i) =>
      h('li', {
        role: 'option', id: `${id}-o${i}`, class: i === active ? 'on' : '', 'aria-selected': String(i === active),
        onMousedown: (e) => { e.preventDefault(); choose(o); },
      }, o)));
    if (active >= 0) input.setAttribute('aria-activedescendant', `${id}-o${active}`);
    else input.removeAttribute('aria-activedescendant');
  };
  const open = () => {
    items = filterOptions(f.options, input.value);
    active = -1;
    paint();
    list.hidden = items.length === 0;
    input.setAttribute('aria-expanded', String(!list.hidden));
    input.closest('.card')?.classList.toggle('raise', !list.hidden); // por cima dos cartões seguintes
  };
  const close = () => {
    list.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    input.closest('.card')?.classList.remove('raise');
  };
  const choose = (o) => {
    input.value = o;
    ctx.commit(setValue(ctx.getState(), f.name, o));
    close();
  };

  input.addEventListener('focus', open);
  input.addEventListener('click', () => { if (list.hidden) open(); });
  input.addEventListener('input', open);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) open();
      if (!items.length) return;
      const down = e.key === 'ArrowDown';
      active = active < 0 ? (down ? 0 : items.length - 1) : (active + (down ? 1 : -1) + items.length) % items.length;
      paint();
      list.children[active]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === 'Escape' && !list.hidden) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  });
  list.addEventListener('click', (e) => e.preventDefault()); // o <label> pai não deve reabrir o campo
  return h('div', { class: 'combo' }, input, list);
}

/** Marca (losango ou riscada): checkbox real escondido + desenho. */
function markCheck(f, ctx, { shape = 'dot', tier = false, aria = f.label } = {}) {
  const input = h('input', {
    type: 'checkbox', class: 'vh', checked: !!ctx.getState().values[f.name], 'aria-label': aria,
    onChange: (e) => ctx.commit(setValue(ctx.getState(), f.name, e.target.checked)),
  });
  return h('label', { class: tier ? 'hit tier' : 'hit' }, input, h('span', { class: shape }), tier ? h('small', {}, f.label.match(/(\d+)$/)[1]) : null);
}

/** Magnitude: medalhões exclusivos (marcar um desmarca os outros; clicar de novo limpa). */
function medals(group, ctx) {
  const names = group.fields.map((f) => f.name);
  const wrap = h('div', { class: 'might', role: 'group', 'aria-label': group.label });
  const sync = () => {
    for (const box of wrap.querySelectorAll('input')) box.checked = !!ctx.getState().values[box.getAttribute('data-name')];
  };
  wrap.append(
    ...group.fields.map((f) =>
      h('label', { class: 'medal' },
        h('input', {
          type: 'checkbox', class: 'vh', 'data-name': f.name, checked: !!ctx.getState().values[f.name], 'aria-label': f.label,
          onChange: (e) => { ctx.commit(setExclusive(ctx.getState(), names, e.target.checked ? f.name : null)); sync(); },
        }),
        h('span', { class: 'ring' }, img(MIGHT_ICON[f.label])),
        f.label)),
  );
  return wrap;
}

/** Título do tema (1ª tag de poder) na fita de louros, com a sua marca de riscada. */
function ribbon(group, ctx) {
  const title = group.fields.find((f) => f.kind === 'text');
  const scratch = group.fields.find(isScratch);
  const id = uid();
  return h('div', {},
    h('label', { class: 'fld center', htmlFor: id }, 'Título do tema · 1ª tag de poder'),
    h('div', { class: 'ribbon' },
      h('input', {
        type: 'text', id, value: ctx.getState().values[title.name] ?? '', placeholder: 'Título do tema', 'aria-label': 'Título do tema',
        autocomplete: 'off', maxLength: 500, onInput: (e) => ctx.commit(setValue(ctx.getState(), title.name, e.target.value)),
      })),
    h('div', { class: 'ribbon-foot' }, markCheck(scratch, ctx, { shape: 'scratch', aria: 'Título do tema — riscada' }), 'riscada'));
}

function groupNodes(group, ctx) {
  if (group.exclusive) return [medals(group, ctx)];
  if (group.label === 'Título do tema') return [ribbon(group, ctx)];
  const nodes = [];
  const normal = group.fields.filter((f) => !f.fold);
  const folded = group.fields.filter((f) => f.fold);
  let i = 0;
  let n = 0;
  while (i < normal.length) {
    const f = normal[i];
    if (isTier(f)) {
      const tiers = h('div', { class: 'tiers', role: 'group', 'aria-label': group.label });
      while (i < normal.length && isTier(normal[i])) tiers.append(markCheck(normal[i++], ctx, { tier: true }));
      nodes.push(tiers);
      continue;
    }
    if (f.kind === 'check') {
      const dots = h('div', { class: 'dots' });
      while (i < normal.length && normal[i].kind === 'check' && !isScratch(normal[i]) && !isTier(normal[i])) dots.append(markCheck(normal[i++], ctx));
      nodes.push(dots);
      continue;
    }
    const next = normal[i + 1];
    if (f.name.startsWith('Companion ') && next?.name.startsWith('Relationship ')) {
      nodes.push(h('div', { class: 'row' }, ...textInput(f, ctx), ...textInput(next, ctx)));
      i += 2;
      continue;
    }
    const scratch = next && isScratch(next) ? next : null;
    const power = /^power(\d)$/.exec(f.role ?? '');
    const num = power ? Number(power[1]) + 1 : NUMBERED.has(group.label) ? ++n : null;
    if (scratch || num != null) {
      nodes.push(h('div', { class: 'row' },
        num != null ? h('span', { class: 'tagnum', 'aria-hidden': 'true' }, String(num)) : null,
        ...textInput(f, ctx),
        scratch ? markCheck(scratch, ctx, { shape: 'scratch', aria: `${f.label} — riscada` }) : null));
    } else {
      nodes.push(...textInput(f, ctx));
    }
    i += scratch ? 2 : 1;
  }
  if (folded.length) nodes.push(h('details', {}, h('summary', {}, 'Notas (opcional)'), ...folded.flatMap((f) => textInput(f, ctx))));
  return nodes;
}

/** Vários grupos num bloco; grupos só de marcas (Abandonar/Melhoria/Marco) viram colunas de uma fileira "quest". */
function blockNodes(groups, ctx) {
  const out = [];
  let quest = null;
  for (const g of groups) {
    if (isQuestGroup(g)) {
      if (!quest) { quest = h('div', { class: 'quest' }); out.push(quest); }
      quest.append(h('div', {}, QUEST_TITLE[g.label] ?? g.label,
        h('span', { class: 'dots', role: 'group', 'aria-label': g.label }, ...g.fields.map((f) => markCheck(f, ctx)))));
    } else {
      quest = null;
      out.push(...groupNodes(g, ctx));
    }
  }
  return out;
}

export function renderBlock(block, slide, ctx) {
  const groups = (block.groups ?? []).map((label) => slide.groups.find((g) => g.label === label));
  switch (block.kind) {
    case 'hero': {
      const body = h('div', { class: block.split ? 'body herogrid' : 'body' });
      if (block.split) {
        const [first, ...rest] = groups;
        body.append(
          h('div', {}, ...groupNodes(first, ctx)),
          h('div', { class: 'rightcol' },
            ...rest.flatMap((g) => (isSingleText(g) ? [h('label', { class: 'fld' }, g.label, ...textInput(g.fields[0], ctx))] : groupNodes(g, ctx)))),
        );
      } else {
        body.append(...groups.flatMap((g) => (isSingleText(g) ? textInput(g.fields[0], ctx, { cls: 'line big' }) : groupNodes(g, ctx))));
      }
      return h('div', { class: 'card hero' }, h('h2', {}, block.title), body);
    }
    case 'card': {
      const promise = groups.some((g) => g.label === 'Promessa');
      const body = h('div', { class: 'body' }, ...blockNodes(groups, ctx), promise ? h('p', { class: 'cap' }, 'Marque os círculos conforme o herói cumpre a sua promessa.') : null);
      return h('div', { class: `card${block.emphasis ? ' hero' : ''}${promise ? ' promise' : ''}` }, h('h2', {}, block.title), body);
    }
    case 'sub':
      return h('section', { class: `sub${block.tone === 'weak' ? ' weak' : ''}` }, h('h3', {}, block.title), ...blockNodes(groups, ctx));
    case 'details':
      return h('details', { class: 'sub' }, h('summary', {}, `${block.title} (opcional)`), ...blockNodes(groups, ctx));
    case 'cols':
      return h('div', { class: 'grid2', style: `grid-template-columns:${block.ratio}` },
        ...block.cols.map((col) => h('div', { class: 'col' }, ...col.map((b) => renderBlock(b, slide, ctx)))));
    case 'grid':
      return h('div', { class: 'grid' }, ...block.blocks.map((b) => renderBlock(b, slide, ctx)));
    default:
      throw new Error(`Bloco desconhecido: ${block.kind}`);
  }
}

/** ctx = { getState(), commit(next) } */
export function renderStep(index, ctx) {
  seq = 0;
  const slide = SLIDES[index];
  const layout = LAYOUTS[slide.id];
  const blocks = layout.blocks.map((b) => renderBlock(b, slide, ctx));
  const body = layout.decor === 'paisagem'
    ? h('div', { class: 'grid has-decor' }, h('div', { class: 'col' }, ...blocks), h('div', { class: 'decor' }, img('moldura-paisagem')))
    : blocks;
  return h('div', { class: 'view' },
    h('h1', { tabIndex: -1 }, slide.title),
    img('divisor-b', { class: 'divider' }),
    h('p', { class: 'hint' }, slide.hint),
    body);
}

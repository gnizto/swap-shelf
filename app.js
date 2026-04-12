// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let config = {};
let items  = [];
let cart   = [];

// ════════════════════════════════════════════
// BOOT — load config.json + items.csv
// ════════════════════════════════════════════
async function boot() {
  showLoading();
  try {
    const [cfgRes, csvRes] = await Promise.all([
      fetch('config.json?v=1'),
      fetch('items.csv?v=1'),
    ]);

    if (!cfgRes.ok) throw new Error('Não foi possível carregar config.json');
    if (!csvRes.ok) throw new Error('Não foi possível carregar items.csv');

    config = await cfgRes.json();
    items  = parseCSV(await csvRes.text());

    applyConfig();
    populateVendorFilter();
    renderCatalog();
  } catch (err) {
    showError(err.message);
  }
}

function showLoading() {
  document.getElementById('catalog-grid').innerHTML =
    `<div class="loading"><div class="spinner"></div>Carregando catálogo…</div>`;
}

function showError(msg) {
  document.getElementById('catalog-grid').innerHTML = `
    <div class="error-banner">
      <strong>⚠️ Não foi possível carregar o catálogo</strong>
      ${msg}<br><br>
      Se estiver testando localmente, abra o terminal na pasta do projeto e rode:<br>
      <code style="background:#fde;padding:.2rem .4rem;border-radius:3px">npx serve .</code>
      ou <code style="background:#fde;padding:.2rem .4rem;border-radius:3px">python -m http.server 8000</code>
    </div>`;
}

// ════════════════════════════════════════════
// CSV PARSER
// Suporta campos com aspas, vírgulas internas
// Campos multi-valor separados por "|"
// ════════════════════════════════════════════
function parseCSV(text) {
  // split lines, ignoring \r (Windows line endings)
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const obj    = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });

    // type coercions
    return {
      id:              parseInt(obj.id)            || 0,
      nome:            obj.nome                    || '',
      descricao:       obj.descricao               || '',
      preco:           parseFloat(obj.preco)       || 0,
      preco_minimo:    parseFloat(obj.preco_minimo)|| null,
      preco_novo:      parseFloat(obj.preco_novo)  || null,
      vendedor:        obj.vendedor                || '',
      emoji:           obj.emoji                   || '📦',
      status:          obj.status                  || 'disponivel',
      // multi-value fields split by "|"
      caracteristicas: splitPipe(obj.caracteristicas),
      fotos:           splitPipe(obj.fotos),
    };
  });
}

// Splits one CSV line respecting quoted fields
function splitCSVLine(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // escaped quote inside quotes: ""
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// Splits "a | b | c" into ["a","b","c"], ignoring empties
function splitPipe(val) {
  if (!val) return [];
  return val.split('|').map(s => s.trim()).filter(Boolean);
}

// ════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════
function applyConfig() {
  // CSS variables
  document.documentElement.style.setProperty('--accent',   config.cor_principal  || '#C0654A');
  document.documentElement.style.setProperty('--accent-d', shade(config.cor_principal || '#C0654A', -22));
  document.documentElement.style.setProperty('--green',    config.cor_secundaria || '#7A8C6E');

  // Page title
  document.title = (config.nome || 'Catálogo') + ' — Loja';

  // Logo: last word in italic accent color
  const words = (config.nome || '').trim().split(' ');
  const last  = words.pop();
  document.getElementById('logo').innerHTML =
    (words.length ? words.join(' ') + ' ' : '') + `<em>${last}</em>`;

  // Hero
  document.getElementById('hero-title').textContent = config.nome    || '';
  document.getElementById('hero-sub').textContent   = config.slogan  || '';

  // Promo tags
  const wrap = document.getElementById('promo-tags');
  wrap.innerHTML = '';
  [config.promo_1, config.promo_2].forEach((txt, i) => {
    if (!txt) return;
    const span = document.createElement('span');
    span.className = 'ptag ' + (i === 0 ? 'ptag-a' : 'ptag-b');
    span.textContent = txt;
    wrap.appendChild(span);
  });
}

function shade(hex, amt) {
  const n = parseInt(hex.replace('#',''), 16);
  const clamp = v => Math.min(255, Math.max(0, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// ════════════════════════════════════════════
// CATALOG RENDER
// ════════════════════════════════════════════
function renderCatalog() {
  const q   = (document.getElementById('f-search').value || '').toLowerCase();
  const st  = document.getElementById('f-status').value;
  const vnd = document.getElementById('f-vendor').value;

  const filtered = items.filter(it => {
    const mq = it.nome.toLowerCase().includes(q) || it.vendedor.toLowerCase().includes(q);
    const ms = st  === 'all' || it.status === st;
    const mv = vnd === 'all' || it.vendedor === vnd;
    return mq && ms && mv;
  });

  const grid = document.getElementById('catalog-grid');

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>Nenhum item encontrado.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(it => buildCard(it)).join('');

  // swipe on multi-photo cards
  grid.querySelectorAll('.card-photo[data-photos]').forEach(el => initSwipe(el));
}

function buildCard(it) {
  const sold  = it.status === 'vendido';
  const res   = it.status === 'reservado';
  const fotos = (it.fotos || []).filter(Boolean);
  const disc  = (it.preco_novo && it.preco) ? Math.round((1 - it.preco / it.preco_novo) * 100) : 0;
  const inCart = cart.some(c => c.id === it.id);

  // photo area
  const photoHTML = fotos.length
    ? `<img src="${fotos[0]}" alt="${it.nome}" loading="lazy">
       ${fotos.length > 1 ? `<div class="photo-dots">${fotos.map((_,i) =>
         `<div class="photo-dot${i===0?' active':''}"></div>`).join('')}</div>` : ''}`
    : `<div class="emoji-placeholder">${it.emoji || '📦'}</div>`;

  // promo hint
  const promoHint = (!sold && it.preco_minimo)
    ? `<div class="promo-hint">🛒 3 itens ou à vista: <strong>R$ ${fmt(it.preco_minimo)}</strong></div>` : '';

  // cart button
  const cartBtn = sold
    ? `<button class="btn btn-ghost btn-sm" style="flex:1" disabled>Vendido</button>`
    : inCart
      ? `<button class="btn btn-ghost btn-sm" style="flex:1" onclick="removeFromCart(${it.id});event.stopPropagation()">✓ No carrinho</button>`
      : `<button class="btn btn-primary btn-sm" style="flex:1" onclick="addToCart(${it.id});event.stopPropagation()">+ Carrinho</button>`;

  return `
  <div class="card${sold ? ' sold' : ''}" onclick="openDetail(${it.id})">
    <div class="card-badges">
      <span>${sold ? '<span class="badge badge-sold">Vendido</span>' : res ? '<span class="badge badge-reserved">Reservado</span>' : ''}</span>
      <span>${disc > 0 && !sold ? `<span class="badge badge-discount">−${disc}%</span>` : ''}</span>
    </div>
    <div class="card-photo" data-photos='${JSON.stringify(fotos)}' data-idx="0">${photoHTML}</div>
    <div class="card-body">
      <div class="card-vendor">${it.vendedor}</div>
      <div class="card-name">${it.nome}</div>
      ${it.descricao ? `<div class="card-desc">${it.descricao}</div>` : ''}
      <div class="prices">
        <div class="price-ask">R$ ${fmt(it.preco)}</div>
        <div class="price-row">
          ${it.preco_novo  ? `<span class="price-new">novo: R$ ${fmt(it.preco_novo)}</span>`    : ''}
          ${it.preco_minimo && !sold ? `<span class="price-min">mín: R$ ${fmt(it.preco_minimo)}</span>` : ''}
        </div>
      </div>
    </div>
    ${promoHint}
    <div class="card-footer" onclick="event.stopPropagation()">
      ${cartBtn}
      <button class="btn btn-ghost btn-sm" onclick="openDetail(${it.id})">Detalhes</button>
    </div>
  </div>`;
}

function populateVendorFilter() {
  const sel = document.getElementById('f-vendor');
  const cur = sel.value;
  const vendors = [...new Set(items.map(i => i.vendedor))].sort();
  sel.innerHTML = '<option value="all">Todos</option>' +
    vendors.map(v => `<option value="${v}"${v === cur ? ' selected' : ''}>${v}</option>`).join('');
}

// swipe for multi-photo cards
function initSwipe(el) {
  const photos = JSON.parse(el.dataset.photos || '[]');
  if (photos.length <= 1) return;
  let startX = 0;
  el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 30) return;
    let idx = parseInt(el.dataset.idx) || 0;
    idx = dx < 0 ? Math.min(idx + 1, photos.length - 1) : Math.max(idx - 1, 0);
    el.dataset.idx = idx;
    const img = el.querySelector('img');
    if (img) img.src = photos[idx];
    el.querySelectorAll('.photo-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  });
}

// ════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════
function openDetail(id) {
  const it = items.find(i => i.id === id);
  if (!it) return;

  const sold   = it.status === 'vendido';
  const fotos  = (it.fotos || []).filter(Boolean);
  const disc   = (it.preco_novo && it.preco) ? Math.round((1 - it.preco / it.preco_novo) * 100) : 0;
  const inCart = cart.some(c => c.id === id);

  document.getElementById('detail-title').textContent = it.nome;

  const photosHTML = fotos.length
    ? fotos.map(p => `<div class="detail-photo"><img src="${p}" alt="${it.nome}" loading="lazy"></div>`).join('')
    : `<div class="detail-photo">${it.emoji || '📦'}</div>`;

  document.getElementById('detail-body').innerHTML = `
    <div class="detail-photos">${photosHTML}</div>
    <div class="detail-grid">
      <div class="detail-field"><label>Vendedor</label><span>${it.vendedor}</span></div>
      <div class="detail-field"><label>Status</label>
        <span>${sold ? '🔴 Vendido' : it.status === 'reservado' ? '🟡 Reservado' : '🟢 Disponível'}</span>
      </div>
      <div class="detail-field">
        <label>Preço pedido</label>
        <span style="font-size:1.1rem;font-weight:500">R$ ${fmt(it.preco)}</span>
      </div>
      ${it.preco_minimo && !sold ? `<div class="detail-field"><label>Valor mínimo</label><span style="color:var(--green)">R$ ${fmt(it.preco_minimo)}</span></div>` : '<div></div>'}
      ${it.preco_novo ? `<div class="detail-field"><label>Preço novo</label><span style="text-decoration:line-through;color:var(--light)">R$ ${fmt(it.preco_novo)}</span></div>` : ''}
      ${disc > 0 ? `<div class="detail-field"><label>Economia</label><span style="color:var(--accent)">${disc}% abaixo do novo</span></div>` : ''}
      ${it.descricao ? `<div class="detail-field full"><label>Descrição</label><span>${it.descricao}</span></div>` : ''}
    </div>
    ${it.caracteristicas && it.caracteristicas.length ? `
    <div class="tags-wrap">
      <h4>Características</h4>
      <div class="tags-list">${it.caracteristicas.map(c => `<span class="tag">${c}</span>`).join('')}</div>
    </div>` : ''}
    ${!sold && it.preco_minimo ? `
    <div class="promo-hint" style="margin-top:.9rem">
      🛒 ${config.promo_1 || '3 itens ou à vista'} → <strong>R$ ${fmt(it.preco_minimo)}</strong>
    </div>` : ''}
    ${!sold ? `<div style="margin-top:1rem">
      ${inCart
        ? `<button class="btn btn-ghost btn-full" onclick="removeFromCart(${id});closeModal('modal-detail')">✓ Remover do carrinho</button>`
        : `<button class="btn btn-primary btn-full" onclick="addToCart(${id});closeModal('modal-detail')">+ Adicionar ao carrinho</button>`}
    </div>` : ''}
  `;

  document.getElementById('modal-detail').classList.add('open');
}

// ════════════════════════════════════════════
// CART
// ════════════════════════════════════════════
function addToCart(id) {
  const it = items.find(i => i.id === id);
  if (!it || it.status === 'vendido' || cart.some(c => c.id === id)) return;
  cart.push(it);
  renderCart();
  renderCatalog();
  toast('Adicionado ao carrinho!');
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
  renderCatalog();
}

function renderCart() {
  // badge
  const badge = document.getElementById('cart-count');
  if (cart.length) { badge.textContent = cart.length; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');

  const itemsEl  = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');

  if (!cart.length) {
    itemsEl.innerHTML = `<div class="cart-empty">Nenhum item ainda.<br>Navegue pelo catálogo e adicione o que gostar! 😊</div>`;
    footerEl.classList.add('hidden');
    return;
  }

  itemsEl.innerHTML = cart.map(it => {
    const thumb = (it.fotos || []).filter(Boolean)[0];
    return `<div class="cart-item">
      <div class="ci-thumb">${thumb ? `<img src="${thumb}" alt="${it.nome}">` : it.emoji || '📦'}</div>
      <div class="ci-info">
        <div class="ci-name">${it.nome}</div>
        <div class="ci-vendor">${it.vendedor}</div>
        <div class="ci-price">R$ ${fmt(it.preco)}</div>
      </div>
      <button class="ci-remove" onclick="removeFromCart(${it.id})" title="Remover">✕</button>
    </div>`;
  }).join('');

  const total    = cart.reduce((s, i) => s + i.preco, 0);
  const minTotal = cart.reduce((s, i) => s + (i.preco_minimo || i.preco), 0);
  const qualify  = cart.length >= 3;
  const saving   = qualify ? (total - minTotal) : 0;
  const final    = qualify ? minTotal : total;

  let promoBox = '';
  if (cart.length > 0 && !qualify) {
    const need = 3 - cart.length;
    promoBox = `<div class="cart-promo-box">➕ Adicione mais <strong>${need} item${need > 1 ? 's' : ''}</strong> e todos saem pelo valor mínimo!</div>`;
  } else if (qualify) {
    promoBox = `<div class="cart-promo-box qualify">🎉 Com 3+ itens, todos saem pelo <strong>valor mínimo</strong>!</div>`;
  }

  document.getElementById('cart-totals').innerHTML = `
    ${promoBox}
    <div class="total-row"><span>Subtotal</span><span>R$ ${fmt(total)}</span></div>
    ${qualify ? `
    <hr class="total-divider">
    <div class="total-row"><span>Total com promoção</span><span>R$ ${fmt(minTotal)}</span></div>
    <div class="total-row saving"><span>✅ Economia</span><span>−R$ ${fmt(saving)}</span></div>` : ''}
    <hr class="total-divider">
    <div class="total-row big"><span>Total a pagar</span><span style="color:var(--accent)">R$ ${fmt(final)}</span></div>
  `;

  // show whatsapp button only if number configured
  const waBtn = document.getElementById('btn-whatsapp');
  waBtn.classList.toggle('hidden', !config.whatsapp);

  footerEl.classList.remove('hidden');
}

function sendWhatsapp() {
  if (!config.whatsapp) return;
  const qualify  = cart.length >= 3;
  const minTotal = cart.reduce((s, i) => s + (i.preco_minimo || i.preco), 0);
  const total    = cart.reduce((s, i) => s + i.preco, 0);
  const final    = qualify ? minTotal : total;

  const lines = cart.map(it =>
    `• ${it.nome} — R$ ${fmt(qualify ? (it.preco_minimo || it.preco) : it.preco)}`
  ).join('\n');

  const msg = `Olá${config.contato_nome ? ', ' + config.contato_nome : ''}! 😊\n\nTenho interesse nos seguintes itens:\n\n${lines}\n\n*Total: R$ ${fmt(final)}*${qualify ? ' (valor mínimo — 3 itens)' : ''}\n\nPoderia confirmar disponibilidade?`;

  window.open(`https://wa.me/55${config.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
}

function openCart()  {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}

// ════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(el =>
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); })
);

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function fmt(v) {
  return (v != null) ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00';
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2300);
}

// ════════════════════════════════════════════
// PROPOSAL
// ════════════════════════════════════════════
let proposalSelected = new Set();

function openProposal() {
  proposalSelected = new Set();
  document.getElementById('proposal-client').value = '';
  document.getElementById('proposal-note').value   = '';
  renderProposalList();
  document.getElementById('modal-proposal').classList.add('open');
}

function renderProposalList() {
  const available = items.filter(i => i.status !== 'vendido');
  const list = document.getElementById('proposal-item-list');

  if (!available.length) {
    list.innerHTML = `<p style="font-size:.82rem;color:var(--mid);text-align:center;padding:1rem">Nenhum item disponível.</p>`;
    return;
  }

  list.innerHTML = available.map(it => {
    const checked = proposalSelected.has(it.id);
    const disc    = (it.preco_novo && it.preco) ? Math.round((1 - it.preco / it.preco_novo) * 100) : 0;
    return `
    <label style="display:flex;align-items:center;gap:.7rem;padding:.55rem .65rem;border-radius:5px;border:1.5px solid ${checked ? 'var(--accent)' : '#d0c8bc'};background:${checked ? '#fff3ec' : 'var(--white)'};cursor:pointer;transition:all .15s">
      <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleProposalItem(${it.id}, this.checked)"
        style="width:16px;height:16px;accent-color:var(--accent);flex-shrink:0">
      <span style="flex:1;min-width:0">
        <span style="font-size:.85rem;font-weight:500;display:block">${it.emoji || '📦'} ${it.nome}</span>
        <span style="font-size:.74rem;color:var(--mid)">${it.vendedor}${disc > 0 ? ` · −${disc}% vs. novo` : ''}</span>
      </span>
      <span style="text-align:right;flex-shrink:0">
        <span style="font-size:.88rem;font-weight:500;display:block">R$ ${fmt(it.preco)}</span>
        ${it.preco_minimo ? `<span style="font-size:.72rem;color:var(--green)">mín R$ ${fmt(it.preco_minimo)}</span>` : ''}
      </span>
    </label>`;
  }).join('');

  updateProposalSummary();
}

function toggleProposalItem(id, checked) {
  checked ? proposalSelected.add(id) : proposalSelected.delete(id);
  renderProposalList();
}

function updateProposalSummary() {
  const sel     = items.filter(i => proposalSelected.has(i.id));
  const summary = document.getElementById('proposal-summary');
  if (!sel.length) { summary.style.display = 'none'; return; }

  const total    = sel.reduce((s, i) => s + i.preco, 0);
  const minTotal = sel.reduce((s, i) => s + (i.preco_minimo || i.preco), 0);
  const qualify  = sel.length >= 3;

  summary.style.display = 'block';
  summary.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
      <span style="color:var(--mid)">${sel.length} item${sel.length > 1 ? 's' : ''} selecionado${sel.length > 1 ? 's' : ''}</span>
      <span>R$ ${fmt(total)}</span>
    </div>
    ${qualify ? `
    <div style="display:flex;justify-content:space-between;color:var(--green);font-weight:500">
      <span>🎉 Total com promoção (3+ itens)</span>
      <span>R$ ${fmt(minTotal)}</span>
    </div>` : `
    <div style="font-size:.75rem;color:var(--mid)">
      ➕ Selecione ${3 - sel.length} item${3 - sel.length > 1 ? 's' : ''} a mais para aplicar o valor mínimo em todos
    </div>`}
  `;
}

function printProposal() {
  const sel = items.filter(i => proposalSelected.has(i.id));
  if (!sel.length) { toast('Selecione ao menos 1 item.'); return; }

  const client   = document.getElementById('proposal-client').value.trim();
  const note     = document.getElementById('proposal-note').value.trim();
  const qualify  = sel.length >= 3;
  const total    = sel.reduce((s, i) => s + i.preco, 0);
  const minTotal = sel.reduce((s, i) => s + (i.preco_minimo || i.preco), 0);
  const final    = qualify ? minTotal : total;
  const saving   = qualify ? (total - minTotal) : 0;
  const today    = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });

  const rowsHTML = sel.map(it => {
    const disc      = (it.preco_novo && it.preco) ? Math.round((1 - it.preco / it.preco_novo) * 100) : 0;
    const unitPrice = qualify ? (it.preco_minimo || it.preco) : it.preco;
    return `
    <tr>
      <td style="padding:.6rem .5rem;border-bottom:1px solid #eee;vertical-align:top">
        <strong style="font-size:.9rem">${it.emoji || '📦'} ${it.nome}</strong>
        ${it.descricao ? `<br><span style="font-size:.75rem;color:#888">${it.descricao}</span>` : ''}
        ${it.caracteristicas && it.caracteristicas.length
          ? `<br><span style="font-size:.72rem;color:#aaa">${it.caracteristicas.join(' · ')}</span>` : ''}
      </td>
      <td style="padding:.6rem .5rem;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;vertical-align:top">
        ${it.preco_novo && disc > 0
          ? `<span style="text-decoration:line-through;color:#bbb;font-size:.78rem">R$ ${fmt(it.preco_novo)}</span><br>` : ''}
        ${qualify && it.preco_minimo && it.preco_minimo < it.preco
          ? `<span style="text-decoration:line-through;color:#bbb;font-size:.78rem">R$ ${fmt(it.preco)}</span><br>` : ''}
        <strong>R$ ${fmt(unitPrice)}</strong>
        ${disc > 0 ? `<br><span style="font-size:.72rem;color:#27ae60">−${disc}% vs. novo</span>` : ''}
      </td>
    </tr>`;
  }).join('');

  const html = `
  <div style="font-family:'DM Sans',Arial,sans-serif;max-width:680px;margin:0 auto;padding:2rem;color:#2C2C2C">

    <!-- header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;padding-bottom:1.2rem;border-bottom:3px solid ${config.cor_principal || '#C0654A'}">
      <div>
        <div style="font-size:1.6rem;font-weight:700;letter-spacing:-.5px">${config.nome || 'Catálogo'}</div>
        ${config.slogan ? `<div style="font-size:.85rem;color:#888;margin-top:.15rem">${config.slogan}</div>` : ''}
        ${config.contato_nome ? `<div style="font-size:.8rem;color:#888;margin-top:.2rem">Vendedor: ${config.contato_nome}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:.72rem;color:#aaa;text-transform:uppercase;letter-spacing:.5px">Proposta</div>
        <div style="font-size:.85rem;color:#555;margin-top:.15rem">${today}</div>
        ${client ? `<div style="font-size:.85rem;margin-top:.3rem">Para: <strong>${client}</strong></div>` : ''}
      </div>
    </div>

    <!-- items table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
      <thead>
        <tr style="background:#f5f0e8">
          <th style="text-align:left;padding:.5rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:2px solid #e8ddd0">Item</th>
          <th style="text-align:right;padding:.5rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:2px solid #e8ddd0">Valor</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>

    <!-- totals -->
    <div style="margin-left:auto;max-width:280px;font-size:.88rem">
      <div style="display:flex;justify-content:space-between;padding:.3rem 0;color:#888">
        <span>Subtotal (preço pedido)</span><span>R$ ${fmt(total)}</span>
      </div>
      ${qualify ? `
      <div style="display:flex;justify-content:space-between;padding:.3rem 0;color:#27ae60;font-weight:500">
        <span>🎉 Promoção 3+ itens</span><span>−R$ ${fmt(saving)}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-top:2px solid #eee;margin-top:.3rem;font-size:1.05rem;font-weight:700">
        <span>Total</span><span style="color:${config.cor_principal || '#C0654A'}">R$ ${fmt(final)}</span>
      </div>
      ${qualify
        ? `<div style="font-size:.72rem;color:#27ae60;margin-top:.2rem">✅ Valor mínimo aplicado (3+ itens)</div>`
        : (sel.some(i => i.preco_minimo)
            ? `<div style="font-size:.72rem;color:#888;margin-top:.2rem">💡 Com 3+ itens ou pagamento à vista, total seria R$ ${fmt(minTotal)}</div>`
            : '')}
    </div>

    <!-- note -->
    ${note ? `
    <div style="margin-top:2rem;padding:1rem;background:#f9f6f1;border-left:3px solid ${config.cor_principal || '#C0654A'};border-radius:0 4px 4px 0;font-size:.82rem;color:#555;line-height:1.6">
      <strong style="display:block;margin-bottom:.3rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#aaa">Observações</strong>
      ${note}
    </div>` : ''}

    <!-- footer -->
    <div style="margin-top:2.5rem;padding-top:1rem;border-top:1px solid #eee;font-size:.72rem;color:#bbb;text-align:center">
      ${config.nome || ''} ${config.contato_nome ? '· ' + config.contato_nome : ''} ${config.whatsapp ? '· WhatsApp: ' + config.whatsapp : ''}
    </div>

  </div>`;

  // inject into print area and trigger print
  const printArea = document.getElementById('print-area');
  printArea.innerHTML = html;
  closeModal('modal-proposal');
  setTimeout(() => {
    window.print();
    // clean up after print dialog closes
    setTimeout(() => { printArea.innerHTML = ''; }, 1000);
  }, 100);
}

// ════════════════════════════════════════════
// START
// ════════════════════════════════════════════
boot();

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const ANO_ATUAL = new Date().getFullYear();
const ANOS_HIST = Array.from({ length: 5 }, (_, i) => ANO_ATUAL - 5 + i);
const ANO_BASE_PROJ = ANO_ATUAL - 1;
const LS_KEY = 'dcf_v3';

// ─── ESTADO ──────────────────────────────────────────────────────────────────
let projAnos = 5;
let perpRate = 3.0;
let projGrowths = [3, 5, 5, 5, 5];
const lucrosProjetados = [];
const lucrosManuais = [];
const hrv = [0, 0, 0, 0, 0]; // hist raw values
let editingTicker = null; // ticker sendo editado (null = nova análise)

// ─── LOCALSTORAGE ─────────────────────────────────────────────────────────────
function getList() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}
function setList(a) {
  localStorage.setItem(LS_KEY, JSON.stringify(a));
}

// ─── EXPORTAR / IMPORTAR ──────────────────────────────────────────────────────
function exportarDados() {
  const list = getList();
  if (list.length === 0) {
    alert('Nenhuma análise para exportar.');
    return;
  }
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `preco-teto-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarDados(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error();
      const list = getList();
      imported.forEach((entry) => {
        if (!entry.ticker) return;
        const idx = list.findIndex((s) => s.ticker === entry.ticker);
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
      });
      setList(list);
      renderDash();
      const btn = document.getElementById('btn-import');
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Importado';
      btn.style.color = 'var(--green)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.color = '';
      }, 2000);
    } catch (_) {
      alert('Arquivo inválido. Use um arquivo exportado por esta calculadora.');
    }
    input.value = '';
  };
  reader.readAsText(file);
}

// ─── FORMATAÇÃO ──────────────────────────────────────────────────────────────
function fmtBRL(v) {
  if (isNaN(v) || !isFinite(v)) return '—';
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(v) {
  if (isNaN(v) || !isFinite(v)) return '—';
  const a = Math.abs(v),
    s = v < 0 ? '-' : '';
  if (a >= 1e9)
    return (
      s + 'R$ ' + (a / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' bi'
    );
  if (a >= 1e6)
    return (
      s + 'R$ ' + (a / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mi'
    );
  if (a >= 1e3)
    return (
      s + 'R$ ' + (a / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mil'
    );
  return fmtBRL(v);
}
function fmtMoney(v) {
  return !v && v !== 0 ? '' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseMoney(s) {
  return !s
    ? 0
    : parseFloat(
        s
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      ) || 0;
}
function fmtNum(v) {
  return !v && v !== 0 ? '—' : v.toLocaleString('pt-BR');
}

// ─── MODAL JSON ───────────────────────────────────────────────────────────────
function abrirModalJSON() {
  document.getElementById('json-input').value = '';
  document.getElementById('json-error').textContent = '';
  document.getElementById('modal-json').style.display = 'flex';
  setTimeout(() => document.getElementById('json-input').focus(), 50);
}

function fecharModalJSON(e) {
  if (e && e.target !== document.getElementById('modal-json')) return;
  document.getElementById('modal-json').style.display = 'none';
}

function importarJSON() {
  const raw = document.getElementById('json-input').value.trim();
  const errEl = document.getElementById('json-error');
  errEl.textContent = '';

  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    errEl.textContent = 'JSON inválido. Verifique o formato e tente novamente.';
    return;
  }

  if (!Array.isArray(data)) {
    errEl.textContent = 'O JSON precisa ser um array de objetos.';
    return;
  }

  const porAno = new Map(
    data
      .filter((e) => /^\d{4}$/.test(String(e.year)))
      .map((e) => [+e.year, e.value])
  );

  if (porAno.size === 0) {
    errEl.textContent = 'Nenhum ano válido encontrado no JSON.';
    return;
  }

  ANOS_HIST.forEach((ano, i) => {
    if (!porAno.has(ano)) return;
    hrv[i] = porAno.get(ano);
    const el = document.getElementById('hist' + i);
    if (el) el.value = fmtMoney(hrv[i]);
  });

  recalc();
  document.getElementById('modal-json').style.display = 'none';
}

// ─── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function irParaDashboard() {
  renderDash();
  showScreen('screen-dash');
}

function irParaCalc(ticker) {
  editingTicker = ticker;
  document.getElementById('topbar-mode').textContent = ticker ? `editando ${ticker}` : 'nova análise';
  if (ticker) {
    const entry = getList().find((s) => s.ticker === ticker);
    if (entry) carregarPremissas(entry);
  } else {
    resetarSilencioso();
  }
  showScreen('screen-calc');
}

// ─── CARREGAR PREMISSAS SALVAS ────────────────────────────────────────────────
function carregarPremissas(e) {
  document.getElementById('empresa-nome').value = e.ticker || '';
  document.getElementById('td').value = e.td || 13;

  document.getElementById('n-acoes').value = e.nAcoes || '';
  document.getElementById('n-tesouraria').value = e.nTesouraria || 0;
  document.getElementById('divida').value = e.divida || 0;
  document.getElementById('preco-atual').value = e.precoAtual || '';
  if (e.hist)
    e.hist.forEach((v, i) => {
      hrv[i] = v || 0;
      const el = document.getElementById('hist' + i);
      if (el) el.value = v ? fmtMoney(v) : '';
    });
  if (e.projGrowths) projGrowths = [...e.projGrowths];
  else projGrowths = [3, 5, 5, 5, 5];
  lucrosProjetados.length = 0;
  lucrosManuais.length = 0;
  perpRate = e.perpRate || 3.0;
  projAnos = e.projAnos || 5;
  document.getElementById('btn3').classList.toggle('active', projAnos === 3);
  document.getElementById('btn5').classList.toggle('active', projAnos === 5);
  recalc();
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function renderDash() {
  const list = getList();
  const tbody = document.getElementById('dash-tbody');
  const tableWrap = document.getElementById('dash-table-wrap');
  const empty = document.getElementById('empty-state');
  let ok = 0,
    bad = 0;
  list.forEach((s) => {
    const pa = parseFloat(s.precoAtual) || 0,
      vi = s.intrinsecNum || 0;
    if (pa > 0 && vi > 0) {
      if (pa <= vi) ok++;
      else bad++;
    }
  });
  document.getElementById('st-total').textContent = list.length;
  document.getElementById('st-ok').textContent = ok;
  document.getElementById('st-bad').textContent = bad;
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  document.getElementById('dash-sub').textContent =
    list.length === 0
      ? 'Nenhuma empresa analisada ainda'
      : `${list.length} empresa${list.length > 1 ? 's' : ''} analisada${list.length > 1 ? 's' : ''} — ${hoje}`;
  if (list.length === 0) {
    empty.style.display = 'flex';
    tableWrap.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  tableWrap.style.display = 'block';
  tbody.innerHTML = list
    .map((s, i) => {
      const pa = parseFloat(s.precoAtual) || 0,
        vi = s.intrinsecNum || 0;
      const msNum = pa > 0 && vi > 0 ? (1 - pa / vi) * 100 : null;
      const msStr = msNum !== null ? (msNum >= 0 ? '+' : '') + msNum.toFixed(1) + '%' : '—';
      const msTier = msNum === null ? null : msNum < 0 ? 'red' : msNum < 10 ? 'amber' : msNum < 20 ? 'blue' : 'green';
      const msClass = msTier === null ? 'dc' : msTier === 'green' ? 'gpos' : msTier === 'red' ? 'gneg' : msTier;
      let statusBadge = '<span class="upbadge warn">Sem preço</span>';
      if (msTier === 'red')   statusBadge = '<span class="upbadge bad">Loucura comprar</span>';
      if (msTier === 'amber') statusBadge = '<span class="upbadge warn">Eu gostaria de um preço melhor</span>';
      if (msTier === 'blue')  statusBadge = '<span class="upbadge info">Ótimo preço</span>';
      if (msTier === 'green') statusBadge = '<span class="upbadge ok">Preço bom pra caralho</span>';
      return `<tr style="animation:slideUp .3s ease ${i * 0.05}s both">
<td style="text-align:left;">
  <div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="irParaCalc('${s.ticker}')">
    <div class="ticker-badge">${s.ticker.slice(0, 4)}</div>
    <span style="font-family:var(--sans);font-size:14px;font-weight:700;letter-spacing:.03em;">${s.ticker}</span>
  </div>
</td>
<td><span style="color:var(--green);">${s.intrinseco}</span></td>
<td><input type="number" class="card-preco-input" placeholder="0,00" step="0.01" value="${
        s.precoAtual || ''
      }" data-idx="${i}" onchange="atualizarPA(this)" onchange="atualizarPA(this)"/></td>
<td class="${msClass}" style="font-family:var(--mono);font-weight:500;">${msStr}</td>
<td>${statusBadge}</td>
<td style="font-family:var(--mono);font-size:11px;color:var(--text3);white-space:nowrap;">${s.data}</td>
<td>
  <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;">
    <button class="card-edit" onclick="irParaCalc('${s.ticker}')">editar</button>
    <span class="card-del" onclick="deletar(${i})" title="Remover">×</span>
  </div>
</td>
    </tr>`;
    })
    .join('');
}

function atualizarPA(el) {
  const i = parseInt(el.dataset.idx);
  const list = getList();
  list[i].precoAtual = el.value;
  setList(list);
  renderDash();
}

function deletar(i) {
  if (!confirm('Remover esta análise?')) return;
  const list = getList();
  list.splice(i, 1);
  setList(list);
  renderDash();
}

// ─── HIST INPUTS ─────────────────────────────────────────────────────────────
function buildHistInputs() {
  const grid = document.getElementById('hist-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('div');
    d.className = 'hist-item';
    d.innerHTML = `<label>${ANOS_HIST[i]}</label><input type="text" id="hist${i}" placeholder="R$ 0,00" inputmode="numeric" autocomplete="off" data-idx="${i}"/>`;
    grid.appendChild(d);
    const inp = d.querySelector('input');
    inp.addEventListener('focus', function () {
      this.value = hrv[i] ? String(hrv[i]) : '';
      this.select();
    });
    inp.addEventListener('input', function () {
      hrv[i] = parseMoney(this.value);
      recalc();
    });
    inp.addEventListener('blur', function () {
      this.value = hrv[i] ? fmtMoney(hrv[i]) : '';
    });
  }
}

function setHist(n) {
  projAnos = n;
  document.getElementById('btn3').classList.toggle('active', n === 3);
  document.getElementById('btn5').classList.toggle('active', n === 5);
  recalc();
}

// ─── RECALCULO ────────────────────────────────────────────────────────────────
function recalc() {
  const td = (parseFloat(document.getElementById('td').value) || 13) / 100;
  const nTotal = parseFloat(document.getElementById('n-acoes').value) || 0;
  const nTesoura = parseFloat(document.getElementById('n-tesouraria').value) || 0;
  const nAcoes = Math.max(nTotal - nTesoura, 1);
  const divida = (parseFloat(document.getElementById('divida').value) || 0) * 1e6;
  const pa = parseFloat(document.getElementById('preco-atual').value) || 0;

  // ações ex-tesouraria display
  document.getElementById('r-acoes-ex').textContent = nTotal > 0 ? fmtNum(nAcoes) : '—';

  const hd = [...hrv];
  const hs = [...hd];
  const as = [...ANOS_HIST];

  let rows = '';
  hs.forEach((l, i) => {
    let gh = '<span class="dc">—</span>';
    if (i > 0 && hs[i - 1] > 0 && l > 0) {
      const g = (l / hs[i - 1] - 1) * 100;
      gh = `<span class="${g >= 0 ? 'gpos' : 'gneg'}">${g >= 0 ? '+' : ''}${g.toFixed(2)}%</span>`;
    }
    rows += `<tr class="hr"><td>${as[i]}</td><td>${
      l > 0 ? fmtBRL(l) : '<span class="dc">—</span>'
    }</td><td>${gh}</td><td><span class="dc">—</span></td></tr>`;
  });

  // Projeção: fluxo = lucro projetado (editável)
  let lb = hd[hd.length - 1] || 0;
  let vplF = 0;

  for (let i = 0; i < projAnos; i++) {
    // usa lucro manual se existir
    if (lucrosManuais[i] === true) {
      lb = lucrosProjetados[i];
    } else {
      lb = lb * (1 + projGrowths[i] / 100);
    }

    const vpl = lb / Math.pow(1 + td, i + 1);

    vplF += vpl;

    rows += `
    <tr class="pr">

      <td>
        ${ANO_BASE_PROJ + i + 1}
      </td>

      <td>
        <input
          type="text"
          class="gi"
          value="${fmtMoney(Math.round(lb))}"
          data-idx="${i}"
          onfocus="this.select()"
          oninput="updLucro(this)"
          onblur="updLucroBlur(this)"
          style="width:150px;text-align:right;"
        />
      </td>

      <td>
        <input
          type="number"
          class="gi"
          value="${parseFloat(projGrowths[i].toFixed(2))}"
          min="-50"
          max="300"
          step="0.5"
          data-idx="${i}"
          onchange="updG(this)"
        />

        <span style="
          font-family:var(--mono);
          font-size:11px;
          color:var(--text3);
          margin-left:2px;
        ">
          %
        </span>
      </td>

      <td>
        ${fmtShort(Math.round(vpl))}
      </td>

    </tr>
  `;
  }

  let vplT = 0;
  let vt = 0;
  if (td > perpRate / 100) {
    const fcNext = lb * (1 + perpRate / 100);
    vt = fcNext / (td - perpRate / 100);
    const terminalDiscountYears = Math.max(projAnos - 1, 1);
    vplT = vt / Math.pow(1 + td, terminalDiscountYears);
    rows += `<tr class="perp-r"><td>Perpétuo</td><td>${fmtShort(Math.round(vt))}</td>
<td><div class="pc"><button class="pb" onclick="chgP(-0.5)">−</button><span class="prv">${perpRate.toFixed(
      1
    )}%</span><button class="pb" onclick="chgP(0.5)">+</button></div></td>
<td style="color:var(--green);font-weight:500;">${fmtShort(Math.round(vplT))}</td></tr>`;
  }
  document.getElementById('tbl-body').innerHTML = rows;

  const vplTotal = vplF + vplT;
  const vEmp = vplTotal - divida;
  const vAcao = vEmp / nAcoes;
  const prTeto = vAcao;
  const msNum = pa > 0 && vAcao > 0 ? (1 - pa / vAcao) * 100 : null;
  const lpa = (hd[hd.length - 1] || 0) / nAcoes;
  const pl = lpa > 0 ? (prTeto / lpa).toFixed(1) : '—';

  document.getElementById('s-vpl').textContent = fmtShort(Math.round(vplF));
  document.getElementById('s-vt').textContent = fmtShort(Math.round(vplT));
  document.getElementById('s-intrinseco').textContent = fmtBRL(vAcao);
  if (msNum !== null) {
    document.getElementById('s-ms').textContent = (msNum >= 0 ? '+' : '') + msNum.toFixed(1) + '%';
    document.getElementById('s-ms').className = 'sval ' + (msNum >= 0 ? 'green' : 'bad');
    document.getElementById('s-ms-sub').textContent = msNum >= 0 ? 'margem disponível' : 'preço acima do intrínseco';
  } else {
    document.getElementById('s-ms').textContent = '—';
    document.getElementById('s-ms').className = 'sval amber';
    document.getElementById('s-ms-sub').textContent = 'informe o preço atual';
  }
  document.getElementById('r-mcap').textContent = fmtShort(Math.round(vEmp));
  document.getElementById('r-intrinseco').textContent = fmtBRL(vAcao);
  document.getElementById('r-teto').textContent = fmtBRL(prTeto);
  if (msNum !== null) {
    document.getElementById('r-ms').textContent = (msNum >= 0 ? '+' : '') + msNum.toFixed(1) + '%';
    document.getElementById('r-ms').className = 'real-val ' + (msNum >= 0 ? 'amber' : 'red');
  } else {
    document.getElementById('r-ms').textContent = '—';
    document.getElementById('r-ms').className = 'real-val amber';
  }
  const up = pa > 0 ? (vAcao / pa - 1) * 100 : null;
  const uel = document.getElementById('r-upside');
  if (up !== null) {
    uel.textContent = (up >= 0 ? '+' : '') + up.toFixed(2) + '%';
    uel.className = 'real-val ' + (up >= 0 ? 'green' : 'red');
  } else {
    uel.textContent = '—';
    uel.className = 'real-val';
  }

  const badge = document.getElementById('vbadge'),
    det = document.getElementById('vdet'),
    plel = document.getElementById('vpl-lbl');
  if (pa > 0 && vAcao > 0) {
    if (pa <= vAcao) {
      badge.textContent = 'Abaixo do intrínseco';
      badge.className = 'badge ok';
      det.textContent = `Margem de ${msNum?.toFixed(1)}% disponível — upside de ${up?.toFixed(2)}%`;
    } else {
      badge.textContent = 'Acima do intrínseco';
      badge.className = 'badge bad';
      det.textContent = `Preço atual ${Math.abs(up ?? 0).toFixed(2)}% acima do valor calculado`;
    }
    plel.textContent = `P/L implícito: ${pl}x`;
  } else {
    badge.textContent = 'Aguardando dados';
    badge.className = 'badge warn';
    det.textContent = 'Preencha os lucros históricos e o preço atual';
    plel.textContent = '';
  }
}

function updG(el) {
  const idx = parseInt(el.dataset.idx);
  projGrowths[idx] = parseFloat((parseFloat(el.value) || 0).toFixed(2));
  lucrosManuais[idx] = false;
  recalc();
}

function updLucro(el) {
  const idx = parseInt(el.dataset.idx);
  const novoLucro = parseMoney(el.value) || 0;

  const hd = [...hrv];
  let lbPrev = hd[hd.length - 1] || 0;
  for (let i = 0; i < idx; i++) {
    lbPrev = lucrosManuais[i] === true ? lucrosProjetados[i] : lbPrev * (1 + projGrowths[i] / 100);
  }

  if (lbPrev > 0) {
    projGrowths[idx] = parseFloat(((novoLucro / lbPrev - 1) * 100).toFixed(2));
  }

  lucrosProjetados[idx] = novoLucro;
  lucrosManuais[idx] = true;
}

function updLucroBlur(el) {
  updLucro(el);
  recalc();
}

function chgP(d) {
  perpRate = Math.max(0.5, Math.min(20, +(perpRate + d).toFixed(1)));
  recalc();
}

// ─── SALVAR ──────────────────────────────────────────────────────────────────
function salvar() {
  const ticker = document.getElementById('empresa-nome').value.trim().toUpperCase();
  if (!ticker) {
    alert('Informe o ticker da empresa antes de salvar.');
    return;
  }
  const viTxt = document.getElementById('s-intrinseco').textContent;
  const viNum = parseFloat(
    viTxt
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
  );
  if (!viTxt || viTxt === '—' || isNaN(viNum)) {
    alert('Preencha os dados para calcular o valor intrínseco antes de salvar.');
    return;
  }

  const now = new Date();
  const data =
    now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const prTeto = fmtBRL(viNum); // teto = intrínseco
  const entry = {
    ticker,
    precoTeto: prTeto,
    precoTetoNum: viNum,
    intrinseco: viTxt,
    intrinsecNum: viNum,
    precoAtual: document.getElementById('preco-atual').value,
    data,
    // ── premissas ──
    td: parseFloat(document.getElementById('td').value) || 13,

    nAcoes: parseFloat(document.getElementById('n-acoes').value) || 0,
    nTesouraria: parseFloat(document.getElementById('n-tesouraria').value) || 0,
    divida: parseFloat(document.getElementById('divida').value) || 0,
    hist: [...hrv],
    projGrowths: [...projGrowths],
    perpRate,
    projAnos,
  };

  const list = getList();
  const ei = list.findIndex((s) => s.ticker === ticker);
  if (ei >= 0) {
    if (!confirm(`Já existe uma análise de ${ticker}. Substituir?`)) return;
    list[ei] = entry;
  } else {
    list.push(entry);
  }
  setList(list);
  editingTicker = ticker;
  document.getElementById('topbar-mode').textContent = `editando ${ticker}`;
  const btn = document.getElementById('bsave-btn');
  btn.textContent = '✓ Salvo!';
  setTimeout(() => {
    btn.textContent = '⊕ Salvar preço teto';
  }, 2000);
}

// ─── RESET ───────────────────────────────────────────────────────────────────
function resetarSilencioso() {
  document.getElementById('td').value = 13;

  document.getElementById('n-acoes').value = '';
  document.getElementById('n-tesouraria').value = 0;
  document.getElementById('divida').value = 0;
  document.getElementById('preco-atual').value = '';
  document.getElementById('empresa-nome').value = '';
  for (let i = 0; i < 5; i++) {
    hrv[i] = 0;
    const el = document.getElementById('hist' + i);
    if (el) el.value = '';
  }
  projGrowths = [3, 5, 5, 5, 5];
  lucrosProjetados.length = 0;
  lucrosManuais.length = 0;
  perpRate = 3.0;
  projAnos = 5;
  document.getElementById('btn3').classList.remove('active');
  document.getElementById('btn5').classList.add('active');
  recalc();
}
function resetar() {
  if (!confirm('Limpar todos os campos?')) return;
  resetarSilencioso();
}

// ─── INIT ────────────────────────────────────────────────────────────────────
buildHistInputs();
recalc();
irParaDashboard();

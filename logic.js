// Tabbed logic gate view: top sub-nav switches the active gate. The right pane shows the truth table.
(function () {
  const { list, evaluate, truthTable } = window.LogicGates;

  function gateBannerSrc(key) {
    const upper = String(key).toUpperCase();
    const lower = String(key).toLowerCase();
    return `images/${upper}.png`;
  }

  function buildTruthTable(key) {
    const { meta, rows } = truthTable(key);
    const wrap = document.createElement('div');
    wrap.className = 'info-box';
    const h = document.createElement('h3'); h.textContent = `${meta.label} – Truth table`; wrap.appendChild(h);
    const table = document.createElement('table'); table.className = 'truth-table';
    const thead = document.createElement('thead'); const trh = document.createElement('tr');
    const headers = meta.arity === 2 ? ['A','B','Out'] : ['A','Out'];
    headers.forEach(t => { const th = document.createElement('th'); th.textContent = t; trh.appendChild(th); });
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const r of rows) {
      const tr = document.createElement('tr');
      const tdA = document.createElement('td'); tdA.textContent = r.A ? '1' : '0'; tr.appendChild(tdA);
      if (meta.arity === 2) { const tdB = document.createElement('td'); tdB.textContent = r.B ? '1' : '0'; tr.appendChild(tdB); }
      const tdO = document.createElement('td'); tdO.textContent = r.OUT ? '1' : '0'; tdO.className = r.OUT ? 'true' : 'false'; tr.appendChild(tdO);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody); wrap.appendChild(table);
    return wrap;
  }

  function buildGatePanel(gate) {
    const left = document.createElement('div');
    const info = document.createElement('div'); info.className = 'info-box';
    const banner = document.createElement('img');
    banner.src = gateBannerSrc(gate.key);
    banner.alt = `${gate.key} gate`;
    banner.style.width = '100%';
    banner.style.maxHeight = '200px';
    banner.style.objectFit = 'contain';
    banner.style.background = 'rgba(255,255,255,0.02)';
    banner.style.border = '1px solid var(--outline)';
    banner.style.borderRadius = '10px';
    banner.style.padding = '6px';
    banner.style.marginBottom = '10px';

    const title = document.createElement('h3'); title.textContent = gate.label;
    const desc = document.createElement('p'); desc.className = 'output-desc'; desc.style.textAlign = 'left'; desc.textContent = gate.desc;

    // Controls
    const inputsRow = document.createElement('div'); inputsRow.style.display = 'flex'; inputsRow.style.gap = '12px'; inputsRow.style.alignItems = 'center';
    const outputsRow = document.createElement('div'); outputsRow.style.marginTop = '10px';
    const makeSwitch = (labelText) => {
      const group = document.createElement('div'); group.className = 'input-group';
      const label = document.createElement('span'); label.className = 'switch-label'; label.textContent = labelText;
      const wrapper = document.createElement('label'); wrapper.className = 'switch';
      const input = document.createElement('input'); input.type = 'checkbox';
      const slider = document.createElement('span'); slider.className = 'slider';
      wrapper.appendChild(input); wrapper.appendChild(slider);
      group.appendChild(label); group.appendChild(wrapper);
      return { group, input };
    };
    const a = makeSwitch('A'); inputsRow.appendChild(a.group);
    let b; if (gate.arity === 2) { b = makeSwitch('B'); inputsRow.appendChild(b.group); }
    const out = document.createElement('div'); out.className = 'output-indicator'; out.textContent = 'Output: FALSE'; outputsRow.appendChild(out);
    function render() {
      const val = evaluate(gate.key, a.input.checked, b ? b.input.checked : false);
      out.textContent = `Output: ${val ? 'TRUE' : 'FALSE'}`;
      out.classList.toggle('true', !!val); out.classList.toggle('false', !val);
      out.classList.add('bump'); setTimeout(() => out.classList.remove('bump'), 300);
    }
    a.input.addEventListener('input', render); if (b) b.input.addEventListener('input', render); render();

    info.appendChild(banner); info.appendChild(title); info.appendChild(desc); info.appendChild(inputsRow); info.appendChild(outputsRow);
    left.appendChild(info);
    return left;
  }

  function renderActiveGate(key) {
    const area = document.getElementById('activeGate');
    if (!area) return;
    area.innerHTML = '';
    area.style.opacity = '0';
    area.style.transition = 'opacity 200ms ease';
    const gate = list.find(g => g.key.toUpperCase() === key.toUpperCase());
    if (!gate) return;
    const left = buildGatePanel(gate);
    const right = buildTruthTable(gate.key);
    area.appendChild(left);
    area.appendChild(right);
    requestAnimationFrame(() => { area.style.opacity = '1'; });
  }

  function initTabs() {
    const nav = document.querySelectorAll('.sub-nav a[data-gate]');
    nav.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const key = a.getAttribute('data-gate');
        renderActiveGate(key);
        nav.forEach(n => n.classList.remove('active'));
        a.classList.add('active');
      });
    });
    // Default to AND
    const first = document.querySelector('.sub-nav a[data-gate="AND"]');
    if (first) first.click(); else renderActiveGate('AND');
  }

  document.addEventListener('DOMContentLoaded', initTabs);
})();

// Adders simulations and tables
(function () {
  // Toggle visibility between sections (#ha, #fa, #rca, #cla)
  function showOnly(id) {
    ['ha','fa','rca','cla'].forEach(secId => {
      const sec = document.querySelector(`section.card[aria-labelledby="${secId}"]`);
      if (sec) sec.style.display = (secId === id ? '' : 'none');
    });
  }

  function layoutSimWithImage(sectionId, simId) {
    const section = document.querySelector(`section.card[aria-labelledby="${sectionId}"]`);
    if (!section) return;
    // Find first image and first info-box in section
    const img = section.querySelector('img.adder-banner');
    const info = section.querySelector('.info-box');
    const sim = document.getElementById(simId);
    if (!sim) return;
    // Create a container for split view
    const container = document.createElement('div');
    container.className = 'adder-view';
    const left = document.createElement('div');
    const right = document.createElement('div');
    // Move sim to left, image to right
    left.appendChild(sim);
    if (img) right.appendChild(img);
    container.appendChild(left); container.appendChild(right);
    // Place info (explanation) on top, then split container
    // Remove existing positions and append in order
    if (info) { section.appendChild(info); }
    section.appendChild(container);
  }
  function makeSwitch(labelText) {
    const group = document.createElement('div');
    group.className = 'input-group';
    const label = document.createElement('span');
    label.className = 'switch-label';
    label.textContent = labelText;
    const wrapper = document.createElement('label');
    wrapper.className = 'switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    const slider = document.createElement('span');
    slider.className = 'slider';
    wrapper.appendChild(input);
    wrapper.appendChild(slider);
    group.appendChild(label);
    group.appendChild(wrapper);
    return { group, input };
  }

  function buildHACard() {
    const wrap = document.getElementById('ha-sim');
    // Inputs row (same line)
    const inputsRow = document.createElement('div');
    inputsRow.style.display = 'flex';
    inputsRow.style.gap = '12px';
    inputsRow.style.alignItems = 'center';
    const a = makeSwitch('A');
    const b = makeSwitch('B');
    inputsRow.appendChild(a.group);
    inputsRow.appendChild(b.group);
    // Outputs row (next line)
    const outputsRow = document.createElement('div');
    outputsRow.style.display = 'grid';
    outputsRow.style.gridTemplateColumns = '1fr 1fr';
    outputsRow.style.gap = '12px';
    const sum = document.createElement('div'); sum.className = 'output-indicator';
    const carry = document.createElement('div'); carry.className = 'output-indicator';
    outputsRow.appendChild(sum); outputsRow.appendChild(carry);
    wrap.appendChild(inputsRow); wrap.appendChild(outputsRow);
    function render() {
      const A = a.input.checked, B = b.input.checked;
      const S = (A ^ B) === 1 || (A !== B);
      const C = A && B;
      sum.textContent = `Sum: ${S ? '1' : '0'}`; sum.classList.toggle('true', S); sum.classList.toggle('false', !S);
      carry.textContent = `Carry: ${C ? '1' : '0'}`; carry.classList.toggle('true', C); carry.classList.toggle('false', !C);
    }
    a.input.addEventListener('input', render);
    b.input.addEventListener('input', render);
    render();

    // Truth table
    const table = document.getElementById('ha-table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    ['A','B','Sum','Carry'].forEach(h => { const th = document.createElement('th'); th.textContent = h; trh.appendChild(th); });
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const A of [0,1]) for (const B of [0,1]) {
      const S = (A ^ B) & 1; const C = (A & B) & 1;
      const tr = document.createElement('tr');
      [A,B,S,C].forEach((v,i) => { const td = document.createElement('td'); td.textContent = String(v); if (i>=2) td.className = v ? 'true' : 'false'; tr.appendChild(td); });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  }

  function buildFACard() {
    const wrap = document.getElementById('fa-sim');
    // Inputs row (same line)
    const inputsRow = document.createElement('div');
    inputsRow.style.display = 'flex';
    inputsRow.style.gap = '12px';
    inputsRow.style.alignItems = 'center';
    const a = makeSwitch('A');
    const b = makeSwitch('B');
    const cin = makeSwitch('Cin');
    inputsRow.appendChild(a.group); inputsRow.appendChild(b.group); inputsRow.appendChild(cin.group);
    // Outputs row (next line)
    const outputsRow = document.createElement('div');
    outputsRow.style.display = 'grid';
    outputsRow.style.gridTemplateColumns = '1fr 1fr';
    outputsRow.style.gap = '12px';
    const sum = document.createElement('div'); sum.className = 'output-indicator';
    const cout = document.createElement('div'); cout.className = 'output-indicator';
    outputsRow.appendChild(sum); outputsRow.appendChild(cout);
    wrap.appendChild(inputsRow); wrap.appendChild(outputsRow);
    function render() {
      const A = +a.input.checked, B = +b.input.checked, C = +cin.input.checked;
      const S = (A ^ B ^ C) & 1;
      const Co = ((A & B) | (C & (A ^ B))) & 1;
      sum.textContent = `Sum: ${S}`; sum.classList.toggle('true', !!S); sum.classList.toggle('false', !S);
      cout.textContent = `Cout: ${Co}`; cout.classList.toggle('true', !!Co); cout.classList.toggle('false', !Co);
    }
    a.input.addEventListener('input', render);
    b.input.addEventListener('input', render);
    cin.input.addEventListener('input', render);
    render();

    // Truth table
    const table = document.getElementById('fa-table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    ['A','B','Cin','Sum','Cout'].forEach(h => { const th = document.createElement('th'); th.textContent = h; trh.appendChild(th); });
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const A of [0,1]) for (const B of [0,1]) for (const C of [0,1]) {
      const S = (A ^ B ^ C) & 1; const Co = ((A & B) | (C & (A ^ B))) & 1;
      const tr = document.createElement('tr');
      [A,B,C,S,Co].forEach((v,i) => { const td = document.createElement('td'); td.textContent = String(v); if (i>=3) td.className = v ? 'true' : 'false'; tr.appendChild(td); });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  }

  function buildRCA() {
    const mount = document.getElementById('rca-sim');
    // Simple 4-bit RCA calculator: inputs A and B (4-bit), Cin
    const box = document.createElement('div');
    box.className = 'info-box';
    const row = document.createElement('div');
    row.style.display = 'grid'; row.style.gridTemplateColumns = '1fr 1fr 1fr'; row.style.gap = '12px';
    const a = document.createElement('input'); a.className='diagram-input'; a.placeholder='A (4-bit, e.g. 1011)';
    const b = document.createElement('input'); b.className='diagram-input'; b.placeholder='B (4-bit, e.g. 0101)';
    const cinWrap = makeSwitch('Cin');
    row.appendChild(a); row.appendChild(b); row.appendChild(cinWrap.group);
    const out = document.createElement('div'); out.className='output-indicator'; out.style.marginTop='10px';
    box.appendChild(row); box.appendChild(out); mount.appendChild(box);
    function render() {
      const A = (a.value || '0').replace(/[^01]/g,'');
      const B = (b.value || '0').replace(/[^01]/g,'');
      const C0 = cinWrap.input.checked ? 1 : 0;
      // ripple add bit by bit (LSB right)
      const as = A.split('').reverse();
      const bs = B.split('').reverse();
      const n = Math.max(as.length, bs.length);
      let carry = C0; let sum = '';
      for (let i=0;i<n;i++){
        const ai = +(as[i]||'0'); const bi = +(bs[i]||'0');
        const s = ai ^ bi ^ carry;
        const co = (ai & bi) | (carry & (ai ^ bi));
        sum = String(s) + sum; carry = co;
      }
      if (carry) sum = '1' + sum;
      out.textContent = `Sum: ${sum}`;
      out.classList.toggle('true', true);
    }
    a.addEventListener('input', render);
    b.addEventListener('input', render);
    cinWrap.input.addEventListener('input', render);
    a.value='1011'; b.value='0101'; render();
  }

  function init(){
    buildHACard();
    buildFACard();
    buildRCA();
    // Apply layout: explanation top, sim left, image right
    layoutSimWithImage('ha', 'ha-sim');
    layoutSimWithImage('fa', 'fa-sim');
    // Show only Half Adder by default
    showOnly('ha');
    // Wire sub-nav to toggle
    document.querySelectorAll('header .sub-nav a').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        const id = href.replace('#','');
        showOnly(id);
      });
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

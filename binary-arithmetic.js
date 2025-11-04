// Binary arithmetic calculators using BigInt
(function () {
  // Tab handling: show only one main section
  function showTab(id) {
    const ids = ['teach','calculator','restoring','non','bitpair','booth'];
    ids.forEach(k => {
      const sec = document.getElementById(k);
      if (sec) sec.style.display = (k === id ? '' : 'none');
    });
  }
  const mount = document.getElementById('calc-grid');
  // Helper engine container per operation id
  function helperBox(id) {
    const box = document.createElement('div');
    box.className = 'dynamic-helper';
    box.id = id;
    return box;
  }

  function row(label, aId, bId, outId, opLabel, onCompute) {
    const box = document.createElement('div');
    box.className = 'info-box';
    const title = document.createElement('h3'); title.textContent = label; title.style.marginTop='0';
    const grid = document.createElement('div');
    grid.style.display='grid'; grid.style.gridTemplateColumns='1fr 1fr auto'; grid.style.gap='10px';
    const a = document.createElement('input'); a.className='diagram-input'; a.placeholder='A (binary e.g. 1011)'; a.id = aId;
    const b = document.createElement('input'); b.className='diagram-input'; b.placeholder='B (binary)'; b.id = bId;
    const btn = document.createElement('button'); btn.className='button-link'; btn.textContent = opLabel;
    const out = document.createElement('div'); out.className='output-indicator'; out.id = outId; out.style.marginTop='10px';
    const helper = helperBox(`${outId}-helper`);
    grid.appendChild(a); grid.appendChild(b); grid.appendChild(btn);
    box.appendChild(title); box.appendChild(grid); box.appendChild(out); box.appendChild(helper);
    btn.addEventListener('click', () => onCompute(a, b, out));
    mount.appendChild(box);
    return { a, b, out, helper };
  }

  function toBigInt(binStr) {
    const s = (binStr || '').replace(/[^01]/g, '');
    if (!s) return 0n;
    return BigInt('0b' + s);
  }
  function fromBigInt(n) { return n.toString(2); }
  function toBin(n, width) { const mask = (1n << BigInt(width)) - 1n; return (n & mask).toString(2).padStart(width, '0'); }
  function parseBin(str) { const s = (str || '').replace(/[^01]/g,''); return s ? BigInt('0b'+s) : 0n; }

  // Add
  const rAdd = row('Addition', 'addA', 'addB', 'addOut', 'Add', (a, b, out) => {
    const A = toBigInt(a.value), B = toBigInt(b.value);
    const S = A + B;
    out.textContent = `A + B = ${fromBigInt(S)}`; out.classList.add('true');
  });
  // Addition helper when clicking button
  (function attachAddHelper(){
    const btn = document.querySelector('#addOut') ? null : null; // unused
  })();

  // Sub
  const rSub = row('Subtraction', 'subA', 'subB', 'subOut', 'Subtract', (a, b, out) => {
    let A = toBigInt(a.value), B = toBigInt(b.value);
    let sign = '';
    if (A < B) { sign = '-'; const T = A; A = B; B = T; }
    const D = A - B;
    out.textContent = `A − B = ${sign}${fromBigInt(D)}`; out.classList.add('true');
  });

  // Mul
  const rMul = row('Multiplication', 'mulA', 'mulB', 'mulOut', 'Multiply', (a, b, out) => {
    const A = toBigInt(a.value), B = toBigInt(b.value);
    const P = A * B;
    out.textContent = `A × B = ${fromBigInt(P)}`; out.classList.add('true');
  });

  // Div
  const rDiv = row('Division (quotient and remainder)', 'divA', 'divB', 'divOut', 'Divide', (a, b, out) => {
    const A = toBigInt(a.value), B = toBigInt(b.value || '1');
    if (B === 0n) { out.textContent = 'Division by zero'; out.classList.remove('true'); out.classList.add('false'); return; }
    const Q = A / B; const R = A % B;
    out.textContent = `A ÷ B = Q: ${fromBigInt(Q)}, R: ${fromBigInt(R)}`; out.classList.add('true');
  });

  // Helper engine functions for ASCII step layout
  function padLeft(str, len) { str = String(str); return ' '.repeat(Math.max(0, len - str.length)) + str; }
  function addSteps(a, b) {
    const A = (a || '').replace(/[^01]/g, '');
    const B = (b || '').replace(/[^01]/g, '');
    if (!A || !B) return 'Enter A and B to show steps.';
    const n = Math.max(A.length, B.length);
    const aa = A.padStart(n, '0'); const bb = B.padStart(n, '0');
    let carry = 0; let why = '';
    let out = `  ${aa}\n+ ${bb}\n${'-'.repeat(n+2)}\n`;
    let res = '';
    for (let i = n-1; i >= 0; i--) {
      const aBit = +aa[i], bBit = +bb[i]; const sum = aBit + bBit + carry; const bit = sum & 1; const c = sum >> 1;
      why += `• ${aBit}+${bBit}${carry?`+carry(1)`:''} = ${bit} ${c?`carry 1`:''}\n`;
      res = String(bit) + res; carry = c;
    }
    if (carry) { res = '1' + res; }
    out += `  ${res}\n\n---\n` + 'Why Explanation:\n' + why;
    return out;
  }
  function subSteps(a, b) {
    const A = (a || '').replace(/[^01]/g, '');
    const B = (b || '').replace(/[^01]/g, '');
    if (!A || !B) return 'Enter A and B to show steps.';
    const n = Math.max(A.length, B.length);
    let aa = A.padStart(n, '0'); let bb = B.padStart(n, '0');
    // assume A >= B by swapping on display purpose only
    if (parseInt(aa,2) < parseInt(bb,2)) { const t = aa; aa = bb; bb = t; }
    let borrow = 0; let res = ''; let why='';
    for (let i = n-1; i >=0; i--) {
      let aBit = +aa[i] - borrow; const bBit = +bb[i];
      if (aBit < bBit) { aBit += 2; borrow = 1; why += `• Need borrow at pos ${i}: (a+2) − b\n`; }
      else { borrow = 0; }
      const diff = aBit - bBit; res = String(diff) + res; why += `  ${aBit} − ${bBit} = ${diff}${borrow?' (borrow set)':''}\n`;
    }
    const header = `  ${aa}\n- ${bb}\n${'-'.repeat(n+2)}\n`;
    return header + `  ${res}\n\n---\nWhy Explanation:\n` + why;
  }
  function mulSteps(a, b) {
    const A = (a || '').replace(/[^01]/g, '');
    const B = (b || '').replace(/[^01]/g, '');
    if (!A || !B) return 'Enter A and B to show steps.';
    const parts = [];
    for (let i = B.length - 1; i >= 0; i--) {
      const bit = +B[i]; const part = bit ? A + '0'.repeat(B.length - 1 - i) : '0'.repeat(A.length + (B.length - 1 - i));
      parts.push(part);
    }
    let why = parts.map((p, idx)=>`• Partial product ${parts.length-idx}: ${p}`).join('\n');
    const res = parts.reduce((acc, p) => BigInt('0b'+acc) + BigInt('0b'+p), 0n).toString(2);
    const header = `  ${A}\n× ${B}\n${'-'.repeat(Math.max(A.length,B.length)+2)}\n`;
    const body = parts.map((p,i)=>' '.repeat(i) + p).join('\n');
    return header + body + `\n= ${res}\n\n---\nWhy Explanation:\n` + why;
  }
  function divSteps(a, b) {
    const A = (a || '').replace(/[^01]/g, '');
    const B = (b || '').replace(/[^01]/g, '');
    if (!A || !B) return 'Enter A and B to show steps.';
    const dividend = BigInt('0b'+A), divisor = BigInt('0b'+B);
    if (divisor === 0n) return 'Division by zero';
    let R = 0n; let Q = dividend; const D = divisor; let why=''; let steps='';
    const n = A.length;
    for (let i = n-1; i >=0; i--) {
      // Shift left R and bring next Q bit
      const qBit = (Q >> BigInt(i)) & 1n;
      R = (R << 1n) | qBit;
      steps += `Shift: R=${R.toString(2)}\n`;
      R = R - D; steps += `Subtract D: R=${R.toString(2)}\n`;
      if (R < 0) { R = R + D; steps += `Restore: R=${R.toString(2)} (bit=0)\n`; why += `• Negative remainder → restore, set bit 0\n`; }
      else { steps += `Keep: R=${R.toString(2)} (bit=1)\n`; why += `• Non-negative remainder → set bit 1\n`; }
    }
    const qStr = (dividend / D).toString(2), rStr = (dividend % D).toString(2);
    return `Restoring Division (A/B)\n${steps}\nQ=${qStr}, R=${rStr}\n\n---\nWhy Explanation:\n` + why;
  }

  // Wire helpers to buttons
  function attachDynamic(btnText, helperEl, makeText, getA, getB) {
    const btn = helperEl.parentElement.querySelector('button.button-link');
    if (btn) {
      btn.addEventListener('click', () => {
        const txt = makeText(getA().value, getB().value);
        // split why
        const parts = txt.split('\n---\n');
        helperEl.textContent = parts[0];
        const whyDiv = document.createElement('div'); whyDiv.className = 'why'; whyDiv.textContent = parts[1] || '';
        helperEl.appendChild(whyDiv);
      });
    }
  }

  attachDynamic('Add', rAdd.helper, addSteps, () => document.getElementById('addA'), () => document.getElementById('addB'));
  attachDynamic('Subtract', rSub.helper, subSteps, () => document.getElementById('subA'), () => document.getElementById('subB'));
  attachDynamic('Multiply', rMul.helper, mulSteps, () => document.getElementById('mulA'), () => document.getElementById('mulB'));
  attachDynamic('Divide', rDiv.helper, divSteps, () => document.getElementById('divA'), () => document.getElementById('divB'));

  // Teach section setup (3-step like Number System)
  function initTeach() {
    const box = document.getElementById('baTeachBox');
    const aEl = document.getElementById('baA');
    const bEl = document.getElementById('baB');
    const opEl = document.getElementById('baOp');
    const prev = document.getElementById('baPrev');
    const next = document.getElementById('baNext');
    const counter = document.getElementById('baStepCount');
    if (!box || !aEl || !bEl || !opEl || !prev || !next || !counter) return;

    let steps = ['','',''];
    let idx = 0;

    function buildSteps() {
      const A = (aEl.value || '').replace(/[^01]/g,'');
      const B = (bEl.value || '').replace(/[^01]/g,'');
      const op = opEl.value;
      const mapper = { add: addSteps, sub: subSteps, mul: mulSteps, div: divSteps };
      const gen = mapper[op] || addSteps;
      const full = gen(A, B) || '';
      const parts = full.split('\n---\n');
      const body = parts[0] || '';
      const why = (parts[1] || '').replace(/^Why Explanation:\n?/, '');
      const lines = body.split('\n');
      let setup = lines.join('\n');
      let result = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line) { result = line; setup = lines.slice(0, i).join('\n'); break; }
      }
      steps = [setup, result ? `Result: ${result.replace(/^=\s*/,'')}` : 'Result: —', why ? ('Explanation:\n' + why) : 'Explanation: —'];
      idx = 0; render();
    }

    function render(){
      box.textContent = steps[idx] || '';
      counter.textContent = `Step ${idx+1} of ${steps.length}`;
      prev.disabled = idx === 0; next.disabled = idx >= steps.length - 1;
    }

    prev.addEventListener('click', () => { if (idx>0) { idx--; render(); } });
    next.addEventListener('click', () => { if (idx<steps.length-1) { idx++; render(); } });
    aEl.addEventListener('input', buildSteps);
    bEl.addEventListener('input', buildSteps);
    opEl.addEventListener('change', buildSteps);

    aEl.value = '1'; bEl.value = '0'; opEl.value = 'add'; buildSteps();

    // Algorithm teaches within same init (Restoring, Non-restoring, Bit-pair, Booth)
    const headerKV = (k,v) => `${k}: ${v}`;
    const outLine = (acc,q,op,extra) => `${acc}    ${q}${q!==''?'    ':''}${op}${extra?('  '+extra):''}`;

    // Restoring division
    const resBtn = document.getElementById('resTeachBtn');
    const resOut = document.getElementById('resTeachOut');
    if (resBtn && resOut) {
      resBtn.addEventListener('click', () => {
        const Qs = (document.getElementById('resQ').value||'').replace(/[^01]/g,'');
        const Ms = (document.getElementById('resM').value||'').replace(/[^01]/g,'');
        const bits = parseInt(document.getElementById('resBits').value||'8',10)||8;
        let Q = parseBin(Qs), M = parseBin(Ms), R = 0n;
        const lines = [];
        lines.push(headerKV('Q', toBin(Q, bits)) + '   ' + headerKV('M', toBin(M, bits)));
        lines.push('Accumulator (R)    Q    Operation');
        for (let i=0;i<bits;i++){
          // shift left [R,Q]
          const msbQ = (Q >> BigInt(bits-1)) & 1n;
          R = ((R << 1n) | msbQ) & ((1n<<BigInt(bits)) - 1n);
          Q = (Q << 1n) & ((1n<<BigInt(bits)) - 1n);
          lines.push(outLine(toBin(R,bits), toBin(Q,bits), 'Shift left'));
          // subtract M
          R = R - M;
          if (R < 0) { R = R + M; lines.push(outLine(toBin(R,bits), toBin(Q,bits), 'Restore (neg)')); }
          else { Q = Q | 1n; lines.push(outLine(toBin(R,bits), toBin(Q,bits), 'Set Q0=1')); }
        }
        lines.push('Final: Q=' + toBin(Q,bits) + ', R=' + toBin(R,bits));
        resOut.textContent = lines.join('\n');
      });
    }

    // Non-restoring division
    const nonBtn = document.getElementById('nonTeachBtn');
    const nonOut = document.getElementById('nonTeachOut');
    if (nonBtn && nonOut) {
      nonBtn.addEventListener('click', () => {
        const Qs = (document.getElementById('nonQ').value||'').replace(/[^01]/g,'');
        const Ms = (document.getElementById('nonM').value||'').replace(/[^01]/g,'');
        const bits = parseInt(document.getElementById('nonBits').value||'8',10)||8;
        let Q = parseBin(Qs), M = parseBin(Ms), R = 0n;
        const mask = (1n<<BigInt(bits)) - 1n;
        const lines = [];
        lines.push(headerKV('Q', toBin(Q, bits)) + '   ' + headerKV('M', toBin(M, bits)) + '   ' + headerKV('-M', toBin(((-M)&mask), bits)));
        lines.push('Accumulator (R)    Q    Operation');
        for (let i=0;i<bits;i++){
          if (R >= 0) { R = R - M; lines.push(outLine(toBin(R,bits), toBin(Q,bits), 'R>=0 → R=R-M')); }
          else { R = R + M; lines.push(outLine(toBin(R,bits), toBin(Q,bits), 'R<0 → R=R+M')); }
          const msbQ = (Q >> BigInt(bits-1)) & 1n;
          Q = (Q << 1n) & mask; R = ((R << 1n) | msbQ) & mask;
          if (R >= 0) { Q = Q | 1n; lines.push(outLine(toBin(R,bits), toBin(Q,bits), 'Set Q0=1 (R>=0)')); }
          else { lines.push(outLine(toBin(R,bits), toBin(Q,bits), 'Set Q0=0 (R<0)')); }
        }
        if (R < 0) { R = R + M; lines.push('Correction: R=R+M → ' + toBin(R, bits)); }
        lines.push('Final: Q=' + toBin(Q,bits) + ', R=' + toBin(R,bits));
        nonOut.textContent = lines.join('\n');
      });
    }

    // Booth multiplication
    const boothBtn = document.getElementById('boothTeachBtn');
    const boothOut = document.getElementById('boothTeachOut');
    if (boothBtn && boothOut) {
      boothBtn.addEventListener('click', () => {
        const Ms = (document.getElementById('boothM').value||'').replace(/[^01]/g,'');
        const Qs = (document.getElementById('boothQ').value||'').replace(/[^01]/g,'');
        const bits = parseInt(document.getElementById('boothBits').value||'8',10)||8;
        let A = 0n, M = parseBin(Ms), Q = parseBin(Qs), Qm1 = 0n;
        const mask = (1n<<BigInt(bits)) - 1n;
        const lines = [];
        lines.push(headerKV('M', toBin(M, bits)) + '   ' + headerKV('-M', toBin(((-M)&mask), bits)) + '   ' + headerKV('Q', toBin(Q,bits)));
        lines.push('Accumulator (A)    Q    Q-1    Operation');
        for (let i=0;i<bits;i++){
          const q0 = Q & 1n;
          if (q0 === 1n && Qm1 === 0n) { A = (A - M) & mask; lines.push(outLine(toBin(A,bits), toBin(Q,bits), 'A=A-M', 'Q-1='+Qm1)); }
          else if (q0 === 0n && Qm1 === 1n) { A = (A + M) & mask; lines.push(outLine(toBin(A,bits), toBin(Q,bits), 'A=A+M', 'Q-1='+Qm1)); }
          else { lines.push(outLine(toBin(A,bits), toBin(Q,bits), 'A unchanged', 'Q-1='+Qm1)); }
          const newQm1 = Q & 1n;
          const signA = (A >> BigInt(bits-1)) & 1n;
          Q = ((A & 1n) << BigInt(bits-1)) | (Q >> 1n);
          A = ((signA << BigInt(bits-1)) | (A >> 1n)) & mask;
          Qm1 = newQm1;
          lines.push(outLine(toBin(A,bits), toBin(Q,bits), 'ASR', 'Q-1='+Qm1));
        }
        const product = toBin(A,bits) + toBin(Q,bits);
        lines.push('Final: Product = ' + product);
        boothOut.textContent = lines.join('\n');
      });
    }

    // Bit-pair (illustrative)
    const bpBtn = document.getElementById('bpTeachBtn');
    const bpOut = document.getElementById('bpTeachOut');
    if (bpBtn && bpOut) {
      bpBtn.addEventListener('click', () => {
        const Ms = (document.getElementById('bpM').value||'').replace(/[^01]/g,'');
        const Qs = (document.getElementById('bpQ').value||'').replace(/[^01]/g,'');
        const bits = parseInt(document.getElementById('bpBits').value||'8',10)||8;
        const M = parseBin(Ms); const Q = parseBin(Qs);
        const qStr = toBin(Q,bits) + '0';
        const mask = (1n<<BigInt(bits*2)) - 1n;
        let acc = 0n; const lines = [];
        lines.push(headerKV('M', toBin(M,bits)) + '   ' + headerKV('Q', toBin(Q,bits)));
        lines.push('Accumulator      Operation');
        for (let i=0;i<bits;i++){
          const pair = qStr.slice(bits-i-1, bits-i+1);
          let d = 0; if (pair==='01') d=1; else if (pair==='10') d=-1; else d=0;
          if (d===0) { lines.push(outLine(toBin(acc,bits*2), '', `digit ${pair} → 0`)); continue; }
          let term = (M << BigInt(i)); let op = d>0? '+M' : '-M';
          if (d<0) acc = (acc - term) & mask; else acc = (acc + term) & mask;
          lines.push(outLine(toBin(acc,bits*2), '', `digit ${pair} → ${op}<<${i}`));
        }
        lines.push('Final: Product ≈ ' + toBin(acc,bits*2));
        bpOut.textContent = lines.join('\n');
      });
    }
  }

  // Wire top sub-nav
  function initTabs(){
    document.querySelectorAll('header .sub-nav a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = (a.getAttribute('href')||'').replace('#','');
        showTab(id);
      });
    });
    showTab('teach');
  }

  // initialize tabs and teach after calculators mount
  document.addEventListener('DOMContentLoaded', () => {
    initTeach();
    initTabs();
  });
})();

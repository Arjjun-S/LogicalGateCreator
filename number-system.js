// Number system converter with fractional support (up to precision digits)
(function () {
  const el = (id) => document.getElementById(id);
  const $bin = el('bin');
  const $oct = el('oct');
  const $dec = el('dec');
  const $hex = el('hex');
  // Teach elements (dynamic helper)
  const $dyn = el('ns-dynamic');
  const $teachInput = el('teachInput');
  const $teachTitle = el('teachTitle');
  const $nsConv = el('nsConv');
  const $nsPrev = el('nsPrev');
  const $nsNext = el('nsNext');
  const $nsStepCount = el('nsStepCount');

  const PREC = 12; // fractional digits

  function sanitize(str, base) {
    if (!str) return '';
    str = String(str).toUpperCase();
    // Keep [0-9A-F] and one dot
    let out = '';
    let dot = false;
    for (const ch of str) {
      if (ch === '.' && !dot) { out += ch; dot = true; continue; }
      const v = '0123456789ABCDEF'.indexOf(ch);
      if (v >= 0 && v < base) out += ch;
    }
    return out;
  }

  function charVal(ch) { return '0123456789ABCDEF'.indexOf(ch); }
  function valChar(v) { return '0123456789ABCDEF'[v]; }

  // Parse string in base -> decimal number as JS number (may lose precision for huge ints)
  function toDecimal(str, base) {
    if (!str) return 0;
    str = str.toUpperCase();
    const parts = str.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';

    let intVal = 0;
    for (const ch of intPart) {
      intVal = intVal * base + charVal(ch);
    }
    let fracVal = 0;
    let denom = base;
    for (const ch of fracPart) {
      fracVal += charVal(ch) / denom;
      denom *= base;
    }
    return intVal + fracVal;
  }

  function fromDecimal(dec, base, precision = PREC) {
    if (!isFinite(dec)) return '';
    const sign = dec < 0 ? '-' : '';
    dec = Math.abs(dec);
    const intPart = Math.floor(dec);
    let frac = dec - intPart;

    // int conversion
    let intDigits = [];
    let n = intPart;
    if (n === 0) intDigits.push('0');
    while (n > 0) {
      const r = n % base;
      intDigits.push(valChar(r));
      n = Math.floor(n / base);
    }
    intDigits.reverse();

    // frac conversion
    let fracDigits = [];
    let count = 0;
    while (frac > 0 && count < precision) {
      frac *= base;
      const d = Math.floor(frac);
      fracDigits.push(valChar(d));
      frac -= d;
      count++;
    }
    return sign + intDigits.join('') + (fracDigits.length ? '.' + fracDigits.join('') : '');
  }

  function updateFrom(source) {
    // Determine which field changed and update others
    const b = sanitize($bin.value, 2);
    const o = sanitize($oct.value, 8);
    const d = sanitize($dec.value.replace(/[^0-9.\-]/g, ''), 10);
    const h = sanitize($hex.value, 16);

    let dec;
    if (source === 'bin') dec = toDecimal(b, 2);
    else if (source === 'oct') dec = toDecimal(o, 8);
    else if (source === 'hex') dec = toDecimal(h, 16);
    else dec = parseFloat(d || '0');

    if (source !== 'bin') $bin.value = fromDecimal(dec, 2);
    if (source !== 'oct') $oct.value = fromDecimal(dec, 8);
    if (source !== 'dec') $dec.value = fromDecimal(dec, 10);
    if (source !== 'hex') $hex.value = fromDecimal(dec, 16);
  }

  $bin.addEventListener('input', () => updateFrom('bin'));
  $oct.addEventListener('input', () => updateFrom('oct'));
  $dec.addEventListener('input', () => updateFrom('dec'));
  $hex.addEventListener('input', () => updateFrom('hex'));

  // seed example
  $dec.value = '11.25';
  updateFrom('dec');

  // Removed legacy static steps; we now generate steps dynamically per selected conversion

  // teach stepper state
  let tSteps = [];
  let tIdx = 0;
  function renderTeachSteps() {
    const txt = tSteps.length ? tSteps[tIdx] : 'Select a conversion and enter a value.';
    $dyn.textContent = txt;
    $nsStepCount.textContent = `Step ${tSteps.length ? tIdx + 1 : 0} of ${tSteps.length || 3}`;
    $nsPrev.disabled = tIdx <= 0; $nsNext.disabled = tIdx >= tSteps.length - 1;
  }

  // Dynamic helper (ASCII) for Decimal <-> Binary
  function asciiDecToBin(decStr) {
    const n = parseFloat((decStr || '').replace(/[^0-9.\-]/g, ''));
    if (!isFinite(n)) return '';
    const abs = Math.abs(n);
    const intPart = Math.floor(abs);
    let s = '';
    let q = intPart;
    const remainders = [];
    if (q === 0) {
      remainders.push(0);
      s += `2|0\n    _\n`;
    } else {
      // header with original number
      s += `2|${q}\n    _\n`;
      while (q > 0) {
        const nq = Math.floor(q / 2);
        const r = q % 2;
        remainders.push(r);
        s += `2|${nq}  -${r}\n    _\n`;
        q = nq;
      }
    }
    // show final 0 line if not already
    if (!s.endsWith('|0\n    _\n')) s += `  |0\n    _\n`;
    const frac = abs - Math.floor(abs);
    let fracSteps = '';
    let f = frac; let count = 0; const fdigs = [];
    while (f > 0 && count < 12) {
      const prod = f * 2; const d = Math.floor(prod); fdigs.push(d);
      const fStr = f.toString(); const pStr = prod.toString();
      fracSteps += `${fStr} x 2 = ${pStr}  -${d}\n`;
      f = prod - d; count++;
    }
  const binInt = remainders.reverse().join('');
  const bin = binInt + (fdigs.length ? '.' + fdigs.join('') : '');
  let why = 'Step Explanation:\n';
    // Recompute explanations
    q = intPart; while (q > 0) { const nq = Math.floor(q/2); const r = q % 2; why += `• Divide ${q} by 2 → quotient ${nq}, remainder ${r}\n`; q = nq; }
    if (intPart === 0) why += '• 0 in binary is 0\n';
    if (fdigs.length) why += fracSteps ? '• Multiply fraction by 2 repeatedly; take integer parts as digits\n' : '';
    // default dec->bin legacy output (not used directly in new 3-step flow)
    return s + `Binary = ${bin}₂\n\n` + '---\n' + why + (fracSteps? ('Fraction steps:\n' + fracSteps):'');
  }
  function asciiBinToDec(binStr) {
    const s = (binStr || '').toString().trim();
    if (!/^[01]+(\.[01]+)?$/.test(s)) return '';
    const [i, f=''] = s.split('.');
    let line = 'Weights (left to right): ' + i.split('').map((_, idx) => `2^${i.length-1-idx}`).join(', ');
    let total = 0;
    let why = 'Step Explanation:\n';
    // integer part
    for (let idx = 0; idx < i.length; idx++) {
      const bit = +i[idx]; const pow = i.length-1-idx; const val = bit * (2 ** pow); total += val; why += `• ${bit} × 2^${pow} = ${val}\n`;
    }
    let fracVal = 0; if (f) { why += '• Fraction part:\n'; }
    for (let idx = 0; idx < f.length; idx++) {
      const bit = +f[idx]; const pow = -(idx+1); const val = bit * (2 ** pow); fracVal += val; why += `  - ${bit} × 2^${pow} = ${val}\n`;
    }
    const sum = total + fracVal;
    return line + `\nValue = ${sum}` + '\n\n---\n' + why;
  }
  function asciiPlaceValueAnyBase(raw, base) {
    // Supports digits 0-9A-F for base up to 16
    const s = (raw || '').toString().trim().toUpperCase();
    const allow = '0123456789ABCDEF'.slice(0, base);
    const clean = s.split('').filter(ch => ch === '.' || allow.includes(ch)).join('');
    const parts = clean.split('.');
    const i = (parts[0] || '0');
    const f = (parts[1] || '');
    const digits = '0123456789ABCDEF';
    // Build visual with pipes
    const joinDigits = (str) => str.split('').join(' ');
    let vis = `  ${joinDigits(i)}${f ? ' . ' + joinDigits(f) : ''}\n`;
    // annotations from left (integer)
    for (let idx = 0; idx < i.length; idx++) {
      const ch = i[idx]; const val = Math.max(0, digits.indexOf(ch));
      const pow = i.length-1-idx; const contrib = val * (base ** pow);
      const leftPad = 2 + (idx*2);
      vis += ' '.repeat(leftPad) + '|' + '_'.repeat(1) + ` ${ch} x ${base}^${pow} = ${contrib}\n`;
    }
    // fraction annotations
    for (let idx = 0; idx < f.length; idx++) {
      const ch = f[idx]; const val = Math.max(0, digits.indexOf(ch));
      const pow = -(idx+1); const contrib = val * (base ** pow);
      const leftPad = 2 + (i.length*2) + 3 + (idx*2);
      vis += ' '.repeat(leftPad) + '|' + '_'.repeat(1) + ` ${ch} x ${base}^${pow} = ${contrib}\n`;
    }
    const dec = toDecimal(clean, base);
    const line2 = ' '.repeat(25) + `___\n` + `Value = ${dec}`;
    let exp = 'Explanation:\n• Multiply each digit by base^position and sum.\n• Positions to the left are non-negative; to the right are negative powers.';
    return { step1: vis, step2: line2, step3: exp };
  }
  function asciiBinaryGrouping(binStr) {
    const s = (binStr || '').replace(/[^01.]/g,''); if (!s) return { step1:'Enter a binary value.', step2:'', step3:'' };
    const [i,f=''] = s.split('.');
    function groupInto(str, g) {
      const pad = (g - (str.length % g)) % g; const padded = '0'.repeat(pad) + str; const groups = [];
      for (let k=0; k<padded.length; k+=g) groups.push(padded.slice(k,k+g));
      return { groups, pad };
    }
    const b2o = { '000':0,'001':1,'010':2,'011':3,'100':4,'101':5,'110':6,'111':7 };
    const b2h = {
      '0000':'0','0001':'1','0010':'2','0011':'3','0100':'4','0101':'5','0110':'6','0111':'7',
      '1000':'8','1001':'9','1010':'A','1011':'B','1100':'C','1101':'D','1110':'E','1111':'F'
    };
    const gi = groupInto(i,3), gf = groupInto(f,3);
    const gi4 = groupInto(i,4), gf4 = groupInto(f,4);
    const oct = gi.groups.map(g=>b2o[g]).join('') + (f?'.':'') + (gf.groups.length?gf.groups.map(g=>b2o[g]).join(''):'');
    const hex = gi4.groups.map(g=>b2h[g]).join('') + (f?'.':'') + (gf4.groups.length?gf4.groups.map(g=>b2h[g]).join(''):'');
    let out = 'Grouping for Octal (3) and Hex (4)\n';
    out += `Octal groups (left): ${gi.pad?'pad '+gi.pad+' zero(s), ':''}${gi.groups.join(' ')}${f?' | Fraction: '+(gf.pad?('pad '+gf.pad+' zero(s), '):'')+gf.groups.join(' '):''}\n`;
    out += `Hex groups (left): ${gi4.pad?'pad '+gi4.pad+' zero(s), ':''}${gi4.groups.join(' ')}${f?' | Fraction: '+(gf4.pad?('pad '+gf4.pad+' zero(s), '):'')+gf4.groups.join(' '):''}\n`;
    const final = `→ Octal: ${oct}\n→ Hex: ${hex}`;
    const exp = 'Explanation:\n• Group from the point. 3 bits → Octal, 4 bits → Hex.\n• Pad with zeros on the left or right if needed.';
    return { step1: out, step2: final, step3: exp };
  }
  function asciiDecToBase(decStr, base, label) {
    const n = parseFloat((decStr || '').replace(/[^0-9.\-]/g, ''));
    if (!isFinite(n)) return { step1: 'Enter a valid decimal number.', step2: '', step3: '' };
    const abs = Math.abs(n);
    const intPart = Math.floor(abs);
    let s = '';
    let q = intPart;
    const remainders = [];
    if (q === 0) { remainders.push(0); s += `${base}|0\n    _\n`; }
    else {
      s += `${base}|${q}\n    _\n`;
      while (q > 0) {
        const nq = Math.floor(q / base);
        const r = q % base;
        remainders.push(r);
        s += `${base}|${nq}  -${r.toString(base).toUpperCase()}\n    _\n`;
        q = nq;
      }
    }
    if (!s.endsWith('|0\n    _\n')) s += `  |0\n    _\n`;
    const frac = abs - Math.floor(abs);
    let fracSteps = '';
    let f = frac; let count = 0; const fdigs = [];
    while (f > 0 && count < 12) {
      const prod = f * base; const d = Math.floor(prod); fdigs.push(d.toString(base).toUpperCase());
      fracSteps += `${f} x ${base} = ${prod}  -${d.toString(base).toUpperCase()}\n`;
      f = prod - d; count++;
    }
    const digits = '0123456789ABCDEF';
    const intDigits = remainders.reverse().map(v=>digits[v]).join('');
    const result = intDigits + (fdigs.length? ('.' + fdigs.join('')) : '');
    const final = `${label} = ${result}`;
    let exp = 'Explanation:\n• Divide integer by base; collect remainders bottom-up.\n• Multiply fraction by base; take integer parts.';
    return { step1: s + (fracSteps? ('\n' + fracSteps): ''), step2: final, step3: exp };
  }
  function buildTeachSteps(){
    const raw = ($teachInput && $teachInput.value || '').trim();
    const conv = ($nsConv && $nsConv.value) || 'dec-bin';
    let res;
    switch (conv) {
      case 'dec-bin': $teachTitle.textContent = 'Conversion: Decimal → Binary'; res = asciiDecToBase(raw, 2, 'Binary'); break;
      case 'dec-oct': $teachTitle.textContent = 'Conversion: Decimal → Octal'; res = asciiDecToBase(raw, 8, 'Octal'); break;
      case 'dec-hex': $teachTitle.textContent = 'Conversion: Decimal → Hex'; res = asciiDecToBase(raw, 16, 'Hex'); break;
      case 'bin-dec': $teachTitle.textContent = 'Conversion: Binary → Decimal (place value)'; res = asciiPlaceValueAnyBase(raw, 2); break;
      case 'oct-dec': $teachTitle.textContent = 'Conversion: Octal → Decimal (place value)'; res = asciiPlaceValueAnyBase(raw, 8); break;
      case 'hex-dec': $teachTitle.textContent = 'Conversion: Hex → Decimal (place value)'; res = asciiPlaceValueAnyBase(raw, 16); break;
      case 'bin-oct': $teachTitle.textContent = 'Conversion: Binary → Octal (group by 3)'; res = asciiBinaryGrouping(raw); break;
      case 'bin-hex': $teachTitle.textContent = 'Conversion: Binary → Hex (group by 4)'; res = asciiBinaryGrouping(raw); break;
      default: res = { step1: 'Select a conversion and enter a value.', step2: '', step3: '' };
    }
    tSteps = [res.step1 || '', res.step2 || '', res.step3 || ''];
    tIdx = 0; renderTeachSteps();
  }
  if ($teachInput) $teachInput.addEventListener('input', buildTeachSteps);
  if ($nsConv) $nsConv.addEventListener('change', buildTeachSteps);
  if ($nsPrev) $nsPrev.addEventListener('click', () => { if (tIdx > 0) { tIdx--; renderTeachSteps(); } });
  if ($nsNext) $nsNext.addEventListener('click', () => { if (tIdx < tSteps.length - 1) { tIdx++; renderTeachSteps(); } });
  // initialize
  if ($teachInput) { $teachInput.value = '924'; }
  buildTeachSteps();
})();

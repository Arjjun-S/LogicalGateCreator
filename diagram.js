// Diagram Creator: parse boolean expressions and render simple logic diagrams (SVG)
// Supported: variables (A..Z), NOT (!), AND (.), OR (+), parentheses
// Grammar (Pratt parser):
//   expr := or
//   or   := and ( '+' and )*
//   and  := unary ( '.' unary )*
//   unary:= '!' unary | primary
//   primary := IDENT | '(' expr ')'

(function () {
  const stage = document.getElementById('stage');
  const exprInput = document.getElementById('expr');
  // New behavior: look for PNG images in the repository `images/` folder.
  // Filenames tried per gate key: e.g. AND.png, and.png
  const savedImages = {}; // map gateKey -> url (relative path)

  // Try to load image file from images/ folder; return Promise that resolves to url or null
  function probeImageForGate(key) {
    const candidates = [
      `images/${key}.png`,
      `images/${key.toLowerCase()}.png`,
      `images/${key}-gate.png`,
      `images/${key.toLowerCase()}-gate.png`,
    ];
    return new Promise((resolve) => {
      let i = 0;
      function tryNext() {
        if (i >= candidates.length) return resolve(null);
        const url = candidates[i++];
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => tryNext();
        img.src = url;
      }
      tryNext();
    });
  }

  // Pre-probe common gates and populate savedImages cache
  const preloadPromise = (async function preloadRepoImages() {
    const keys = ['VAR', 'START', 'NOT', 'AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'];
    for (const k of keys) {
      const url = await probeImageForGate(k);
      if (url) savedImages[k] = url;
    }
  })();

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    function isAlpha(c){ return /[A-Za-z]/.test(c); }
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (isAlpha(ch)) {
        // read full word
        let j = i;
        while (j < src.length && isAlpha(src[j])) j++;
        const word = src.slice(i, j).toUpperCase();
        i = j;
        if (word === 'AND') { tokens.push({ type: 'and' }); continue; }
        if (word === 'OR') { tokens.push({ type: 'or' }); continue; }
        if (word === 'NOT') { tokens.push({ type: 'not' }); continue; }
        // treat single-letter words as identifiers (A..Z)
        if (word.length === 1 && /[A-Z]/.test(word)) { tokens.push({ type: 'ident', value: word }); continue; }
        // If multi-letter non-keyword appears, take its first letter as variable to be permissive
        tokens.push({ type: 'ident', value: word[0] });
        continue;
      }
      if (ch === '!') { tokens.push({ type: 'not' }); i++; continue; }
      if (ch === '.') { tokens.push({ type: 'and' }); i++; continue; }
      if (ch === '+') { tokens.push({ type: 'or' }); i++; continue; }
      if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
      if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
      throw new Error(`Unexpected character: ${ch}`);
    }
    tokens.push({ type: 'eof' });
    return tokens;
  }

  function parse(tokens) {
    let pos = 0;
    function peek() { return tokens[pos]; }
    function consume(type) {
      const t = tokens[pos];
      if (t.type !== type) throw new Error(`Expected ${type} but found ${t.type}`);
      pos++; return t;
    }

    function parseExpr() { return parseOr(); }
    function parseOr() {
      const items = [parseAnd()];
      while (peek().type === 'or') {
        consume('or');
        items.push(parseAnd());
      }
      if (items.length === 1) return items[0];
      return { type: 'OR', inputs: items };
    }
    function parseAnd() {
      const items = [parseUnary()];
      while (peek().type === 'and') {
        consume('and');
        items.push(parseUnary());
      }
      if (items.length === 1) return items[0];
      return { type: 'AND', inputs: items };
    }
    function parseUnary() {
      if (peek().type === 'not') { consume('not'); return { type: 'NOT', child: parseUnary() }; }
      return parsePrimary();
    }
    function parsePrimary() {
      const t = peek();
      if (t.type === 'ident') { consume('ident'); return { type: 'VAR', name: t.value }; }
      if (t.type === 'lparen') { consume('lparen'); const e = parseExpr(); consume('rparen'); return e; }
      throw new Error(`Unexpected token: ${t.type}`);
    }

    const ast = parseExpr();
    if (peek().type !== 'eof') throw new Error('Unexpected extra input');
    return ast;
  }

  // Simple layout: produce a DAG with coordinates (x,y) and edges
  function layout(ast) {
    const nodes = [];
    const edges = [];
    const levels = new Map();
    function depth(n) {
      if (!n) return 0;
      switch (n.type) {
        case 'VAR': return 0;
        case 'NOT': return 1 + depth(n.child);
        case 'AND': {
          const arr = n.inputs || [n.left, n.right].filter(Boolean);
          return 1 + Math.max(...arr.map(depth));
        }
        case 'OR': {
          const arr = n.inputs || [n.left, n.right].filter(Boolean);
          return 1 + Math.max(...arr.map(depth));
        }
        default: return 0;
      }
    }
    const maxDepth = depth(ast);
    let idCounter = 0;
    function visit(n) {
      if (!n) return null;
  const id = `n${idCounter++}`;
  // base node size (will scale with fan-in below)
  let width = 64, height = 48;
      let label = n.type;
      let children = [];
      if (n.type === 'VAR') { label = n.name; }
      if (n.type === 'NOT') { children = [visit(n.child)]; }
      if (n.type === 'AND' || n.type === 'OR') {
        const ins = n.inputs || [n.left, n.right].filter(Boolean);
        children = ins.map(visit);
      }
      const d = (function getD(node){
        switch (node.type) {
          case 'VAR': return 0;
          case 'NOT': return 1 + getD(node.child);
          case 'AND': {
            const arr = node.inputs || [node.left, node.right].filter(Boolean);
            return 1 + Math.max(...arr.map(getD));
          }
          case 'OR': {
            const arr = node.inputs || [node.left, node.right].filter(Boolean);
            return 1 + Math.max(...arr.map(getD));
          }
          default: return 0;
        }
      })(n);
      // Count conceptual inputs (leaf variables) under this node to scale gate size
      function countLeaves(node) {
        switch (node.type) {
          case 'VAR': return 1;
          case 'NOT': return countLeaves(node.child);
          case 'AND': {
            const arr = node.inputs || [node.left, node.right].filter(Boolean);
            return arr.map(countLeaves).reduce((a,b)=>a+b,0);
          }
          case 'OR': {
            const arr = node.inputs || [node.left, node.right].filter(Boolean);
            return arr.map(countLeaves).reduce((a,b)=>a+b,0);
          }
          default: return 0;
        }
      }
      if (n.type === 'AND' || n.type === 'OR') {
        const fanIn = Math.max(2, countLeaves(n));
        const scale = Math.max(0, fanIn - 2);
        width = 64 + scale * 20;
        height = 48 + scale * 16;
      } else if (n.type === 'NOT') {
        // keep NOT modestly larger when its child subtree is large
        const fanIn = countLeaves(n);
        const scale = Math.max(0, fanIn - 1);
        width = 64 + Math.min(2, scale) * 10;
        height = 48 + Math.min(2, scale) * 8;
      }
        const level = d;
        // make downstream gates slightly larger than upstream ones to provide more spacing
        width += level * 12;
        height += Math.min(2, level) * 6;
      if (!levels.has(level)) levels.set(level, []);
      const node = { id, type: n.type, label, level, width, height, ast: n, children: children.filter(Boolean) };
      levels.get(level).push(node);
      nodes.push(node);
      for (let k = 0; k < children.length; k++) {
        const childId = children[k];
        if (childId) edges.push({ from: childId, to: id, slotIndex: k, slotTotal: children.length });
      }
      return id;
    }
    const rootId = visit(ast);

    // Position nodes: columns by level, rows evenly spaced per level with adaptive yGap
    const xGap = 200;
    const baseYGap = 90;
    const margin = { x: 40, y: 30 };
    const levelsArr = [...levels.entries()].sort((a, b) => a[0] - b[0]);

    // Compute an adaptive y-gap per level based on max fan-in at that level
    const levelInfo = new Map();
    for (const [level, list] of levelsArr) {
      const maxFanIn = Math.max(0, ...list.map(n => (n.type === 'AND' || n.type === 'OR') ? (n.children ? n.children.length : 0) : 1));
      const extra = Math.max(0, maxFanIn - 2) * 10;
      levelInfo.set(level, { yGap: baseYGap + extra });
    }

    // Initial even spacing
    for (const [level, list] of levelsArr) {
      const { yGap } = levelInfo.get(level);
      list.forEach((node, i) => {
        node.x = margin.x + level * xGap;
        node.y = margin.y + i * yGap;
      });
    }

    // Center parents between their children with minimum separation
    const maxLevel = Math.max(...levels.keys());
    const minSepFactor = 0.6; // fraction of yGap to keep between siblings
    for (let level = maxLevel - 1; level >= 0; level--) {
      const list = levels.get(level) || [];
      const { yGap } = levelInfo.get(level);
      // Centering
      for (const node of list) {
        if (node.children && node.children.length) {
          const childYs = node.children.map(cid => {
            const c = nodes.find(n => n.id === cid); return c ? (c.y + c.height / 2) : null;
          }).filter(v => v !== null);
          if (childYs.length) {
            const avg = childYs.reduce((a,b)=>a+b,0)/childYs.length;
            node.y = avg - node.height / 2;
          }
        }
      }
      // Enforce minimum separation within the level
      const sorted = (levels.get(level) || []).slice().sort((a,b)=>a.y-b.y);
      let lastY = -Infinity;
      for (const node of sorted) {
        const minY = (isFinite(lastY) ? lastY + yGap * minSepFactor : node.y);
        if (node.y < minY) node.y = minY;
        lastY = node.y;
      }
    }

    // Compute canvas size
    let maxX = 0, maxY = 0;
    for (const n of nodes) {
      maxX = Math.max(maxX, n.x + n.width + margin.x);
      maxY = Math.max(maxY, n.y + n.height + margin.y);
    }

    return { nodes, edges, width: Math.max(360, maxX), height: Math.max(300, Math.ceil(maxY)), rootId };
  }

  function renderSVG(graph) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${graph.width} ${graph.height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', Math.min(graph.height, 480));

    // defs: arrow marker for wires
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrow');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '4');
    marker.setAttribute('orient', 'auto');
    const markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    markerPath.setAttribute('d', 'M 0 0 L 8 4 L 0 8 z');
  markerPath.setAttribute('fill', '#064e3b'); // dark green
    marker.appendChild(markerPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // helper to compute y position for a specific input slot on a target node
    function inputY(toNode, slotIndex, slotTotal) {
      const total = Math.max(1, slotTotal || 1);
      const k = Math.min(Math.max(0, slotIndex || 0), total - 1);
      // For multi-input gates, spread inputs along the left side vertically
      if (toNode.type === 'AND' || toNode.type === 'OR') {
        const padding = 10; // top/bottom padding within the gate
        const span = Math.max(0, toNode.height - padding * 2);
        if (total === 1) return toNode.y + toNode.height / 2;
        return toNode.y + padding + (span * (k / (total - 1)));
      }
      // Single-input or others: connect to the vertical center
      return toNode.y + toNode.height / 2;
    }

    // Draw edges grouped by target to allow relative routing adjustments
    const edgesByTo = new Map();
    for (const e of graph.edges) {
      const list = edgesByTo.get(e.to) || [];
      list.push(e);
      edgesByTo.set(e.to, list);
    }
    for (const [toId, group] of edgesByTo.entries()) {
      // sort by slot to draw in input order
      const sorted = group.slice().sort((a,b)=> (a.slotIndex||0) - (b.slotIndex||0));
      let prevFromY = null;
      for (const e of sorted) {
        const from = graph.nodes.find(n => n.id === e.from);
        const to = graph.nodes.find(n => n.id === e.to);
        if (!from || !to) continue;
        const x1 = from.x + from.width;
        const y1 = from.y + from.height / 2;
        const x2 = to.x;
        const y2 = inputY(to, e.slotIndex, e.slotTotal);
        const total = Math.max(1, e.slotTotal || 1);
        const idx = Math.min(Math.max(0, e.slotIndex || 0), total - 1);
        const approachBase = x2 - 28;
        const offset = (idx - (total - 1) / 2) * 16; // spread approach lanes
        const approachX = approachBase + offset;
        // Per-input jog near source so successive inputs have different horizontal lengths
        const minJog = x1 + 6;
        const maxJog = approachX - 12;
        const preJog = 10 * (idx + 1); // 10px, 20px, ...
        const jogCandidate = x1 + preJog;
        const useJog = maxJog > minJog;
        // If this source is lower than previous in this group, go up a bit first as requested
        const earlyUp = (prevFromY != null && y1 > prevFromY) ? 10 : 0;
        let d;
        if (useJog) {
          const jogX = Math.max(minJog, Math.min(jogCandidate, maxJog));
          d = `M ${x1} ${y1} ${earlyUp?`L ${x1} ${y1 - earlyUp}`:''} L ${jogX} ${earlyUp?y1 - earlyUp:y1} L ${jogX} ${y2} L ${approachX} ${y2} L ${x2} ${y2}`;
        } else {
          d = `M ${x1} ${y1} ${earlyUp?`L ${x1} ${y1 - earlyUp}`:''} L ${approachX} ${earlyUp?y1 - earlyUp:y1} L ${approachX} ${y2} L ${x2} ${y2}`;
        }
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke', '#cbd5e1');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#arrow)');
        svg.appendChild(path);
        prevFromY = y1;
      }
    }

    // Draw nodes
    for (const n of graph.nodes) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${n.x}, ${n.y})`);

  // If an image is assigned for this gate type, render it
  // Prefer dedicated START image for variables, otherwise VAR
  const imgKey = n.type === 'VAR' && savedImages['START'] ? 'START' : n.type;
  const dataUrl = savedImages[imgKey] || (n.type === 'VAR' ? savedImages['VAR'] : undefined);
      if (dataUrl) {
        // Use <image> in SVG
        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        // Set image size to node width/height
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
        img.setAttribute('width', n.width);
        img.setAttribute('height', n.height);
        img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        g.appendChild(img);
      } else {
        // fallback to distinct vector shapes per gate type
        const w = n.width, h = n.height;
        if (n.type === 'VAR') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('width', w);
          rect.setAttribute('height', h);
          rect.setAttribute('rx', 10);
          rect.setAttribute('class', 'gate');
          // base fill as blue like example
          rect.setAttribute('fill', '#2563eb');
          rect.setAttribute('stroke', '#1e40af');
          rect.setAttribute('stroke-width', '1');
          g.appendChild(rect);
          // output circle
          const outc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          outc.setAttribute('cx', w + 6);
          outc.setAttribute('cy', h / 2);
          outc.setAttribute('r', 5);
          outc.setAttribute('fill', n.signal === true ? '#34d399' : (n.signal === false ? '#f87171' : '#ffffff'));
          outc.setAttribute('stroke', '#1f2937');
          outc.setAttribute('stroke-width', '1');
          g.appendChild(outc);
          // left input small chevron marker (like example)
          const im = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          // small left-pointing chevron (arrow head into the gate)
          const ix = -12;
          const iy = h/2;
          const id = `M ${ix+8} ${iy-6} L ${ix} ${iy} L ${ix+8} ${iy+6}`;
          im.setAttribute('d', id);
          im.setAttribute('fill', 'none');
          im.setAttribute('stroke', '#064e3b');
          im.setAttribute('stroke-width', '2');
          im.setAttribute('stroke-linecap', 'round');
          im.setAttribute('stroke-linejoin', 'round');
          g.appendChild(im);
          // clickable var
          g.style.cursor = 'pointer';
          g.addEventListener('click', () => { const varName = n.label; varValues[varName] = !varValues[varName]; update(); });
        } else if (n.type === 'NOT') {
          // triangle pointing right + inversion circle
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const d = `M 0 0 L ${w - 14} ${h / 2} L 0 ${h} Z`;
          path.setAttribute('d', d);
          path.setAttribute('class', 'gate');
          path.setAttribute('fill', '#2563eb');
          path.setAttribute('stroke', '#1e40af');
          g.appendChild(path);
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', w - 7);
          circle.setAttribute('cy', h / 2);
          circle.setAttribute('r', 6);
          circle.setAttribute('fill', '#ffffff');
          circle.setAttribute('stroke', '#1f2937');
          circle.setAttribute('stroke-width', '1');
          g.appendChild(circle);
        } else if (n.type === 'AND') {
          // flat-left rounded rectangle with semicircular right side
          const radius = h / 2;
          const innerX = w - radius;
          const d = `M 0 0 L ${innerX} 0 A ${radius} ${radius} 0 0 1 ${innerX} ${h} L 0 ${h} Z`;
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          path.setAttribute('class', 'gate');
          path.setAttribute('fill', '#2563eb');
          path.setAttribute('stroke', '#1e40af');
          g.appendChild(path);
          // output circle
          const outc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          outc.setAttribute('cx', w + 6);
          outc.setAttribute('cy', h / 2);
          outc.setAttribute('r', 5);
          outc.setAttribute('fill', n.signal === true ? '#34d399' : (n.signal === false ? '#f87171' : '#ffffff'));
          outc.setAttribute('stroke', '#1f2937');
          outc.setAttribute('stroke-width', '1');
          g.appendChild(outc);
        } else if (n.type === 'OR') {
          // curved shield-like shape using quadratic curves
          const d = `M 0 ${h} Q ${w * 0.3} ${h / 2} 0 0 Q ${w * 0.7} ${h / 2} ${w} ${h / 2} L ${w - 8} ${h / 2} Q ${w * 0.6} ${h} 0 ${h} Z`;
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          path.setAttribute('class', 'gate');
          path.setAttribute('fill', '#2563eb');
          path.setAttribute('stroke', '#1e40af');
          g.appendChild(path);
          const outc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          outc.setAttribute('cx', w + 6);
          outc.setAttribute('cy', h / 2);
          outc.setAttribute('r', 5);
          outc.setAttribute('fill', n.signal === true ? '#34d399' : (n.signal === false ? '#f87171' : '#ffffff'));
          outc.setAttribute('stroke', '#1f2937');
          outc.setAttribute('stroke-width', '1');
          g.appendChild(outc);
        } else {
          // generic rounded rect for other gates
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('width', w);
          rect.setAttribute('height', h);
          rect.setAttribute('rx', 12);
          rect.setAttribute('class', 'gate');
          rect.setAttribute('fill', '#2563eb');
          rect.setAttribute('stroke', '#1e40af');
          g.appendChild(rect);
          const outc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          outc.setAttribute('cx', w + 6);
          outc.setAttribute('cy', h / 2);
          outc.setAttribute('r', 5);
          outc.setAttribute('fill', n.signal === true ? '#34d399' : (n.signal === false ? '#f87171' : '#ffffff'));
          outc.setAttribute('stroke', '#1f2937');
          outc.setAttribute('stroke-width', '1');
          g.appendChild(outc);
        }
      }

      // Only show text for variable nodes (A, B, C...)
      if (n.type === 'VAR') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', n.width / 2);
        text.setAttribute('y', n.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('font-size', '13');
  text.textContent = n.label;
  text.setAttribute('fill', '#111827');
        g.appendChild(text);
      }
      svg.appendChild(g);
    }

    return svg;
  }

  // Evaluation: compute boolean value for each node in graph and annotate nodes with `signal` property
  const varValues = {}; // map variable name -> boolean
  function evaluateGraph(graph) {
    // Build a map id->node and id->ast
    const idToNode = Object.fromEntries(graph.nodes.map(n => [n.id, n]));

    // Ensure variables have initial values (default false)
    graph.nodes.forEach(n => { if (n.type === 'VAR' && !(n.label in varValues)) varValues[n.label] = false; });

    // helper recursive: compute value for node id by looking at its AST stored in n.ast if present
    const cache = {};
    function compute(n) {
      if (!n) return null;
      if (cache[n.id] !== undefined) return cache[n.id];
      if (n.type === 'VAR') {
        cache[n.id] = !!varValues[n.label];
        n.signal = cache[n.id];
        return cache[n.id];
      }
      const ast = n.ast;
      if (!ast) { cache[n.id] = null; n.signal = null; return null; }
      switch (ast.type) {
        case 'VAR': cache[n.id] = !!varValues[ast.name]; break;
          case 'NOT': {
            // find child node by child id stored in layout
            const childId = n.children && n.children[0];
            const child = childId ? graph.nodes.find(x => x.id === childId) : null;
            const cv = child ? compute(child) : null;
            cache[n.id] = (cv === null) ? null : !cv;
          } break;
        case 'AND': {
          const childNodes = (n.children || []).map(cid => graph.nodes.find(x => x.id === cid)).filter(Boolean);
          let acc = true;
          for (const ch of childNodes) {
            const v = compute(ch);
            if (v === null) { acc = null; break; }
            acc = acc && v;
            if (acc === false) break; // short-circuit
          }
          cache[n.id] = acc;
        } break;
        case 'OR': {
          const childNodes = (n.children || []).map(cid => graph.nodes.find(x => x.id === cid)).filter(Boolean);
          let acc = false;
          for (const ch of childNodes) {
            const v = compute(ch);
            if (v === null) { acc = null; break; }
            acc = acc || v;
            if (acc === true) break; // short-circuit
          }
          cache[n.id] = acc;
        } break;
        default: cache[n.id] = null;
      }
      n.signal = cache[n.id];
      return cache[n.id];
    }

    // compute for all nodes in topological order by level (low -> high)
    const byLevel = [...new Map(graph.nodes.map(n => [n.level, graph.nodes.filter(x => x.level === n.level)])).values()];
    graph.nodes.sort((a,b) => a.level - b.level);
    for (const n of graph.nodes) compute(n);

    // annotate edges with value of source node
    for (const e of graph.edges) {
      const from = graph.nodes.find(n => n.id === e.from);
      e.value = from ? from.signal : null;
    }
  }

  function update() {
    const raw = exprInput.value.trim();
    stage.innerHTML = '';
    if (!raw) { stage.textContent = 'Enter an expression to render the diagram.'; return; }
    try {
      const tokens = tokenize(raw);
      const ast = parse(tokens);
  const graph = layout(ast);
      evaluateGraph(graph);
      const svg = renderSVG(graph);
      stage.appendChild(svg);
    } catch (err) {
      const msg = document.createElement('div');
      msg.style.color = '#fca5a5';
      msg.textContent = `Error: ${err.message}`;
      stage.appendChild(msg);
    }
  }

  exprInput.addEventListener('input', update);
  // Clear button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    // clear textbox, variable values and stage
    exprInput.value = '';
    for (const k of Object.keys(varValues)) delete varValues[k];
    stage.innerHTML = '';
  });
  // Initial example
  exprInput.value = 'A.B + !C';
  update();
  // Re-render once images (if any) have been probed so PNGs show on refresh
  if (preloadPromise && typeof preloadPromise.then === 'function') {
    preloadPromise.then(() => { if (exprInput.value.trim()) update(); });
  }
})();

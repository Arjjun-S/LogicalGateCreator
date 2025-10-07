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

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[A-Za-z]/.test(ch)) { tokens.push({ type: 'ident', value: ch.toUpperCase() }); i++; continue; }
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
      let node = parseAnd();
      while (peek().type === 'or') {
        consume('or');
        const right = parseAnd();
        node = { type: 'OR', left: node, right };
      }
      return node;
    }
    function parseAnd() {
      let node = parseUnary();
      while (peek().type === 'and') {
        consume('and');
        const right = parseUnary();
        node = { type: 'AND', left: node, right };
      }
      return node;
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
        case 'AND':
        case 'OR': return 1 + Math.max(depth(n.left), depth(n.right));
        default: return 0;
      }
    }
    const maxDepth = depth(ast);
    let idCounter = 0;
    function visit(n) {
      if (!n) return null;
      const id = `n${idCounter++}`;
      let width = 50, height = 40;
      let label = n.type;
      let children = [];
      if (n.type === 'VAR') { label = n.name; }
      if (n.type === 'NOT') { children = [visit(n.child)]; }
      if (n.type === 'AND' || n.type === 'OR') { children = [visit(n.left), visit(n.right)]; }
      const d = n.type === 'VAR' ? 0 : (n.type === 'NOT' ? 1 + getDepth(n.child) : 1 + Math.max(getDepth(n.left), getDepth(n.right)));
      function getDepth(node) {
        switch (node.type) {
          case 'VAR': return 0;
          case 'NOT': return 1 + getDepth(node.child);
          case 'AND':
          case 'OR': return 1 + Math.max(getDepth(node.left), getDepth(node.right));
          default: return 0;
        }
      }
      const level = d;
      if (!levels.has(level)) levels.set(level, []);
      const node = { id, type: n.type, label, level, width, height };
      levels.get(level).push(node);
      nodes.push(node);
      for (const childId of children) {
        if (childId) edges.push({ from: childId, to: id });
      }
      return id;
    }
    const rootId = visit(ast);

    // Position nodes: columns by level, rows by order
    const xGap = 120;
    const yGap = 70;
    const margin = { x: 40, y: 30 };
    const levelsArr = [...levels.entries()].sort((a, b) => a[0] - b[0]);
    let maxX = 0, maxY = 0;
    for (const [level, list] of levelsArr) {
      list.forEach((node, i) => {
        const x = margin.x + level * xGap;
        const y = margin.y + i * yGap;
        node.x = x;
        node.y = y;
        maxX = Math.max(maxX, x + node.width + margin.x);
        maxY = Math.max(maxY, y + node.height + margin.y);
      });
    }

    return { nodes, edges, width: Math.max(360, maxX), height: Math.max(220, maxY), rootId };
  }

  function renderSVG(graph) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${graph.width} ${graph.height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', Math.min(graph.height, 480));

    // Draw edges
    for (const e of graph.edges) {
      const from = graph.nodes.find(n => n.id === e.from);
      const to = graph.nodes.find(n => n.id === e.to);
      if (!from || !to) continue;
      const x1 = from.x + from.width;
      const y1 = from.y + from.height / 2;
      const x2 = to.x;
      const y2 = to.y + to.height / 2;
      const midX = (x1 + x2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
      path.setAttribute('class', 'wire');
      svg.appendChild(path);
    }

    // Draw nodes
    for (const n of graph.nodes) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${n.x}, ${n.y})`);

      if (n.type === 'VAR') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', n.width);
        rect.setAttribute('height', n.height);
        rect.setAttribute('rx', 8);
        rect.setAttribute('class', 'gate');
        g.appendChild(rect);
      } else if (n.type === 'NOT') {
        // Triangle with circle for inversion
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const w = n.width, h = n.height;
        const d = `M 0 ${h} L 0 0 L ${w - 10} ${h / 2} Z`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'gate');
        g.appendChild(path);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', w - 5);
        circle.setAttribute('cy', h / 2);
        circle.setAttribute('r', 5);
        circle.setAttribute('class', 'gate');
        g.appendChild(circle);
      } else {
        // AND/OR: simple rounded shape
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', n.width);
        rect.setAttribute('height', n.height);
        rect.setAttribute('rx', 18);
        rect.setAttribute('class', 'gate');
        g.appendChild(rect);
      }

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', n.width / 2);
      text.setAttribute('y', n.height / 2 + 4);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = n.label;
      g.appendChild(text);
      svg.appendChild(g);
    }

    return svg;
  }

  function update() {
    const raw = exprInput.value.trim();
    stage.innerHTML = '';
    if (!raw) { stage.textContent = 'Enter an expression to render the diagram.'; return; }
    try {
      const tokens = tokenize(raw);
      const ast = parse(tokens);
      const graph = layout(ast);
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
  // Initial example
  exprInput.value = 'A.B + !C';
  update();
})();

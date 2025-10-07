// LogicGates module
// - Provides a list of gates, evaluator, and truth table generator
// - Pure JS Boolean ops, easy to extend
(function attachLogicGates(global) {
  const list = [
    { key: 'AND', label: 'AND (∧)', arity: 2, desc: 'Output is TRUE only if both inputs are TRUE.' },
    { key: 'OR', label: 'OR (∨)', arity: 2, desc: 'Output is TRUE if at least one input is TRUE.' },
    { key: 'NOT', label: 'NOT (¬)', arity: 1, desc: 'Inverts the input: TRUE becomes FALSE and vice versa.' },
    // Optional common gates
    { key: 'XOR', label: 'XOR (⊕)', arity: 2, desc: 'TRUE when inputs differ.' },
    { key: 'NAND', label: 'NAND', arity: 2, desc: 'Negation of AND: FALSE only if both inputs are TRUE.' },
    { key: 'NOR', label: 'NOR', arity: 2, desc: 'Negation of OR: TRUE only if both inputs are FALSE.' },
    { key: 'XNOR', label: 'XNOR (≡)', arity: 2, desc: 'TRUE when inputs are equal.' },
  ];

  const map = {
    AND: (a, b) => Boolean(a && b),
    OR: (a, b) => Boolean(a || b),
    NOT: (a, _b) => Boolean(!a),
    XOR: (a, b) => Boolean((a || b) && !(a && b)),
    NAND: (a, b) => Boolean(!(a && b)),
    NOR: (a, b) => Boolean(!(a || b)),
    XNOR: (a, b) => Boolean((a && b) || (!a && !b)),
  };

  function evaluate(key, a, b) {
    const fn = map[key];
    if (!fn) throw new Error(`Unknown gate: ${key}`);
    return fn(Boolean(a), Boolean(b));
  }

  function truthTable(key) {
    const meta = list.find(g => g.key === key);
    if (!meta) throw new Error(`Unknown gate: ${key}`);
    const rows = [];
    if (meta.arity === 1) {
      for (const a of [false, true]) {
        rows.push({ A: a, OUT: evaluate(key, a, false) });
      }
    } else {
      for (const a of [false, true]) {
        for (const b of [false, true]) {
          rows.push({ A: a, B: b, OUT: evaluate(key, a, b) });
        }
      }
    }
    return { meta, rows };
  }

  global.LogicGates = { list, map, evaluate, truthTable };
})(window);

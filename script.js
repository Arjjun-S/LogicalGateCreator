// LogicGates module
// - Provides a list of gates, evaluator, and truth table generator
// - Pure JS Boolean ops, easy to extend
(function attachLogicGates(global) {
  const list = [
    { key: 'AND', label: 'AND (∧)', arity: 2, desc: 'Outputs 1 only when both inputs are 1. In Boolean algebra this is the product A·B. Commutative and associative; forms the basis of conjunction.' },
    { key: 'OR', label: 'OR (∨)', arity: 2, desc: 'Outputs 1 when at least one input is 1. In Boolean algebra this is the sum A + B. Commutative and associative; represents logical disjunction.' },
    { key: 'NOT', label: 'NOT (¬)', arity: 1, desc: 'Inverts the input bit (complement). If A=1 then ¬A=0 and vice versa. Double negation returns the original value.' },
    // Optional common gates
    { key: 'XOR', label: 'XOR (⊕)', arity: 2, desc: 'Outputs 1 when inputs differ (odd parity). Acts like addition without carry: S = A ⊕ B. Useful for parity and adders.' },
    { key: 'NAND', label: 'NAND', arity: 2, desc: 'Negation of AND: 0 only when both inputs are 1. Functionally complete: any circuit can be built using only NAND gates.' },
    { key: 'NOR', label: 'NOR', arity: 2, desc: 'Negation of OR: 1 only when both inputs are 0. Also functionally complete; often used in simple latch designs.' },
    { key: 'XNOR', label: 'XNOR (≡)', arity: 2, desc: 'Outputs 1 when inputs are equal (even parity). Acts as an equality detector between two bits.' },
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

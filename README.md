# COA Simulator

Interactive Computer Organization and Architecture learning suite.

Pages
-----
- Home (`index.html`): main menu to all modules.
- Logic Gates (`logic.html`): toggle inputs and see outputs with live truth tables.
- Diagram Creator (`diagram.html`): type Boolean expressions (use `.` for AND, `+` for OR, `!` for NOT) and render a circuit diagram. Uses your PNG images if present.
- Number System (`number-system.html`): explanations and a converter across Binary, Octal, Decimal, Hex (supports fractional parts).
- Number System (`number-system.html`): explanations and a converter across Binary, Octal, Decimal, Hex (non-negative integers).
- Adders (`adders.html`): Half/Full Adder, Ripple-Carry, Carry Lookahead with truth tables, boolean equations, and image slots.
- Binary Arithmetic (`binary-arithmetic.html`): calculators for add/sub/mul/div in binary and explanation boxes for classic algorithms (Restoring, Non-restoring, Booth, Bit-pair).

Gate images
-----------
Place PNGs in `images/` using one of these names to auto-use in the Diagram Creator:

- `AND.png`, `OR.png`, `NOT.png`, `XOR.png`, `NAND.png`, `NOR.png`, `XNOR.png`
- `VAR.png` (generic variable node) and/or `START.png` (preferred visual for input variables A, B, C...)

Case-insensitive names are supported, as well as variants with `-gate` suffix, for example: `and.png`, `AND-gate.png`.

Example: `images/AND.png` will be used to render AND nodes; `images/START.png` will be used for variable inputs A, B, C.

Logic Gates page banners
------------------------
For the large image above each gate card on the Logic Gates page, place these files (case-insensitive; `-gate` suffix also supported):

- `AND.png`, `OR.png`, `NOT.png`, `XOR.png`, `NAND.png`, `NOR.png`, `XNOR.png`

Adders diagrams
---------------
The Adders page shows one image per adder section:

- `half-adder.png`
- `full-adder.png`
- `ripple-carry.png`
- `carry-lookahead.png`

Number system visuals (optional)
--------------------------------
Optional images to enhance explanations:

- `place-value.png` – illustrates positional weights
- `base-chart.png` – quick digits per base (2/8/10/16)

Binary arithmetic algorithm diagrams (optional)
----------------------------------------------
Drop any of these to complement the notes:

- `restoring-division.png`
- `non-restoring-division.png`
- `booth-multiplication.png`
- `bit-pair-recoding.png`

Serving locally
---------------
For best results, serve this folder with a static server to avoid browser file:// restrictions when loading images:

Optional (Node required):

```
npx http-server .
```

Then open the printed local URL and navigate to the HTML pages.

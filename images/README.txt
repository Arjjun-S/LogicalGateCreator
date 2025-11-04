This folder stores all PNG images used across the COA Simulator.

Gate images (Diagram Creator + Logic page banners)
-------------------------------------------------
Provide gate PNGs with these names (case-insensitive; `-gate` suffix accepted):

- AND.png, OR.png, NOT.png, XOR.png, NAND.png, NOR.png, XNOR.png
- START.png (preferred image for variable inputs A/B/C...)
- VAR.png (generic input, used if START.png is absent)

Adders page diagrams
--------------------
Place one diagram per section:

- half-adder.png
- full-adder.png
- ripple-carry.png
- carry-lookahead.png

Binary Arithmetic algorithm diagrams
------------------------------------
Add the algorithm visuals here:

- restoring-division.png
- non-restoring-division.png
- booth-multiplication.png
- bit-pair-recoding.png

Number System visuals
---------------------

- place-value.png
- base-chart.png

Home page thumbnails
--------------------
These appear on each menu card:

- home-logic.png
- home-diagram.png
- home-number.png
- home-adders.png
- home-binary.png

Notes
-----
- Images are loaded via relative paths (e.g., `images/AND.png`).
- All images are expected to be present; fallback/hide logic has been disabled.

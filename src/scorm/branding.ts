/** Online fonts are optional: offline packages fall back to system sans-serif. */
export const fontLinks =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&amp;family=Work+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet">';
export const playerBrandCSS = `
:root{--font-title:'Syne',sans-serif;--font-body:'Work Sans',sans-serif;--stone:#D7CEC7;--olive:#A3A380;--ink:#464D4A;--white:#FFFFFF;--terracotta:#BF695E}
body,p,span,a,input,button,select,textarea{font-family:var(--font-body)}
h1,h2,h3,h4{font-family:var(--font-title);font-weight:700}
body{background:color-mix(in srgb,var(--stone) 28%,var(--white));color:var(--ink)}
header{background:var(--ink);color:var(--white);border-bottom:5px solid var(--terracotta)}
button{color:var(--ink);border-color:var(--stone)}
label,input,select,textarea,td,th,iframe,.order-row{border-color:var(--stone)}
button:hover,button[aria-current]{background:color-mix(in srgb,var(--terracotta) 14%,var(--white))}
.block{border-color:var(--stone)}.hero,.flashcard{background:color-mix(in srgb,var(--olive) 22%,var(--white))}
.muted,small,.message{color:var(--ink)}
.timeline{border-color:var(--terracotta)}
blockquote{border-left-color:var(--terracotta);font-family:var(--font-body)}
.hotspot button{background:var(--ink);color:var(--white)}
progress{accent-color:var(--olive)}pre{background:var(--ink);color:var(--white)}
.feedback{background:color-mix(in srgb,var(--stone) 25%,var(--white))}
.certificate{border-color:var(--olive)}
button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline-color:var(--ink)}
`;

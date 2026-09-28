(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  /* ---------- Spider leg ----------
     A jointed SVG path drawn pointing straight up (12 o'clock) with its pivot
     at (0,0), the spider's center. Two segments (upper leg + lower leg) meet
     at a knee bent sideways. The foot sits exactly on the vertical axis, so
     rotating the group by the time angle points the foot at the right mark. */
  function legMarkup(len, side, width, color) {
    const kx = side * len * 0.17;   // knee offset to the side
    const ky = -len * 0.5;          // knee halfway along the leg
    return `
      <path d="M0 -6 Q${kx * 0.9} ${-len * 0.18} ${kx} ${ky}"
            fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>
      <path d="M${kx} ${ky} Q${kx * 0.35} ${-len * 0.8} 0 ${-len}"
            fill="none" stroke="${color}" stroke-width="${width * 0.55}" stroke-linecap="round"/>
      <circle cx="${kx}" cy="${ky}" r="${width * 0.8}" fill="${color}"/>`;
  }

  function makeLeg(id, len, side, width, color) {
    const g = $(id);
    g.setAttribute("filter", "url(#glow)");
    g.innerHTML = legMarkup(len, side, width, color);
  }

  // The three legs that tell time
  makeLeg("hourLeg", 195, 1, 13, "#ffffff");   // shortest, thickest
  makeLeg("minLeg", 290, -1, 9, "#fff6ea");    // longer
  makeLeg("secLeg", 345, 1, 5, "#ffd9a6");     // longest, thinnest, warm tint

  // Five decorative legs (8 in total) that sway gently
  const decorLegs = [
    { angle: 32,  len: 140, side: 1 },
    { angle: 118, len: 125, side: -1 },
    { angle: 152, len: 150, side: 1 },
    { angle: 212, len: 145, side: -1 },
    { angle: 248, len: 120, side: 1 }
  ];

  $("decor").setAttribute("filter", "url(#glow)");
  $("decor").innerHTML = decorLegs.map((d, i) => `
    <g transform="rotate(${d.angle})">
      <animateTransform attributeName="transform" type="rotate"
        values="${d.angle - 2.5};${d.angle + 2.5};${d.angle - 2.5}"
        dur="${3.4 + i * 0.7}s" repeatCount="indefinite"
        calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1"/>
      ${legMarkup(d.len, d.side, 7, "#fff1e0")}
    </g>`).join("");

  /* ---------- Numbers 1-12 and minute ticks ---------- */
  let face = "";

  for (let n = 1; n <= 12; n++) {
    const a = n * 30 * Math.PI / 180;
    const r = 400;
    face += `<text class="num" x="${(Math.sin(a) * r).toFixed(1)}" y="${(-Math.cos(a) * r).toFixed(1)}">${n}</text>`;
  }

  for (let t = 0; t < 60; t++) {
    if (t % 5 === 0) continue;   // the numbers already mark the hours
    const a = t * 6 * Math.PI / 180;
    face += `<line x1="${Math.sin(a) * 452}" y1="${-Math.cos(a) * 452}"
                   x2="${Math.sin(a) * 444}" y2="${-Math.cos(a) * 444}"
                   stroke="rgba(255,224,190,0.25)" stroke-width="2" stroke-linecap="round"/>`;
  }
  $("face").innerHTML = face;

  /* ---------- Spider webs ----------
     Spokes from the center plus slightly sagging rings between them. */
  function web(cx, cy, r, spokes, rings, rotation = 0) {
    const point = (radius, i) => {
      const a = (rotation + i * 360 / spokes) * Math.PI / 180;
      return [cx + radius * Math.sin(a), cy - radius * Math.cos(a)];
    };
    let d = "";

    for (let i = 0; i < spokes; i++) {
      const p = point(r, i);
      d += `M${cx} ${cy}L${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    }
    for (let k = 1; k <= rings; k++) {
      const radius = r * k / rings;
      for (let i = 0; i < spokes; i++) {
        const p = point(radius, i);
        const q = point(radius, i + 1);
        const c = point(radius * 0.88, i + 0.5);   // pulls the thread inward
        d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      }
    }
    return `<path d="${d}" fill="none" stroke="#ffe3c2" stroke-width="1.6"/>`;
  }

  $("webs").innerHTML = `
    <g opacity="0.16">${web(0, 0, 330, 16, 9, 5)}</g>
    <g opacity="0.28">
      ${web(-130, -30, 100, 14, 6, 8)}
      ${web(140, -30, 95, 14, 6, 20)}
      ${web(-70, 130, 55, 12, 5, 0)}
      ${web(20, -130, 55, 12, 5, 12)}
      ${web(60, 160, 75, 12, 5, 30)}
    </g>`;

  /* ---------- Real time -> leg rotation ---------- */
  const hourLeg = $("hourLeg");
  const minLeg = $("minLeg");
  const secLeg = $("secLeg");
  const svg = $("clock");
  let lastLabelSecond = -1;

  function tick() {
    const now = new Date();                           // your device's local time
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    // 360 degrees per 12 hours, per 60 minutes, per 60 seconds
    hourLeg.setAttribute("transform", `rotate(${(hours * 30).toFixed(3)})`);
    minLeg.setAttribute("transform", `rotate(${(minutes * 6).toFixed(3)})`);
    secLeg.setAttribute("transform", `rotate(${(seconds * 6).toFixed(3)})`);

    // Keep the screen-reader label current, once per second
    const whole = now.getSeconds();
    if (whole !== lastLabelSecond) {
      lastLabelSecond = whole;
      svg.setAttribute("aria-label", "Spider clock showing " + now.toLocaleTimeString());
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
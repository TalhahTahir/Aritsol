import { useEffect, useRef } from 'react';
import { fluid } from '../../fx/fluid-store';
import { isDark, onThemeChange } from '../../fx/theme-colors';
import { pageCovered } from '../../fx/intro-gate';
import s from './FerrofluidBackground.module.css';

/*
  ─────────────────────────────────────────────────────────────
  Site-wide ferrofluid background (WebGL + a small physics sim).

  Beads of glossy black fluid lie scattered behind the page. The cursor is
  an invisible magnet with two strengths:
    • hover        tugs only the nearest beads towards it
    • press + hold switches it fully on: the fluid streams in, merges into
                   one pool and bristles into a crown of spikes;
                   letting go throws the pool outward
    • repel mode   the same hold shoves the fluid clear, opening a hole
                   with spikes standing round its rim
  Nobody steering? A faint magnet idles in a slow loop.

  Keep-clear: headings, paragraphs, buttons and anything marked
  [data-keep-clear] push the fluid away so text stays readable.
  Areas marked [data-fluid-off] (the home hero, the founders section,
  the footer) don't react to the cursor.

  How it's drawn: each bead is splatted into a half-resolution "field"
  texture; a second pass turns the field into a liquid surface (metaballs),
  adds spikes where the magnet is strong, and shades it like mirror-black
  liquid with soft studio highlights and a gold rim.
  ─────────────────────────────────────────────────────────────
*/

const KEEP_CLEAR = '[data-keep-clear], h1, h2, h3, h4, p, li, button, .btn, .chips, dl, summary, figure';
const INTERACTIVE = 'a, button, input, textarea, select, summary, label, [role="tab"], [data-fluid-off]';
const TEXTY = 'p, h1, h2, h3, h4, li, dd, dt, blockquote, figcaption, span';

// ── shaders ─────────────────────────────────────────────────
const SPLAT_VS = `
attribute vec2 aCorner;
attribute vec3 aBead;      // x, y, influence radius (field-texture pixels)
uniform vec2 uRes;
varying vec2 vC;
void main() {
  vC = aCorner;
  vec2 pos = aBead.xy + aCorner * aBead.z;
  gl_Position = vec4(pos / uRes * 2.0 - 1.0, 0.0, 1.0);
}`;

const SPLAT_FS = `
precision mediump float;
varying vec2 vC;
uniform float uScale;
void main() {
  float d2 = dot(vC, vC);
  if (d2 > 1.0) discard;
  float w = 1.0 - d2;
  gl_FragColor = vec4(w * w * w * uScale, 0.0, 0.0, 1.0);
}`;

const QUAD_VS = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const SURFACE_FS = `
precision highp float;
uniform sampler2D uField;
uniform vec2 uRes;        // canvas pixels
uniform float uInv;       // undo the field-texture scale
uniform vec3 uMag;        // magnet x, y (canvas px), strength 0..1
uniform float uSigma;     // magnet reach (canvas px)
uniform float uCell;      // spike spacing (canvas px)
uniform float uTime;
uniform float uDark;

const float T = 0.36;     // surface threshold of the metaball field
const vec3 GOLD = vec3(1.0, 0.79, 0.0);
const vec3 WHITE = vec3(0.96, 0.95, 0.94);

float F(vec2 px) { return texture2D(uField, px / uRes).r * uInv; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

vec2 hexCentre(vec2 p) {
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  return p - (dot(a, a) < dot(b, b) ? a : b);
}

float magnet(vec2 x) {
  vec2 d = x - uMag.xy;
  return uMag.z * exp(-dot(d, d) / (2.0 * uSigma * uSigma));
}

float height(vec2 x) {
  float f = F(x);
  float dome = smoothstep(T, T + 6.0, f) * 1.4;
  vec2 c = hexCentre(x / uCell) * uCell;
  float fc = F(c);
  float g = smoothstep(0.12, 0.85, magnet(c)) * smoothstep(T + 0.4, T + 2.2, fc);
  g *= 1.0 + 0.06 * sin(uTime * 1.7 + hash(c) * 6.283);
  float rad = mix(0.18, 0.56, g);
  float prof = max(0.0, 1.0 - (length(x - c) / uCell) / rad);
  return dome + g * 2.8 * pow(prof, 1.5);
}

vec3 env(vec3 r) {
  float strip = smoothstep(0.42, 0.6, r.y) * (1.0 - smoothstep(0.82, 0.97, r.y));
  float strip2 = smoothstep(0.55, 0.75, -r.y) * 0.22;
  float rim = smoothstep(0.45, 0.9, r.x) * 0.55;
  return WHITE * (strip * 0.9 + strip2) + GOLD * rim;
}

void main() {
  vec2 x = gl_FragCoord.xy;
  float f = F(x);
  float mask = smoothstep(T - 0.05, T + 0.05, f);
  if (mask < 0.004) { gl_FragColor = vec4(0.0); return; }

  float h = height(x);
  float hx = height(x + vec2(1.0, 0.0));
  float hy = height(x + vec2(0.0, 1.0));
  // the field itself also bends the surface near the edges
  float fx = F(x + vec2(1.5, 0.0)) - F(x - vec2(1.5, 0.0));
  float fy = F(x + vec2(0.0, 1.5)) - F(x - vec2(0.0, 1.5));
  vec2 g = vec2(hx - h, hy - h) * uCell * 0.5 + vec2(fx, fy) * 0.7;
  vec3 n = normalize(vec3(-g, 1.0));

  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);
  vec3 L = normalize(vec3(-0.35, 0.7, 0.62));
  vec3 L2 = normalize(vec3(0.75, -0.25, 0.6));
  float spec = pow(max(dot(r, L), 0.0), 70.0);
  float spec2 = pow(max(dot(r, L2), 0.0), 30.0);

  vec3 col = vec3(0.012, 0.013, 0.016);
  col += env(r) * (0.05 + 0.9 * fres);
  col += WHITE * spec * 1.1;
  col += GOLD * spec2 * 0.35;
  // on a black page, lift the rim a little so the shapes still read
  col += WHITE * fres * 0.3 * uDark;
  float edge = mask * (1.0 - mask) * 4.0;
  col += WHITE * edge * mix(0.03, 0.22, uDark);

  gl_FragColor = vec4(col * mask, mask);
}`;

// ── helpers ─────────────────────────────────────────────────
function program(gl, vsSrc, fsSrc) {
  const make = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Ferrofluid background shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const vs = make(gl.VERTEX_SHADER, vsSrc);
  const fs = make(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  return p;
}

/** Render target for the field. Prefers half-float (smooth shading), falls back to 8-bit. */
function fieldTarget(gl, w, h) {
  const half = gl.getExtension('OES_texture_half_float');
  const halfLinear = gl.getExtension('OES_texture_half_float_linear');
  gl.getExtension('EXT_color_buffer_half_float');
  const tryMake = (type, linear) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, type, null);
    const filter = linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (ok) return { tex, fb };
    gl.deleteTexture(tex);
    gl.deleteFramebuffer(fb);
    return null;
  };
  if (half) {
    const t = tryMake(half.HALF_FLOAT_OES, !!halfLinear);
    if (t) return { ...t, scale: 1 };
  }
  // 8-bit: store the field at 1/12 so dense pools don't clip at 1.0
  const t = tryMake(gl.UNSIGNED_BYTE, true);
  return t ? { ...t, scale: 1 / 12 } : null;
}

// ── component ───────────────────────────────────────────────
export default function FerrofluidBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) {
      canvas.style.display = 'none';
      return;
    }
    const splat = program(gl, SPLAT_VS, SPLAT_FS);
    const surface = program(gl, QUAD_VS, SURFACE_FS);
    if (!splat || !surface) {
      canvas.style.display = 'none';
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    // GL resources
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const beadBuf = gl.createBuffer();
    const sp = {
      corner: gl.getAttribLocation(splat, 'aCorner'),
      bead: gl.getAttribLocation(splat, 'aBead'),
      res: gl.getUniformLocation(splat, 'uRes'),
      scale: gl.getUniformLocation(splat, 'uScale'),
    };
    const su = { p: gl.getAttribLocation(surface, 'p') };
    ['uField', 'uRes', 'uInv', 'uMag', 'uSigma', 'uCell', 'uTime', 'uDark'].forEach((n) => (su[n] = gl.getUniformLocation(surface, n)));

    // sizes
    let W = 0; // CSS px
    let H = 0;
    let S = 1; // canvas px per CSS px
    let FW = 1; // field texture size
    let FH = 1;
    let target = null;

    // beads (CSS px, top-left origin)
    let beads = [];
    const seed = (n) => {
      beads = Array.from({ length: n }, () => {
        const r = 4.5 + Math.pow(Math.random(), 1.6) * 8.5;
        return { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, r, m: r * r };
      });
    };

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      S = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(W * S);
      canvas.height = Math.round(H * S);
      FW = Math.max(1, Math.round(canvas.width / 2));
      FH = Math.max(1, Math.round(canvas.height / 2));
      if (target) {
        gl.deleteTexture(target.tex);
        gl.deleteFramebuffer(target.fb);
      }
      target = fieldTarget(gl, FW, FH);
      const want = Math.round(Math.min(130, Math.max(coarse ? 36 : 55, (W * H) / (coarse ? 15000 : 12500))));
      if (Math.abs(want - beads.length) > 10) seed(want);
      else beads.forEach((b) => ((b.x = Math.min(b.x, W)), (b.y = Math.min(b.y, H))));
    };

    // ── keep-clear areas ──
    const visibleKeep = new Set();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? visibleKeep.add(e.target) : visibleKeep.delete(e.target))),
      { rootMargin: '80px' }
    );
    let observed = new Set();
    const scanKeep = () => {
      const now = new Set(document.querySelectorAll(KEEP_CLEAR));
      now.forEach((el) => {
        if (!observed.has(el) && !el.closest('[data-fluid-off], #site-menu')) io.observe(el);
      });
      observed.forEach((el) => {
        if (!now.has(el)) {
          io.unobserve(el);
          visibleKeep.delete(el);
        }
      });
      observed = now;
    };
    const scanTimer = setInterval(scanKeep, 900);
    scanKeep();

    // ── pointer / magnet state ──
    const ptr = { x: W / 2, y: H / 2, present: false, off: false, lastMove: -1e9, mouse: true };
    let holding = false;
    let holdPower = 0; // eased 0..1 while holding
    let modeRepel = fluid.mode === 'repel';
    const unsubMode = fluid.subscribe(() => (modeRepel = fluid.mode === 'repel'));
    const mag = { x: W / 2, y: H / 2, z: 0 }; // what the shader sees (smoothed)

    const onMove = (e) => {
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.present = true;
      ptr.mouse = e.pointerType === 'mouse';
      ptr.off = !!e.target.closest?.('[data-fluid-off], #site-menu');
      ptr.lastMove = performance.now();
    };
    const onLeave = (e) => {
      if (!e.relatedTarget) ptr.present = false;
    };
    const canHoldHere = (el) =>
      el && !el.closest(INTERACTIVE) && !el.closest('#site-menu') && !(el.matches?.(TEXTY) || el.closest('p, h1, h2, h3, li'));
    const onDown = (e) => {
      if (e.button !== 0 || !canHoldHere(e.target)) return;
      onMove(e);
      holding = true;
      fluid.markTried();
      document.documentElement.classList.add('fluid-holding');
    };
    const onMouseDown = (e) => {
      // stop text selection from starting while the magnet is held
      if (e.button === 0 && canHoldHere(e.target)) e.preventDefault();
    };
    const release = () => {
      if (!holding) return;
      holding = false;
      document.documentElement.classList.remove('fluid-holding');
      if (!modeRepel) {
        // throw the pool outward
        const power = 7 + 16 * holdPower;
        beads.forEach((b) => {
          const dx = b.x - ptr.x;
          const dy = b.y - ptr.y;
          const d = Math.hypot(dx, dy) + 1e-3;
          const k = Math.max(0, 1 - d / 650) * power * (0.7 + Math.random() * 0.6);
          b.vx += (dx / d) * k;
          b.vy += (dy / d) * k;
        });
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', release);

    let dark = isDark() ? 1 : 0;
    const stopTheme = onThemeChange(() => (dark = isDark() ? 1 : 0));

    // ── physics step ──
    const step = (dt, t) => {
      const now = performance.now();
      holdPower += ((holding ? 1 : 0) - holdPower) * 0.1 * dt;
      const hovering = ptr.present && !ptr.off && ptr.mouse && !holding && now - ptr.lastMove < 2500;
      const idle = !holding && !hovering;

      // the idle magnet loops slowly around the screen
      const ix = W * (0.5 + 0.34 * Math.sin(t * 0.07));
      const iy = H * (0.55 + 0.26 * Math.sin(t * 0.11 + 1.3));

      // keep-clear rectangles, read once per frame
      const rects = [];
      visibleKeep.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 2 && r.height > 2 && r.bottom > -40 && r.top < H + 40) rects.push(r);
      });

      const n = beads.length;
      for (let i = 0; i < n; i++) {
        const b = beads[i];
        let ax = 0;
        let ay = 0;

        if (holding || holdPower > 0.02) {
          const dx = ptr.x - b.x;
          const dy = ptr.y - b.y;
          const d = Math.hypot(dx, dy) + 1e-3;
          if (modeRepel) {
            // shove the fluid clear: a widening hole, with the displaced
            // fluid banking up round its rim (where the spikes stand)
            const R = 60 + 80 * holdPower;
            if (d < R) {
              const k = 2.4 * holdPower * (1 - d / R) + 0.5 * holdPower;
              ax -= (dx / d) * k;
              ay -= (dy / d) * k;
            } else if (d < R * 4) {
              const k = 1.1 * holdPower * (1 - (d - R) / (R * 3));
              ax += (dx / d) * k;
              ay += (dy / d) * k;
            }
          } else {
            // stream in from everywhere, stronger as you hold
            const k = (2.4 * holdPower) / (1 + d / 260);
            ax += (dx / d) * k;
            ay += (dy / d) * k;
          }
        } else if (hovering) {
          // gentle tug on the nearest beads only
          const dx = ptr.x - b.x;
          const dy = ptr.y - b.y;
          const d = Math.hypot(dx, dy) + 1e-3;
          if (d < 170) {
            const k = 0.09 * Math.pow(1 - d / 170, 2);
            ax += (dx / d) * k;
            ay += (dy / d) * k;
          }
        }
        if (idle) {
          const dx = ix - b.x;
          const dy = iy - b.y;
          const d2 = dx * dx + dy * dy;
          const k = 0.022 * Math.exp(-d2 / (2 * 240 * 240));
          const d = Math.sqrt(d2) + 1e-3;
          ax += (dx / d) * k;
          ay += (dy / d) * k;
        }

        // keep-clear: push beads out to the nearest edge
        // (softened while you pull the fluid in, so it can stream past text)
        const keepK = holding && !modeRepel ? 0.2 : 1;
        for (let k = 0; k < rects.length; k++) {
          const r = rects[k];
          const pad = b.r + 10;
          const l = b.x - (r.left - pad);
          const rr = r.right + pad - b.x;
          const tp = b.y - (r.top - pad);
          const bt = r.bottom + pad - b.y;
          if (l > 0 && rr > 0 && tp > 0 && bt > 0) {
            const m = Math.min(l, rr, tp, bt);
            const push = Math.min(4, 0.6 + m * 0.12) * keepK;
            if (m === l) ax -= push;
            else if (m === rr) ax += push;
            else if (m === tp) ay -= push;
            else ay += push;
          }
        }

        b.vx += ax * dt;
        b.vy += ay * dt;
      }

      // bead–bead: no overlap (position correction) + a little surface tension.
      // Two passes while a magnet is held, so a packed pool keeps its volume.
      const passes = holdPower > 0.2 ? 2 : 1;
      for (let pass = 0; pass < passes; pass++)
      for (let i = 0; i < n; i++) {
        const a = beads[i];
        for (let j = i + 1; j < n; j++) {
          const b = beads[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const rs = a.r + b.r;
          const reach = rs * 2.2;
          if (dx > reach || dx < -reach || dy > reach || dy < -reach) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 > reach * reach) continue;
          const d = Math.sqrt(d2) + 1e-3;
          const wa = b.m / (a.m + b.m);
          const wb = a.m / (a.m + b.m);
          const rest = rs * 0.92;
          if (d < rest) {
            const c = (rest - d) / d;
            a.x -= dx * c * wa;
            a.y -= dy * c * wa;
            b.x += dx * c * wb;
            b.y += dy * c * wb;
          } else if (pass === 0) {
            const c = (0.0035 * (d - rest)) / d;
            a.vx += dx * c * wa * dt;
            a.vy += dy * c * wa * dt;
            b.vx -= dx * c * wb * dt;
            b.vy -= dy * c * wb * dt;
          }
        }
      }

      // integrate, with heavy damping (it's a thick fluid) and soft walls
      const damp = Math.pow(0.9, dt);
      for (let i = 0; i < n; i++) {
        const b = beads[i];
        b.vx *= damp;
        b.vy *= damp;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 26) {
          b.vx *= 26 / sp;
          b.vy *= 26 / sp;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < b.r) (b.x = b.r), (b.vx *= -0.3);
        if (b.x > W - b.r) (b.x = W - b.r), (b.vx *= -0.3);
        if (b.y < b.r) (b.y = b.r), (b.vy *= -0.3);
        if (b.y > H - b.r) (b.y = H - b.r), (b.vy *= -0.3);
      }

      // what the shader sees: where the magnet is, and how strong
      let tx = ix;
      let ty = iy;
      let tz = 0.1;
      if (holding || holdPower > 0.05) {
        tx = ptr.x;
        ty = ptr.y;
        tz = Math.max(0.25, holdPower);
      } else if (hovering) {
        tx = ptr.x;
        ty = ptr.y;
        tz = 0.22;
      }
      mag.x += (tx - mag.x) * 0.12 * dt;
      mag.y += (ty - mag.y) * 0.12 * dt;
      mag.z += (tz - mag.z) * 0.06 * dt;
    };

    // ── drawing ──
    const verts = new Float32Array(150 * 6 * 5);
    const CORNERS = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    const draw = (t) => {
      if (!target) return;
      // pass 1: splat beads into the field texture
      const fs = FW / W; // CSS px → field px
      let o = 0;
      for (let i = 0; i < beads.length; i++) {
        const b = beads[i];
        const x = b.x * fs;
        const y = (H - b.y) * fs;
        const R = b.r * 2.4 * fs; // wide, soft influence so neighbouring beads melt into one surface
        for (let c = 0; c < 12; c += 2) {
          verts[o++] = CORNERS[c];
          verts[o++] = CORNERS[c + 1];
          verts[o++] = x;
          verts[o++] = y;
          verts[o++] = R;
        }
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
      gl.viewport(0, 0, FW, FH);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(splat);
      gl.bindBuffer(gl.ARRAY_BUFFER, beadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, o), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(sp.corner);
      gl.vertexAttribPointer(sp.corner, 2, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(sp.bead);
      gl.vertexAttribPointer(sp.bead, 3, gl.FLOAT, false, 20, 8);
      gl.uniform2f(sp.res, FW, FH);
      gl.uniform1f(sp.scale, target.scale);
      gl.drawArrays(gl.TRIANGLES, 0, o / 5);
      gl.disableVertexAttribArray(sp.bead);

      // pass 2: shade the surface onto the page
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(surface);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(su.p);
      gl.vertexAttribPointer(su.p, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, target.tex);
      gl.uniform1i(su.uField, 0);
      gl.uniform2f(su.uRes, canvas.width, canvas.height);
      gl.uniform1f(su.uInv, 1 / target.scale);
      gl.uniform3f(su.uMag, mag.x * S, (H - mag.y) * S, mag.z);
      gl.uniform1f(su.uSigma, (modeRepel ? 210 : 120) * S);
      gl.uniform1f(su.uCell, 17 * S);
      gl.uniform1f(su.uTime, t);
      gl.uniform1f(su.uDark, dark);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize();
    window.addEventListener('resize', resize);

    // settle the scatter before the first frame, so beads start clear of the text
    const warmUp = () => {
      document.querySelectorAll(KEEP_CLEAR).forEach((el) => {
        if (!el.closest('[data-fluid-off], #site-menu')) visibleKeep.add(el);
      });
      for (let i = 0; i < 90; i++) step(1, i * 0.016);
      visibleKeep.clear();
      observed.forEach((el) => io.unobserve(el));
      observed = new Set();
      scanKeep();
    };
    warmUp();

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const loop = (now) => {
      const dt = Math.min(2.5, (now - last) / 16.667); // 1 = one 60fps frame
      last = now;
      const t = (now - t0) / 1000;
      step(dt, t);
      // while the preloader is up the beads keep settling, but nothing is drawn
      if (!pageCovered()) draw(t);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      // a still scatter, no motion
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(scanTimer);
      io.disconnect();
      unsubMode();
      stopTheme();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.documentElement.classList.remove('fluid-holding');
      if (target) {
        gl.deleteTexture(target.tex);
        gl.deleteFramebuffer(target.fb);
      }
      gl.deleteBuffer(quad);
      gl.deleteBuffer(beadBuf);
      gl.deleteProgram(splat);
      gl.deleteProgram(surface);
    };
  }, []);

  return <canvas ref={ref} className={s.canvas} aria-hidden="true" />;
}

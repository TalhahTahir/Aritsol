import { useEffect, useRef } from 'react';
import { cssColor, isDark, onThemeChange } from '../../fx/theme-colors';
import { pageCovered } from '../../fx/intro-gate';
import s from './HeroField.module.css';

/*
  Interactive dot field behind the hero (raw WebGL, no library).
  A grid of dots swells in slow waves; the cursor lifts the dots around it
  and a click sends out a ripple. Colours come from the theme tokens.
  Pauses when scrolled out of view; draws a single still frame for
  reduced-motion visitors; hides itself if WebGL is unavailable.
*/

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec3 uClick;      // x, y, start time
uniform float uScroll;
uniform float uCell;
uniform float uDark;
uniform vec3 uBg;
uniform vec3 uDot;
uniform vec3 uAccent;
uniform vec3 uSignal;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 cell = floor(frag / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 local = frag - center;
  vec2 uv = center / uRes;

  // slow, warped waves
  vec2 q = center / uRes.y * 2.2;
  float t = uTime * 0.06 + uScroll * 0.0004;
  vec2 warp = vec2(fbm(q + t), fbm(q - t + 3.1));
  float field = fbm(q * 1.3 + warp * 1.6 + vec2(t * 0.7, -t));
  float wave = smoothstep(0.5, 0.78, field);

  // cursor lift
  float md = distance(center, uMouse);
  float lift = uHover * exp(-(md * md) / (2.0 * pow(uCell * 6.5, 2.0)));

  // click ripple
  float ct = uTime - uClick.z;
  float cd = distance(center, uClick.xy);
  float ring = 0.0;
  if (ct > 0.0 && ct < 3.0) {
    ring = exp(-pow((cd - ct * uRes.y * 0.55) / (uCell * 2.2), 2.0)) * exp(-ct * 1.4);
  }

  float energy = clamp(wave * 0.85 + lift * 1.1 + ring * 1.2, 0.0, 1.6);

  // keep the left side (headline) calmer for legibility
  float calm = mix(0.32, 1.0, smoothstep(0.18, 0.72, uv.x));
  // and fade toward the bottom edge so the hero blends into the page
  calm *= smoothstep(0.0, 0.22, uv.y);

  float radius = mix(uCell * 0.07, uCell * 0.3, clamp(energy, 0.0, 1.0));
  float d = length(local);
  float dotMask = 1.0 - smoothstep(radius - 0.9, radius + 0.9, d);

  vec3 col = mix(uDot, uAccent, smoothstep(0.2, 0.85, energy));
  col = mix(col, uSignal, smoothstep(1.05, 1.45, energy));
  float alpha = dotMask * mix(0.45, 1.0, smoothstep(0.0, 0.6, energy)) * calm;
  alpha *= mix(0.85, 1.0, uDark);

  gl_FragColor = vec4(mix(uBg, col, alpha), 1.0);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('HeroField shader:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export default function HeroField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl || gl.isContextLost()) {
      canvas.style.display = 'none';
      return;
    }
    const prog = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      canvas.style.display = 'none';
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {};
    ['uRes', 'uTime', 'uMouse', 'uHover', 'uClick', 'uScroll', 'uCell', 'uDark', 'uBg', 'uDot', 'uAccent', 'uSignal'].forEach(
      (n) => (u[n] = gl.getUniformLocation(prog, n))
    );

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform1f(u.uCell, (window.innerWidth < 700 ? 18 : 24) * dpr);
      if (reduced) draw(performance.now());
    };

    const setColors = () => {
      const n = (c) => c.map((x) => x / 255);
      gl.uniform3fv(u.uBg, n(cssColor('--bg')));
      gl.uniform3fv(u.uDot, n(cssColor('--line-strong')));
      gl.uniform3fv(u.uAccent, n(cssColor('--accent')));
      gl.uniform3fv(u.uSignal, n(cssColor('--ink')));
      gl.uniform1f(u.uDark, isDark() ? 1 : 0);
      if (reduced) draw(performance.now());
    };

    const mouse = { x: -9999, y: -9999, hover: 0, target: 0 };
    let click = [-9999, -9999, -10];
    const t0 = performance.now();
    const time = (now) => (now - t0) / 1000;

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (r.bottom - e.clientY) * dpr; // GL origin is bottom-left
      mouse.target = e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0;
    };
    const onDown = (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      click = [(e.clientX - r.left) * dpr, (r.bottom - e.clientY) * dpr, time(performance.now())];
    };

    function draw(now) {
      mouse.hover += (mouse.target - mouse.hover) * 0.06;
      gl.uniform1f(u.uTime, reduced ? 12 : time(now));
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl.uniform1f(u.uHover, mouse.hover);
      gl.uniform3f(u.uClick, click[0], click[1], click[2]);
      gl.uniform1f(u.uScroll, window.scrollY * dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    let raf = 0;
    let visible = true;
    const loop = (now) => {
      if (!pageCovered()) draw(now);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const stopTheme = onThemeChange(setColors);
    resize();

    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      stopTheme();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      // Free GPU objects but keep the context: React StrictMode remounts
      // effects in development, and a lost context can't be reused.
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={ref} className={s.canvas} aria-hidden="true" />;
}

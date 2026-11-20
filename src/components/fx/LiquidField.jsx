import { useEffect, useRef } from 'react';
import s from './LiquidField.module.css';

/*
  Liquid surface for the footer (raw WebGL, no library).
  A slow, viscous midnight liquid with a gold sheen riding its ridges.
  The cursor stirs it: the liquid swirls around the pointer and is gently
  dragged along with its movement, then settles back. Everything is eased
  heavily so it feels calm rather than reactive.

  Performance: renders at half resolution (the surface is soft anyway),
  pauses off-screen, and draws one still frame for reduced-motion visitors.
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
uniform vec2 uVel;
uniform float uHover;
uniform vec3 uBase;
uniform vec3 uGold;
uniform vec3 uLight;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.045;

  // the cursor stirs the liquid: a swirl around it, plus a drag along its motion
  vec2 d = p - m;
  float infl = uHover * exp(-dot(d, d) * 4.5);
  float swirl = infl * (0.55 + min(length(uVel), 1.5) * 1.5);
  float sn = sin(swirl), cs = cos(swirl);
  p = m + mat2(cs, -sn, sn, cs) * d;
  p -= uVel * infl * 0.35;

  // layered domain warping gives the slow folding of a thick liquid
  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 w = vec2(fbm(p * 1.4 + 2.6 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p * 1.4 + 2.6 * q + vec2(8.3, 2.8) - t * 1.1));
  vec2 base = p * 1.4 + 2.4 * w;
  float h = fbm(base);
  float e = 0.012;
  float hx = fbm(base + vec2(e, 0.0));
  float hy = fbm(base + vec2(0.0, e));

  // light the height field like a glossy surface
  vec3 n = normalize(vec3(-(hx - h) / e * 0.22, -(hy - h) / e * 0.22, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(n, H), 0.0, 1.0), 70.0);
  float fres = pow(1.0 - n.z, 2.0);

  vec3 col = mix(uBase, uBase + vec3(0.03, 0.028, 0.026), smoothstep(0.3, 0.8, h));
  float ridge = smoothstep(0.5, 0.9, w.x * 0.55 + h * 0.65);
  col += uGold * (ridge * 0.2 * diff + spec * 0.5);
  col += uLight * (spec * 0.22 + fres * 0.05);
  col += uGold * infl * 0.05;

  // calmer near the top, where the footer links sit
  float calm = mix(1.0, 0.4, smoothstep(0.3, 0.98, uv.y));
  col = uBase + (col - uBase) * calm;

  gl_FragColor = vec4(col, 1.0);
}
`;

const SCALE = 0.5; // render resolution relative to CSS pixels

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('LiquidField shader:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export default function LiquidField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas.parentElement; // the footer: pointer anywhere over it stirs the liquid
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl || gl.isContextLost()) {
      canvas.style.display = 'none';
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      canvas.style.display = 'none';
      return;
    }
    const prog = gl.createProgram();
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
    ['uRes', 'uTime', 'uMouse', 'uVel', 'uHover', 'uBase', 'uGold', 'uLight'].forEach((n) => (u[n] = gl.getUniformLocation(prog, n)));
    // brand colours, fixed: the footer is midnight in both themes
    gl.uniform3f(u.uBase, 8 / 255, 9 / 255, 11 / 255);
    gl.uniform3f(u.uGold, 1, 201 / 255, 0);
    gl.uniform3f(u.uLight, 245 / 255, 243 / 255, 239 / 255);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 1;
    let H = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * SCALE));
      H = Math.max(1, Math.round(r.height * SCALE));
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(u.uRes, W, H);
      if (reduced) draw(performance.now());
    };

    // pointer state, heavily eased for a calm, viscous feel
    const target = { x: 0, y: 0, inside: false };
    const mouse = { x: 0, y: 0, vx: 0, vy: 0, hover: 0 };
    const t0 = performance.now();

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      target.x = (e.clientX - r.left) * SCALE;
      target.y = (r.bottom - e.clientY) * SCALE;
      if (!target.inside) {
        target.inside = true;
        mouse.x = target.x; // start stirring where the pointer came in
        mouse.y = target.y;
      }
      kick();
    };
    const onLeave = () => {
      target.inside = false;
    };

    function draw(now) {
      const time = (now - t0) / 1000;
      if (!target.inside) {
        // nobody touching it: a slow invisible current keeps it alive
        target.x = W * (0.5 + 0.35 * Math.sin(time * 0.11));
        target.y = H * (0.35 + 0.2 * Math.cos(time * 0.08));
      }
      const px = mouse.x;
      const py = mouse.y;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      mouse.vx += ((mouse.x - px) / H * 6 - mouse.vx) * 0.08;
      mouse.vy += ((mouse.y - py) / H * 6 - mouse.vy) * 0.08;
      mouse.hover += ((target.inside ? 1 : 0.35) - mouse.hover) * 0.03;

      gl.uniform1f(u.uTime, reduced ? 20 : time);
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl.uniform2f(u.uVel, mouse.vx, mouse.vy);
      gl.uniform1f(u.uHover, reduced ? 0 : mouse.hover);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    let raf = 0;
    let visible = false;
    const loop = (now) => {
      draw(now);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    function kick() {
      if (!raf && visible && !reduced) raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (reduced) draw(performance.now());

    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={ref} className={s.canvas} aria-hidden="true" />;
}

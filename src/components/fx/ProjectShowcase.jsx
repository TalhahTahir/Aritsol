import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowUpRight, FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi';
import { useContent } from '../../content/store';
import { sound } from '../../fx/sound';
import { pageCovered } from '../../fx/intro-gate';
import WorkCard from '../WorkCard.jsx';
import s from './ProjectShowcase.module.css';

/*
  ─────────────────────────────────────────────────────────────
  Project showcase: glowing curved screens on a turning cylinder
  (raw WebGL, no library).

  Each project's cover is mapped onto a curved screen. The screens are lit
  as if they emit light: a bloom pass adds the soft glow around them, and
  a faded mirror image gives a glossy floor. Backs of the screens show a
  dim reversed image, like real displays seen from behind.

  It turns slowly on its own, eases to a stop when you hover a screen, can
  be dragged or swiped, and a click on a screen opens that project.
  The camera follows the cursor: move left/right and it orbits round the
  cylinder, up/down and it rises or dips, with a slight roll for depth.
  The page still scrolls normally (vertical swipes are left alone), and it
  pauses when scrolled away. Without WebGL it falls back to project cards.

  variant="hero"    transparent background, sits on the page (homepage hero)
  variant="section" its own dark stage with a vignette
  ─────────────────────────────────────────────────────────────
*/

const SPAN_DEG = 50; // width of each screen around the cylinder
const H = 0.66; // screen height (cylinder radius = 1); 4:3 with the span above
const SEG = 40; // curve smoothness
const SPEED = 7; // idle turn, degrees per second
const FOV = 30;

// ── tiny matrix helpers (column-major) ──
const perspective = (fovy, aspect, near, far) => {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
};
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lookAt = (eye, target, up) => {
  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
};
const modelY = (theta, scale) => {
  const c = Math.cos(theta) * scale;
  const s = Math.sin(theta) * scale;
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
};
const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;

// ── shaders ──
const SCREEN_VS = `
attribute vec3 aPos;
attribute vec2 aUv;
uniform mat4 uProj, uView, uModel;
uniform float uMirror;
uniform float uFloor;
varying vec2 vUv;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  if (uMirror > 0.5) w.y = 2.0 * uFloor - w.y;
  vW = w.xyz;
  vN = normalize((uModel * vec4(aPos.x, 0.0, aPos.z, 0.0)).xyz);
  vUv = aUv;
  gl_Position = uProj * uView * w;
}`;

const SCREEN_FS = `
precision highp float;
uniform sampler2D uTex;
uniform float uHover;
uniform float uLoaded;
uniform float uMirror;
uniform float uFloor;
uniform vec3 uEye;
varying vec2 vUv;
varying vec3 vW;
varying vec3 vN;
void main() {
  bool front = gl_FrontFacing;
  if (uMirror > 0.5) front = !front;
  vec2 uv = front ? vUv : vec2(1.0 - vUv.x, vUv.y);
  vec3 c = uLoaded > 0.5 ? texture2D(uTex, uv).rgb : vec3(0.07, 0.07, 0.08);
  vec3 col;
  if (front) {
    col = c * (1.06 + 0.22 * uHover);            // screens emit light
  } else {
    col = c * 0.16 + vec3(0.015);                // dim, reversed back of the screen
  }
  // thin bright bezel on the screen edges
  float e = min(min(vUv.x, 1.0 - vUv.x) * 4.0, min(vUv.y, 1.0 - vUv.y) * 3.0);
  col += vec3(1.0, 0.92, 0.75) * (1.0 - smoothstep(0.0, 0.02, e)) * 0.25;
  // glancing angles catch a warm rim
  vec3 V = normalize(uEye - vW);
  float fr = pow(1.0 - abs(dot(normalize(vN), V)), 3.0);
  col += vec3(1.0, 0.82, 0.35) * fr * 0.12;
  float a = 1.0;
  if (uMirror > 0.5) {
    // the reflection: a faint, fading copy under the floor line
    a = 0.26 * smoothstep(uFloor - 0.5, uFloor, vW.y);
  }
  gl_FragColor = vec4(col * a, a);   // premultiplied
}`;

const QUAD_VS = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const BRIGHT_FS = `
precision mediump float;
uniform sampler2D uTex;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  float sat = l - min(c.r, min(c.g, c.b));
  // coloured light glows more than plain white, so white screens don't blow out
  gl_FragColor = vec4(c * smoothstep(0.35, 0.95, l) * (0.35 + 0.65 * sat), 1.0);
}`;

const BLUR_FS = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb * 0.227;
  c += texture2D(uTex, vUv + uDir * 1.385).rgb * 0.316;
  c += texture2D(uTex, vUv - uDir * 1.385).rgb * 0.316;
  c += texture2D(uTex, vUv + uDir * 3.231).rgb * 0.070;
  c += texture2D(uTex, vUv - uDir * 3.231).rgb * 0.070;
  gl_FragColor = vec4(c, 1.0);
}`;

const COMPOSE_FS = `
precision mediump float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uGlow;
uniform float uOpaque;
varying vec2 vUv;
void main() {
  vec4 sc = texture2D(uScene, vUv);
  vec3 b = texture2D(uBloom, vUv).rgb * uGlow;
  vec3 c = sc.rgb + b;
  float a = clamp(sc.a + max(b.r, max(b.g, b.b)), 0.0, 1.0);
  if (uOpaque > 0.5) {
    // gentle vignette keeps attention in the middle
    float v = smoothstep(1.15, 0.35, length((vUv - 0.5) * vec2(1.25, 1.0)));
    c *= mix(0.55, 1.0, v);
    a = 1.0;
  }
  c = c / (1.0 + c * 0.12);                       // soft highlight roll-off
  gl_FragColor = vec4(c, a);
}`;

function compile(gl, vs, fs) {
  const mk = (t, src) => {
    const sh = gl.createShader(t);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Showcase shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const v = mk(gl.VERTEX_SHADER, vs);
  const f = mk(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

function target(gl, w, h, depth) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  let rb = null;
  if (depth) {
    rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fb, rb, w, h };
}
const freeTarget = (gl, t) => {
  if (!t) return;
  gl.deleteTexture(t.tex);
  gl.deleteFramebuffer(t.fb);
  if (t.rb) gl.deleteRenderbuffer(t.rb);
};

export default function ProjectShowcase(props) {
  const { work } = useContent();
  const items = useMemo(() => work.filter((w) => w.image), [work]);
  if (!items.length) return null;
  // a new set of projects or images rebuilds the scene from scratch
  const key = items.map((w) => `${w.id}:${w.image}`).join('|');
  return <Showcase key={key} items={items} {...props} />;
}

function Showcase({ variant = 'section', items: ITEMS }) {
  const { getPractice } = useContent();
  const hero = variant === 'hero';
  const n = ITEMS.length;
  const step = 360 / n;
  const canvasRef = useRef(null);
  const st = useRef({ rot: 0, vel: 0, speed: 0, drag: null, moved: 0, target: null, resumeAt: 0, hover: -1, paused: false });
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [fallback, setFallback] = useState(false);
  const navigate = useNavigate();
  st.current.paused = paused;

  // kept in a ref so the WebGL setup never re-runs just because navigate changed
  const openRef = useRef(null);
  openRef.current = (i) => {
    const item = ITEMS[i];
    if (item.links?.live) window.open(item.links.live, '_blank', 'noopener');
    else navigate(`/work#${item.id}`);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: hero, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl || gl.isContextLost()) {
      setFallback(true);
      return;
    }
    const screen = compile(gl, SCREEN_VS, SCREEN_FS);
    const bright = compile(gl, QUAD_VS, BRIGHT_FS);
    const blur = compile(gl, QUAD_VS, BLUR_FS);
    const compose = compile(gl, QUAD_VS, COMPOSE_FS);
    if (!screen || !bright || !blur || !compose) {
      setFallback(true);
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s0 = st.current;

    // ── geometry: one curved screen centred at angle 0, reused for every project ──
    const span = (SPAN_DEG * Math.PI) / 180;
    const verts = [];
    const idx = [];
    for (let i = 0; i <= SEG; i++) {
      const a = -span / 2 + (i / SEG) * span;
      const u = i / SEG;
      verts.push(Math.sin(a), H / 2, Math.cos(a), u, 0);
      verts.push(Math.sin(a), -H / 2, Math.cos(a), u, 1);
    }
    for (let i = 0; i < SEG; i++) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const L = (p, names) => Object.fromEntries(names.map((nm) => [nm, gl.getUniformLocation(p, nm)]));
    const su = L(screen, ['uProj', 'uView', 'uModel', 'uMirror', 'uFloor', 'uTex', 'uHover', 'uLoaded', 'uEye']);
    const sa = { pos: gl.getAttribLocation(screen, 'aPos'), uv: gl.getAttribLocation(screen, 'aUv') };
    const bu = L(bright, ['uTex']);
    const blu = L(blur, ['uTex', 'uDir']);
    const cu = L(compose, ['uScene', 'uBloom', 'uGlow', 'uOpaque']);
    const qa = [bright, blur, compose].map((p) => gl.getAttribLocation(p, 'p'));

    // ── textures ──
    const tex = ITEMS.map(() => ({ t: gl.createTexture(), loaded: false }));
    ITEMS.forEach((item, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!alive) return;
        gl.bindTexture(gl.TEXTURE_2D, tex[i].t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        tex[i].loaded = true;
      };
      img.src = item.image;
    });

    // ── sizes & render targets ──
    let W = 1;
    let Hh = 1;
    let scene = null;
    let bloomA = null;
    let bloomB = null;
    let aspect = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(2, Math.round(r.width * dpr));
      Hh = Math.max(2, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = Hh;
      aspect = W / Hh;
      [scene, bloomA, bloomB].forEach((t) => freeTarget(gl, t));
      scene = target(gl, W, Hh, true);
      const bw = Math.max(2, Math.round(W / 4));
      const bh = Math.max(2, Math.round(Hh / 4));
      bloomA = target(gl, bw, bh, false);
      bloomB = target(gl, bw, bh, false);
    };

    // camera: a little above, looking slightly down at the cylinder
    // the camera orbits with the cursor: yaw (left/right), height (up/down), a little roll
    const look = { yaw: 0, lift: 0, roll: 0, tYaw: 0, tLift: 0, tRoll: 0 };
    const camera = () => {
      // far enough back that the front of the cylinder fills the frame (the far sides may crop)
      const fit = hero ? 2.15 : 2.7;
      const dist = Math.max(hero ? 2.6 : 3.0, fit / (2 * Math.tan((FOV * Math.PI) / 360) * aspect));
      const eye = [Math.sin(look.yaw) * dist, 0.4 + look.lift, Math.cos(look.yaw) * dist];
      const tgt = [0, hero ? -0.2 : -0.25, 0];
      const up = [Math.sin(look.roll), Math.cos(look.roll), 0];
      return { eye, tgt, up, view: lookAt(eye, tgt, up), proj: perspective((FOV * Math.PI) / 180, aspect, 0.1, 20) };
    };

    // ── picking: which screen is under the pointer? ──
    const pick = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * 2 - 1;
      const y = -(((clientY - r.top) / r.height) * 2 - 1);
      const { eye, tgt, up: camUp } = camera();
      const f = norm(sub(tgt, eye));
      const rt = norm(cross(f, camUp));
      const up = cross(rt, f);
      const th = Math.tan((FOV * Math.PI) / 360);
      const d = norm([
        f[0] + x * th * aspect * rt[0] + y * th * up[0],
        f[1] + x * th * aspect * rt[1] + y * th * up[1],
        f[2] + x * th * aspect * rt[2] + y * th * up[2],
      ]);
      // ray vs cylinder x² + z² = 1 (the nearer, outside surface)
      const a = d[0] * d[0] + d[2] * d[2];
      const b = 2 * (eye[0] * d[0] + eye[2] * d[2]);
      const c = eye[0] * eye[0] + eye[2] * eye[2] - 1;
      const disc = b * b - 4 * a * c;
      if (disc < 0) return -1;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      const p = [eye[0] + d[0] * t, eye[1] + d[1] * t, eye[2] + d[2] * t];
      if (Math.abs(p[1]) > H / 2) return -1;
      const ang = (Math.atan2(p[0], p[2]) * 180) / Math.PI;
      for (let i = 0; i < n; i++) {
        if (Math.abs(wrap180(ang - (i * step + s0.rot))) < SPAN_DEG / 2) return i;
      }
      return -1;
    };

    // ── draw ──
    const hover = ITEMS.map(() => 0);
    const drawScreens = (cam, mirror) => {
      gl.useProgram(screen);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.enableVertexAttribArray(sa.pos);
      gl.vertexAttribPointer(sa.pos, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(sa.uv);
      gl.vertexAttribPointer(sa.uv, 2, gl.FLOAT, false, 20, 12);
      gl.uniformMatrix4fv(su.uProj, false, cam.proj);
      gl.uniformMatrix4fv(su.uView, false, cam.view);
      gl.uniform1f(su.uMirror, mirror ? 1 : 0);
      gl.uniform1f(su.uFloor, -H / 2 - 0.06);
      gl.uniform3fv(su.uEye, cam.eye);
      gl.uniform1i(su.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      for (let i = 0; i < n; i++) {
        const theta = ((i * step + s0.rot) * Math.PI) / 180;
        gl.uniformMatrix4fv(su.uModel, false, modelY(theta, 1 + hover[i] * 0.04));
        gl.uniform1f(su.uHover, hover[i]);
        gl.uniform1f(su.uLoaded, tex[i].loaded ? 1 : 0);
        gl.bindTexture(gl.TEXTURE_2D, tex[i].t);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }
      gl.disableVertexAttribArray(sa.uv);
    };
    const fullscreen = (prog, attr) => {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(attr);
      gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const draw = () => {
      const cam = camera();
      // 1. the scene
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb);
      gl.viewport(0, 0, W, Hh);
      if (hero) gl.clearColor(0, 0, 0, 0);
      else gl.clearColor(0.031, 0.035, 0.043, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      drawScreens(cam, true); // reflection on the floor
      drawScreens(cam, false);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      // 2. bright parts → small texture → blur twice
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fb);
      gl.viewport(0, 0, bloomA.w, bloomA.h);
      gl.useProgram(bright);
      gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      gl.uniform1i(bu.uTex, 0);
      fullscreen(bright, qa[0]);
      for (let k = 0; k < 2; k++) {
        const spread = 1 + k;
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fb);
        gl.useProgram(blur);
        gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
        gl.uniform1i(blu.uTex, 0);
        gl.uniform2f(blu.uDir, spread / bloomA.w, 0);
        fullscreen(blur, qa[1]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fb);
        gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
        gl.uniform2f(blu.uDir, 0, spread / bloomA.h);
        fullscreen(blur, qa[1]);
      }
      // 3. combine on screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, Hh);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(compose);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      gl.uniform1i(cu.uScene, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      gl.uniform1i(cu.uBloom, 1);
      gl.uniform1f(cu.uGlow, hero ? 0.95 : 1.15);
      gl.uniform1f(cu.uOpaque, hero ? 0 : 1);
      fullscreen(compose, qa[2]);
      gl.activeTexture(gl.TEXTURE0);
    };

    // ── loop ──
    let alive = true;
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let lastFront = -1;
    const tick = (now) => {
      if (!alive) return;
      if (pageCovered()) {
        // the preloader is still up: wait without drawing
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (s0.target !== null) {
        const diff = s0.target - s0.rot;
        s0.rot += diff * Math.min(1, dt * 5);
        if (Math.abs(diff) < 0.05) s0.target = null;
      } else if (!s0.drag) {
        if (Math.abs(s0.vel) > 1) {
          s0.rot += s0.vel * dt;
          s0.vel *= Math.pow(0.05, dt);
        } else {
          const want = !reduced && !s0.paused && s0.hover < 0 && now > s0.resumeAt ? SPEED : 0;
          s0.speed += (want - s0.speed) * Math.min(1, dt * 2);
          s0.rot -= s0.speed * dt;
        }
      }
      for (let i = 0; i < n; i++) hover[i] += ((s0.hover === i ? 1 : 0) - hover[i]) * Math.min(1, dt * 8);
      const ease = Math.min(1, dt * 2.6);
      look.yaw += (look.tYaw - look.yaw) * ease;
      look.lift += (look.tLift - look.lift) * ease;
      look.roll += (look.tRoll - look.roll) * ease;
      const front = ((Math.round(-s0.rot / step) % n) + n) % n;
      if (front !== lastFront) {
        if (lastFront !== -1 && (s0.drag || Math.abs(s0.vel) > 15)) sound.click(0.35);
        lastFront = front;
        setActive(front);
      }
      draw();
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && alive) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      if (!raf) draw();
    });
    ro.observe(canvas);
    resize();

    // ── cursor steers the camera ──
    const onLook = (e) => {
      if (reduced || e.pointerType === 'touch') return;
      const r = canvas.getBoundingClientRect();
      const nx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      const ny = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
      const near = Math.abs(nx) < 1.8 && Math.abs(ny) < 1.8;
      const cx = Math.max(-1, Math.min(1, nx));
      const cy = Math.max(-1, Math.min(1, ny));
      look.tYaw = near ? cx * 0.4 : 0; // ±23°
      look.tLift = near ? -cy * 0.45 : 0; // cursor up → camera rises
      look.tRoll = near ? -cx * 0.04 : 0; // ±2.3°
    };
    window.addEventListener('pointermove', onLook, { passive: true });

    // ── pointer: hover, drag / swipe, click ──
    const onMove = (e) => {
      if (s0.drag) return;
      const i = pick(e.clientX, e.clientY);
      if (i !== s0.hover) {
        s0.hover = i;
        setHovered(i);
        canvas.style.cursor = i >= 0 ? 'pointer' : 'grab';
      }
    };
    const onLeave = () => {
      s0.hover = -1;
      setHovered(-1);
    };
    const onDown = (e) => {
      if (e.button !== 0) return;
      s0.drag = { x: e.clientX, y: e.clientY, last: e.clientX, t: performance.now() };
      s0.moved = 0;
      s0.vel = 0;
      s0.target = null;
      const move = (ev) => {
        const d = s0.drag;
        if (!d) return;
        const now = performance.now();
        const dx = ev.clientX - d.last;
        s0.moved += Math.abs(dx);
        s0.rot += dx * 0.18;
        s0.vel = ((dx * 0.18) / Math.max(1, now - d.t)) * 1000;
        d.last = ev.clientX;
        d.t = now;
        if (s0.moved > 6) canvas.style.cursor = 'grabbing';
      };
      const up = (ev) => {
        const d = s0.drag;
        s0.drag = null;
        s0.resumeAt = performance.now() + 2500;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (ev.type === 'pointerup' && d && s0.moved < 6) {
          const i = pick(ev.clientX, ev.clientY);
          if (i >= 0) {
            s0.vel = 0;
            openRef.current(i);
          }
        }
        canvas.style.cursor = s0.hover >= 0 ? 'pointer' : 'grab';
      };
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    };
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onLook);
      [scene, bloomA, bloomB].forEach((t) => freeTarget(gl, t));
      tex.forEach((x) => gl.deleteTexture(x.t));
      [vbo, ibo, quad].forEach((b) => gl.deleteBuffer(b));
      [screen, bright, blur, compose].forEach((p) => gl.deleteProgram(p));
    };
  }, [n, step, hero]);

  const goTo = (i) => {
    const s0 = st.current;
    const cur = -s0.rot / step;
    let d = i - (((cur % n) + n) % n);
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    s0.target = -(cur + d) * step;
    s0.resumeAt = performance.now() + 4000;
  };

  if (fallback) {
    return (
      <div className={`container ${s.fallback}`}>
        {ITEMS.slice(0, hero ? 1 : 3).map((w) => (
          <WorkCard key={w.id} item={w} />
        ))}
      </div>
    );
  }

  const shown = ITEMS[hovered >= 0 ? hovered : active];
  const practice = getPractice(shown.practice);

  return (
    <div className={`${s.wrap} ${hero ? s.hero : ''}`}>
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />

      {!hero && (
        <div className={`${hero ? '' : 'container'} ${s.bar}`}>
          <div className={s.caption} aria-live="polite">
            <span className={s.tag}>
              {practice?.short}
              {shown.sample && <em className={s.sample}>Sample project</em>}
            </span>
            <Link to={`/work#${shown.id}`} className={s.title} key={shown.id}>
              {shown.title} <FiArrowUpRight aria-hidden />
            </Link>
          </div>
          <div className={s.controls}>
            <button type="button" className={s.btn} onClick={() => goTo((active - 1 + n) % n)} aria-label="Previous project">
              <FiChevronLeft />
            </button>
            <div className={s.dots} role="tablist" aria-label="Projects">
              {ITEMS.map((w, i) => (
                <button
                  key={w.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={w.title}
                  className={s.dot}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <button type="button" className={s.btn} onClick={() => goTo((active + 1) % n)} aria-label="Next project">
              <FiChevronRight />
            </button>
            <button
              type="button"
              className={s.btn}
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume rotation' : 'Pause rotation'}
            >
              {paused ? <FiPlay size={14} /> : <FiPause size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

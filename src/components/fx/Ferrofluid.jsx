import { useEffect, useRef } from 'react';
import s from './Ferrofluid.module.css';

/*
  Glossy black ferrofluid (raw WebGL, no library).

  Magnetic fields pull pools of black liquid together; inside a pool the
  surface rises into a lattice of sharp spikes that grow toward each
  magnet. The surface is shaded like a mirror-black liquid: soft studio
  light strips and a thin gold rim reflect off the spikes.

  Magnets: the cursor is a magnet (spikes rise and follow it, slowly),
  a click gives a short stronger pull, and two invisible magnets drift on
  their own so the fluid is alive even when nobody is touching it.

  Renders at reduced resolution, pauses off-screen, one still frame for
  reduced-motion visitors, hides itself if WebGL is unavailable.
*/

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uCell;
uniform vec3 uM0;   // cursor magnet: x, y, strength
uniform vec3 uM1;   // drifting magnets
uniform vec3 uM2;
uniform float uR0;  // magnet radii (px)
uniform float uR1;

const vec3 BG = vec3(0.031, 0.035, 0.043);
const vec3 GOLD = vec3(1.0, 0.79, 0.0);
const vec3 WHITE = vec3(0.96, 0.95, 0.94);

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

float field(vec2 x) {
  vec2 a = x - uM0.xy, b = x - uM1.xy, c = x - uM2.xy;
  return uM0.z * exp(-dot(a, a) / (2.0 * uR0 * uR0))
       + uM1.z * exp(-dot(b, b) / (2.0 * uR1 * uR1))
       + uM2.z * exp(-dot(c, c) / (2.0 * uR1 * uR1));
}

// nearest centre on a hexagonal lattice (spikes pack hexagonally, like real ferrofluid)
vec2 hexCentre(vec2 p) {
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  return p - (dot(a, a) < dot(b, b) ? a : b);
}

float pool(float f) { return smoothstep(0.2, 0.38, f); }

float height(vec2 x) {
  float f = field(x);
  vec2 c = hexCentre(x / uCell) * uCell;
  float fc = field(c);
  // a gentle shimmer so the spikes breathe
  fc *= 1.0 + 0.05 * sin(uTime * 1.6 + hash(c) * 6.283);
  // stronger field: taller spikes with wider bases; weak field: small bumps
  float g = smoothstep(0.2, 1.0, fc);
  float rad = mix(0.18, 0.6, g);   // at full strength the bases touch, like a real spiked pool
  float d = length(x - c) / uCell;
  float prof = max(0.0, 1.0 - d / rad);
  float spike = g * 2.9 * pow(prof, 1.5);   // concave sides, sharp tip
  float dome = smoothstep(0.1, 1.3, f) * 0.9;
  return (dome + spike) * pool(f);
}

vec3 env(vec3 r) {
  // a dark studio: a soft overhead light strip, a faint second strip, a gold rim from the side
  float strip = smoothstep(0.42, 0.6, r.y) * (1.0 - smoothstep(0.82, 0.97, r.y));
  float strip2 = smoothstep(0.55, 0.75, -r.y) * 0.25;
  float rim = smoothstep(0.45, 0.9, r.x) * 0.55;
  return WHITE * (strip * 0.9 + strip2) + GOLD * rim;
}

void main() {
  vec2 x = gl_FragCoord.xy;
  float f = field(x);
  float m = pool(f);

  vec3 col = BG;
  if (m > 0.001) {
    float h = height(x);
    float hx = height(x + vec2(1.0, 0.0));
    float hy = height(x + vec2(0.0, 1.0));
    vec3 n = normalize(vec3(-(hx - h) * uCell * 0.55, -(hy - h) * uCell * 0.55, 1.0));
    vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
    float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);
    vec3 L = normalize(vec3(-0.35, 0.7, 0.62));
    vec3 L2 = normalize(vec3(0.75, -0.25, 0.6));
    float spec = pow(max(dot(r, L), 0.0), 70.0);
    float spec2 = pow(max(dot(r, L2), 0.0), 30.0);

    vec3 fluid = vec3(0.004, 0.005, 0.007);           // deep glossy black
    fluid += env(r) * (0.04 + 0.9 * fres);            // mirror reflections on the slopes
    fluid += WHITE * spec * 1.1;                      // sharp highlights along the spikes
    fluid += GOLD * spec2 * 0.35;                     // warm rim from the side
    fluid *= 0.8 + 0.2 * smoothstep(0.0, 1.2, h);     // occlusion between spikes

    // edge of the pool catches a thin line of light
    float edge = smoothstep(0.0, 0.25, m) * (1.0 - smoothstep(0.25, 0.9, m));
    fluid += WHITE * edge * 0.06;

    col = mix(BG, fluid, m);
  }

  // soft vignette keeps the eye on the centre
  vec2 uv = gl_FragCoord.xy / uRes;
  col *= 0.75 + 0.25 * smoothstep(1.1, 0.25, length(uv - 0.5));
  gl_FragColor = vec4(col, 1.0);
}
`;

const SCALE = 0.75; // render resolution relative to CSS pixels

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('Ferrofluid shader:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export default function Ferrofluid() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas.parentElement;
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
    ['uRes', 'uTime', 'uCell', 'uM0', 'uM1', 'uM2', 'uR0', 'uR1'].forEach((n) => (u[n] = gl.getUniformLocation(prog, n)));

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
      const narrow = r.width < 700;
      gl.uniform1f(u.uCell, (narrow ? 24 : 34) * SCALE);
      gl.uniform1f(u.uR0, (narrow ? 90 : 125) * SCALE);
      gl.uniform1f(u.uR1, (narrow ? 110 : 165) * SCALE);
      if (reduced) draw(performance.now());
    };

    const target = { x: 0, y: 0, inside: false };
    const mag = { x: 0, y: 0, power: 0, pulse: 0 };
    const t0 = performance.now();

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      target.x = (e.clientX - r.left) * SCALE;
      target.y = (r.bottom - e.clientY) * SCALE;
      if (!target.inside) {
        target.inside = true;
        mag.x = target.x;
        mag.y = target.y;
      }
      kick();
    };
    const onLeave = () => {
      target.inside = false;
    };
    const onDown = () => {
      mag.pulse = 1; // a short, stronger pull
    };

    function draw(now) {
      const t = (now - t0) / 1000;
      // the cursor magnet follows slowly, like dragging a magnet under a dish
      mag.x += (target.x - mag.x) * 0.07;
      mag.y += (target.y - mag.y) * 0.07;
      mag.power += ((target.inside ? 1 : 0) - mag.power) * 0.035;
      mag.pulse *= 0.94;

      // two drifting magnets: one between the portraits, one in the open space beside the heading
      const m1x = W * (0.5 + 0.07 * Math.sin(t * 0.17));
      const m1y = H * (0.3 + 0.07 * Math.cos(t * 0.13));
      const m2x = W * (0.78 + 0.06 * Math.cos(t * 0.11 + 1.2));
      const m2y = H * (0.74 + 0.05 * Math.sin(t * 0.15 + 0.4));
      const idle = 1.0 + 0.12 * Math.sin(t * 0.4);

      gl.uniform1f(u.uTime, reduced ? 3 : t);
      gl.uniform3f(u.uM0, mag.x, mag.y, mag.power * (1.15 + mag.pulse * 0.7));
      gl.uniform3f(u.uM1, m1x, m1y, idle);
      gl.uniform3f(u.uM2, m2x, m2y, idle * 0.85);
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

    if (!reduced) {
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointerdown', onDown, { passive: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onDown);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={ref} className={s.canvas} aria-hidden="true" />;
}

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/* =========================================================
   "Liquidity Field" — a living order-book terrain.
   Thousands of GPU-animated glowing bars over a foggy
   horizon, gradient sky, bloom, parallax + scroll camera.
   Buildless (importmap). Progressive enhancement: any
   failure removes the canvas and the CSS mesh shows instead.
   ========================================================= */

const loaderEl = document.getElementById("loader");
function hideLoader() { if (loaderEl) loaderEl.classList.add("done"); }

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

const canvas = document.getElementById("webgl");

function bail() {
  if (canvas) canvas.remove();
  document.body.classList.add("no-webgl");
  hideLoader();
}

if (!canvas || reduceMotion) {
  bail();
} else {
  try { init(); } catch (err) { console.error(err); bail(); }
}

function init() {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !isMobile, alpha: false, powerPreference: "high-performance",
  });
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color(0x04070a);
  scene.fog = new THREE.FogExp2(fogColor, 0.016);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 320);
  const camBase = new THREE.Vector3(0, 7, 30);
  camera.position.copy(camBase);

  /* ---------------- Gradient sky dome ---------------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(180, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x061318) },
        uBottom: { value: new THREE.Color(0x02050a) },
        uGlow: { value: new THREE.Color(0x0d5f52) },
      },
      vertexShader: `
        varying vec3 vDir;
        void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vDir;
        uniform vec3 uTop, uBottom, uGlow;
        void main(){
          float h = vDir.y * 0.5 + 0.5;
          vec3 col = mix(uBottom, uTop, smoothstep(0.35, 0.85, h));
          // horizon glow, biased to the left "market open" side
          float horizon = smoothstep(0.62, 0.5, abs(vDir.y));
          float side = smoothstep(-0.4, 0.9, vDir.x);
          col += uGlow * horizon * (0.35 + 0.5 * side);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  scene.add(sky);

  /* ---------------- Radial glow floor ---------------- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 320),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: true,
      uniforms: { uColor: { value: new THREE.Color(0x0a6f61) } },
      vertexShader: `
        varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){
          vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          #include <fog_vertex>
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vW; uniform vec3 uColor;
        #include <fog_pars_fragment>
        void main(){
          float d = length(vW.xz);
          float glow = smoothstep(130.0, 0.0, d);
          gl_FragColor = vec4(uColor * glow * 0.4, glow * 0.55);
          #include <fog_fragment>
        }
      `,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  scene.add(floor);

  /* ---------------- The bar field (GPU-animated) ---------------- */
  const GX = isMobile ? 40 : 74;
  const GZ = isMobile ? 26 : 48;
  const SP = 1.08;
  const count = GX * GZ;

  const barMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: {
      uTime: { value: 0 },
      uLow: { value: new THREE.Color(0x0a2a2b) },
      uMid: { value: new THREE.Color(0x0f9f86) },
      uHigh: { value: new THREE.Color(0x5affd6) },
      uBear: { value: new THREE.Color(0xff5d73) },
    },
    vertexShader: `
      uniform float uTime;
      varying float vH; varying float vBear; varying vec3 vObj;
      #include <fog_pars_vertex>
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
      void main(){
        vec3 off = vec3(0.0);
        #ifdef USE_INSTANCING
          off = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #endif
        vec2 cell = off.xz;
        float d = length(cell);
        float w1 = sin(d * 0.24 - uTime * 1.5) * 0.5 + 0.5;
        float w2 = sin(cell.x * 0.33 + uTime * 0.8) * 0.5 + 0.5;
        float w3 = cos(cell.y * 0.0 + off.z * 0.3 - uTime * 1.1) * 0.5 + 0.5;
        float n  = hash(floor(cell));
        float h  = 0.4 + w1 * 3.0 + w2 * 1.7 + w3 * 1.3 + n * 2.4;
        h = max(h, 0.22);
        vH = h;
        vBear = step(0.84, hash(floor(cell) + 13.7));
        vec3 p = position;
        p.y = (p.y + 0.5) * h;
        vObj = p;
        vec4 world = vec4(p, 1.0);
        #ifdef USE_INSTANCING
          world = instanceMatrix * world;
        #endif
        vec4 mv = modelViewMatrix * world;
        #include <fog_vertex>
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uLow, uMid, uHigh, uBear;
      varying float vH; varying float vBear; varying vec3 vObj;
      #include <fog_pars_fragment>
      void main(){
        float t = clamp(vH / 6.5, 0.0, 1.0);
        vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.55, t));
        col = mix(col, uHigh, smoothstep(0.55, 1.0, t));
        col = mix(col, uBear, vBear * 0.85);
        float tip = clamp(vObj.y / max(vH, 0.001), 0.0, 1.0);
        col *= 0.45 + tip * 1.15;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `,
  });

  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 1, 0.5), barMat, count);
  bars.frustumCulled = false;
  const dummy = new THREE.Object3D();
  let i = 0;
  for (let x = 0; x < GX; x++) {
    for (let z = 0; z < GZ; z++) {
      dummy.position.set((x - (GX - 1) / 2) * SP, 0, (z - (GZ - 1) / 2) * SP);
      dummy.updateMatrix();
      bars.setMatrixAt(i++, dummy.matrix);
    }
  }
  bars.instanceMatrix.needsUpdate = true;
  scene.add(bars);

  /* ---------------- Distant "tick" starfield ---------------- */
  const tickN = isMobile ? 350 : 700;
  const tickGeo = new THREE.BufferGeometry();
  const tp = new Float32Array(tickN * 3);
  for (let k = 0; k < tickN; k++) {
    tp[k * 3] = (Math.random() - 0.5) * 260;
    tp[k * 3 + 1] = Math.random() * 70 + 6;
    tp[k * 3 + 2] = -Math.random() * 200 - 20;
  }
  tickGeo.setAttribute("position", new THREE.BufferAttribute(tp, 3));
  const ticks = new THREE.Points(
    tickGeo,
    new THREE.PointsMaterial({ color: 0x4fe6c8, size: 0.5, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  scene.add(ticks);

  /* ---------------- Post-processing (bloom) ---------------- */
  let composer = null;
  if (!isMobile) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.55, 0.16
    );
    composer.addPass(bloom);
  }

  /* ---------------- Interaction: parallax + scroll ---------------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5);
    pointer.ty = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  function scrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.75));
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
  }
  window.addEventListener("resize", onResize, { passive: true });

  /* ---------------- Loop ---------------- */
  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); requestAnimationFrame(loop); }
  });

  let framesShown = 0;
  const target = new THREE.Vector3();

  function loop() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    barMat.uniforms.uTime.value = t;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    const sp = scrollProgress();
    // As you scroll down, rise above the field and tilt down over the "market".
    camera.position.x = camBase.x + pointer.x * 6 + Math.sin(t * 0.08) * 1.5;
    camera.position.y = camBase.y + sp * 20 - pointer.y * 3;
    camera.position.z = camBase.z - sp * 6;

    target.set(0 + pointer.x * 3, 2 - sp * 10, -14 - sp * 12);
    camera.lookAt(target);

    ticks.rotation.y = t * 0.01;

    if (composer) composer.render(); else renderer.render(scene, camera);

    if (framesShown < 2) { framesShown++; if (framesShown === 2) hideLoader(); }
    requestAnimationFrame(loop);
  }
  onResize();
  requestAnimationFrame(loop);

  // Safety: never let the loader linger.
  setTimeout(hideLoader, 3500);
}

import "./style.css";
import * as THREE from "three";
import Matter from "matter-js";
import { celebrateShot, normalizeRoomCode, scorePower } from "./game-rules.js";

const { Engine, Bodies, Body, Composite } = Matter;
const WORLD = { width: 420, height: 760 };
const app = document.querySelector("#app");

const saved = JSON.parse(localStorage.getItem("golf-masters-save") || "{}");
const gameState = {
  sound: saved.sound !== false,
  hole: saved.hole || 41,
  best: saved.best || 1,
  totalShots: saved.totalShots || 286,
  currentShots: 0,
  answerTimer: 15,
  answering: false,
};

app.innerHTML = `
  <main class="app-frame">
    <section class="menu-view" data-view="menu">
      <canvas id="menu-scene" class="menu-scene" aria-hidden="true"></canvas>
      <div class="grain" aria-hidden="true"></div>

      <header class="topbar">
        <a class="brand" href="#" aria-label="Golf Masters home">
          <span class="brand-mark"><span></span></span>
          <span class="brand-copy"><strong>GOLF</strong><em>MASTERS</em></span>
        </a>
        <div class="top-actions">
          <span class="save-status"><i></i> Progress saved</span>
          <button class="icon-button" data-action="sound" aria-label="Toggle sound"><span data-sound-icon>♫</span></button>
          <button class="avatar" data-action="stats" aria-label="Open player stats">LS</button>
        </div>
      </header>

      <div class="menu-content">
        <section class="hero-copy" aria-labelledby="game-title">
          <p class="eyebrow"><span>NEW SEASON</span> THE GREEN AWAITS</p>
          <h1 id="game-title">Read the green.<br><span>Master the shot.</span></h1>
          <p class="hero-intro">A puzzle-first golf odyssey. Bank, bounce, and bend your way through more than 1,500 handcrafted courses.</p>
          <div class="hero-badges" aria-label="Game features">
            <span><b>1,500+</b> courses</span>
            <span><b>2P</b> cross-platform</span>
            <span><b>∞</b> no stroke limit</span>
          </div>
        </section>

        <section class="course-teaser" aria-label="Featured course preview">
          <div class="teaser-head">
            <span>COURSE PREVIEW</span>
            <strong>#041</strong>
          </div>
          <div class="teaser-course" aria-hidden="true">
            <div class="teaser-hole"></div>
            <div class="teaser-wind"><i></i><i></i><i></i></div>
            <div class="teaser-gate"><span></span></div>
            <div class="teaser-wall wall-one"></div>
            <div class="teaser-wall wall-two"></div>
            <div class="teaser-ball"></div>
          </div>
          <div class="teaser-foot"><span>COASTAL CIRCUIT</span><em>Tricky</em></div>
        </section>

        <nav class="play-menu" aria-label="Play Golf Masters">
          <div class="menu-label"><span>CHOOSE YOUR GAME</span><i></i></div>
          <button class="mode-card primary-mode" data-action="solo">
            <span class="mode-icon golf-icon"><i></i></span>
            <span class="mode-copy"><strong>SOLO PLAY</strong><small>Continue course ${String(gameState.hole).padStart(3, "0")}</small></span>
            <span class="arrow">→</span>
          </button>
          <button class="mode-card" data-action="cpu">
            <span class="mode-icon cpu-icon">CPU</span>
            <span class="mode-copy"><strong>VERSUS CPU</strong><small>Challenge the club pro</small></span>
            <span class="arrow">→</span>
          </button>
          <button class="mode-card" data-action="multiplayer">
            <span class="mode-icon versus-icon"><i></i><b></b></span>
            <span class="mode-copy"><strong>MULTIPLAYER</strong><small>Create or join a room</small></span>
            <span class="live-dot">LIVE</span>
            <span class="arrow">→</span>
          </button>
          <div class="utility-menu">
            <button data-action="courses"><span>▦</span> Courses</button>
            <button data-action="stats"><span>↗</span> Stats</button>
            <button data-action="settings"><span>⚙</span> Settings</button>
          </div>
        </nav>
      </div>

      <footer class="menu-footer">
        <span><i></i> ONLINE</span>
        <p>FANTOMZONE CLUBHOUSE</p>
        <span>v0.1 • MENU PREVIEW</span>
      </footer>
    </section>

    <section class="game-view" data-view="game" hidden>
      <header class="game-toolbar">
        <button class="exit-button" data-action="exit-game">← <span>EXIT</span></button>
        <div class="hole-title"><small>COASTAL CIRCUIT</small><strong>HOLE ${String(gameState.hole).padStart(3, "0")}</strong></div>
        <div class="shot-pill"><small>SHOTS</small><strong data-shot-count>0</strong></div>
        <button class="icon-button light" data-action="sound" aria-label="Toggle sound"><span data-sound-icon>♫</span></button>
      </header>

      <div class="game-layout">
        <section class="play-column">
          <div class="question-card" data-question-card>
            <div class="question-kicker"><span>CLUBHOUSE CHALLENGE</span><b data-answer-timer>15</b></div>
            <p>Which club typically sends the ball the farthest?</p>
            <div class="answer-row" role="group" aria-label="Question answers">
              <button data-answer="Putter">A&nbsp; Putter</button>
              <button data-answer="Driver">B&nbsp; Driver</button>
              <button data-answer="Wedge">C&nbsp; Wedge</button>
            </div>
            <small data-answer-status>The question stays on screen while every player answers.</small>
          </div>

          <div class="course-shell" data-course-shell>
            <canvas id="course-canvas" aria-label="Playable top-down golf course. Drag from the ball to aim and release to shoot."></canvas>
            <div class="turn-banner" data-turn-banner>YOUR TURN</div>
            <div class="wind-label">WIND <span>↗</span></div>
            <div class="power-meter" aria-hidden="true"><i data-power-fill></i></div>
            <div class="course-status" data-course-status>Drag back from the ball • Release to shoot</div>
            <div class="celebration" data-celebration hidden>
              <span>★</span><strong>HOLE IN ONE</strong><small>Precision. Power. Perfection.</small>
              <button data-action="next-hole">NEXT COURSE →</button>
            </div>
          </div>

          <div class="mobile-shot-guide">
            <span><i></i> DRAG TO AIM</span><b>•</b><span>RELEASE TO SHOOT</span>
          </div>
        </section>

        <aside class="game-sidebar">
          <div class="round-card">
            <p>SOLO RUN</p>
            <strong>Course ${String(gameState.hole).padStart(3, "0")} <span>/ 1,500</span></strong>
            <div class="progress-track"><i style="width: 31%"></i></div>
          </div>
          <div class="objective-card">
            <span class="card-number">01</span>
            <small>YOUR OBJECTIVE</small>
            <h2>Find the line.<br>Sink the putt.</h2>
            <p>Use the coral bumpers to bank around the rotating gate. The blue current pushes northeast.</p>
          </div>
          <div class="tip-card"><span>PRO TIP</span><p>Short drags give you more control around narrow gates.</p></div>
          <div class="legend-card"><span><i class="dot ball-dot"></i> Ball</span><span><i class="dot cup-dot"></i> Cup</span><span><i class="dot wind-dot"></i> Wind</span></div>
        </aside>
      </div>
    </section>

    <div class="modal-backdrop" data-modal hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
        <div data-modal-content></div>
      </section>
    </div>

    <div class="toast" role="status" aria-live="polite" data-toast></div>
  </main>
`;

class GolfAudio {
  constructor() {
    this.context = null;
  }

  tone(frequency, duration = 0.08, type = "sine", gain = 0.04, delay = 0) {
    if (!gameState.sound) return;
    this.context ||= new AudioContext();
    const now = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(volume).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  click() { this.tone(320, 0.05, "square", 0.025); }
  answer() { this.tone(540, 0.09, "sine", 0.04); this.tone(720, 0.12, "sine", 0.025, 0.06); }
  shot(power) { this.tone(95 + power * 1.1, 0.14, "triangle", 0.07); }
  win() { [523, 659, 784, 1047].forEach((note, index) => this.tone(note, 0.2, "triangle", 0.05, index * 0.08)); }
}

const audio = new GolfAudio();

function persist() {
  localStorage.setItem("golf-masters-save", JSON.stringify({
    sound: gameState.sound,
    hole: gameState.hole,
    best: gameState.best,
    totalShots: gameState.totalShots,
  }));
}

function setSoundLabels() {
  document.querySelectorAll("[data-sound-icon]").forEach((icon) => {
    icon.textContent = gameState.sound ? "♫" : "×";
  });
}

let toastTimer;
function toast(message) {
  const element = document.querySelector("[data-toast]");
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("visible"), 2600);
}

function openModal(kind) {
  const backdrop = document.querySelector("[data-modal]");
  const content = document.querySelector("[data-modal-content]");
  const templates = {
    cpu: `
      <p class="modal-eyebrow">VERSUS CPU</p><h2 id="modal-title">Challenge the club pro.</h2>
      <p>Pick a race length. You and the CPU play the same course in consecutive, camera-locked turns.</p>
      <div class="points-picker"><button>3</button><button class="selected">5</button><button>7</button><span>points to win</span></div>
      <button class="modal-primary" data-action="start-cpu">START MATCH <span>→</span></button>`,
    multiplayer: `
      <p class="modal-eyebrow">MULTIPLAYER</p><h2 id="modal-title">Meet on the green.</h2>
      <p>Create a room for a friend, or enter their six-character code. Works across PC and mobile.</p>
      <button class="modal-primary green" data-action="create-room">CREATE A ROOM <span>＋</span></button>
      <div class="or-rule"><i></i><span>OR JOIN</span><i></i></div>
      <label class="room-input"><span>ROOM CODE</span><input maxlength="6" autocomplete="off" placeholder="GM4X9K" data-room-code /></label>
      <button class="modal-secondary" data-action="join-room">JOIN ROOM <span>→</span></button>`,
    stats: `
      <p class="modal-eyebrow">PLAYER CARD</p><h2 id="modal-title">Lexington's season.</h2>
      <div class="stat-grid"><div><b>${gameState.hole - 1}</b><span>Courses cleared</span></div><div><b>${gameState.best}</b><span>Best shots</span></div><div><b>${gameState.totalShots}</b><span>Total shots</span></div><div><b>12</b><span>Hole-in-ones</span></div></div>`,
    courses: `
      <p class="modal-eyebrow">COURSE SELECT</p><h2 id="modal-title">Coastal Circuit.</h2>
      <p>Replay any cleared course or continue your current run.</p>
      <div class="course-grid">${Array.from({ length: 12 }, (_, index) => `<button class="${index === 4 ? "current" : ""}"><span>${String(37 + index).padStart(3, "0")}</span><i>${index < 4 ? "★" : index === 4 ? "PLAY" : "🔒"}</i></button>`).join("")}</div>`,
    settings: `
      <p class="modal-eyebrow">SETTINGS</p><h2 id="modal-title">Make it yours.</h2>
      <div class="setting-row"><span><b>Sound effects</b><small>Shots, UI and celebrations</small></span><button class="toggle ${gameState.sound ? "on" : ""}" data-action="sound"><i></i></button></div>
      <div class="setting-row"><span><b>Reduced motion</b><small>Use your device preference</small></span><button class="toggle" disabled><i></i></button></div>`,
  };
  content.innerHTML = templates[kind];
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add("open"));
  content.querySelector("button, input")?.focus();
}

function closeModal() {
  const backdrop = document.querySelector("[data-modal]");
  backdrop.classList.remove("open");
  setTimeout(() => { backdrop.hidden = true; }, 180);
}

function initMenuScene() {
  const canvas = document.querySelector("#menu-scene");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 2.4, 9);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x0a2d2b, 2.4));
  const light = new THREE.DirectionalLight(0xfff4d6, 4);
  light.position.set(-4, 7, 6);
  scene.add(light);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1.34, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0xf7fbff, roughness: 0.72, metalness: 0.02 })
  );
  ball.position.set(3.2, -2.6, -1);
  scene.add(ball);

  const dimples = new THREE.Group();
  const dimpleMaterial = new THREE.MeshBasicMaterial({ color: 0xc9d4dd, transparent: true, opacity: 0.32 });
  for (let index = 0; index < 34; index += 1) {
    const phi = Math.acos(-1 + (2 * index) / 34);
    const theta = Math.sqrt(34 * Math.PI) * phi;
    const dimple = new THREE.Mesh(new THREE.CircleGeometry(0.055, 10), dimpleMaterial);
    const point = new THREE.Vector3().setFromSphericalCoords(1.345, phi, theta);
    dimple.position.copy(point);
    dimple.lookAt(point.clone().multiplyScalar(2));
    dimples.add(dimple);
  }
  ball.add(dimples);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x2fca7a, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  [2.5, 3.4, 4.3].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.025, 96), ringMaterial);
    ring.position.set(3, -2.3, -2 - index * 0.1);
    scene.add(ring);
  });

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / Math.max(1, bounds.height);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function render(time) {
    ball.rotation.y = time * 0.00016;
    ball.rotation.x = -0.18 + Math.sin(time * 0.0005) * 0.025;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function coursePoint(x, y, z = 0) {
  return new THREE.Vector3(x - WORLD.width / 2, WORLD.height / 2 - y, z);
}

function initCourse() {
  const canvas = document.querySelector("#course-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x10344b);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x10344b, 950, 1300);
  const camera = new THREE.OrthographicCamera(-WORLD.width / 2, WORLD.width / 2, WORLD.height / 2, -WORLD.height / 2, 0.1, 1800);
  camera.position.set(0, 0, 1000);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.8);
  sun.position.set(-240, 360, 600);
  sun.castShadow = true;
  scene.add(sun);

  const course = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.width - 28, WORLD.height - 28),
    new THREE.MeshStandardMaterial({ color: 0x48c978, roughness: 0.86 })
  );
  course.position.z = -6;
  course.receiveShadow = true;
  scene.add(course);

  const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.035 });
  for (let y = 50; y < WORLD.height; y += 90) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.width - 42, 44), stripeMaterial);
    stripe.position.copy(coursePoint(WORLD.width / 2, y, -4));
    scene.add(stripe);
  }

  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const walls = [
    { x: 11, y: 380, w: 22, h: 760 }, { x: 409, y: 380, w: 22, h: 760 },
    { x: 210, y: 11, w: 420, h: 22 }, { x: 210, y: 749, w: 420, h: 22 },
    { x: 106, y: 505, w: 150, h: 18, a: -0.18 }, { x: 322, y: 363, w: 150, h: 18, a: 0.22 },
    { x: 95, y: 238, w: 126, h: 18, a: -0.12 },
  ];
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf0554f, roughness: 0.58 });
  walls.forEach(({ x, y, w, h, a = 0 }) => {
    Composite.add(engine.world, Bodies.rectangle(x, y, w, h, { isStatic: true, angle: a, restitution: 0.86 }));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 22), wallMaterial);
    mesh.position.copy(coursePoint(x, y, 7));
    mesh.rotation.z = -a;
    mesh.castShadow = true;
    scene.add(mesh);
  });

  const spinnerBody = Bodies.rectangle(212, 335, 136, 15, { isStatic: true, restitution: 0.9 });
  Composite.add(engine.world, spinnerBody);
  const spinner = new THREE.Group();
  const spinnerBar = new THREE.Mesh(new THREE.BoxGeometry(136, 15, 17), new THREE.MeshStandardMaterial({ color: 0x0b2851, roughness: 0.4 }));
  const spinnerCore = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 24, 24), new THREE.MeshStandardMaterial({ color: 0xffca4b }));
  spinnerCore.rotation.x = Math.PI / 2;
  spinner.add(spinnerBar, spinnerCore);
  spinner.position.copy(coursePoint(212, 335, 12));
  scene.add(spinner);

  const holePoint = { x: 300, y: 84 };
  const hole = new THREE.Mesh(new THREE.CircleGeometry(15, 32), new THREE.MeshBasicMaterial({ color: 0x07101e }));
  hole.position.copy(coursePoint(holePoint.x, holePoint.y, -1));
  scene.add(hole);
  const cupRing = new THREE.Mesh(new THREE.RingGeometry(15, 19, 32), new THREE.MeshBasicMaterial({ color: 0xf8fff7 }));
  cupRing.position.copy(coursePoint(holePoint.x, holePoint.y, 0));
  scene.add(cupRing);

  const flagPole = new THREE.Mesh(new THREE.BoxGeometry(3, 70, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  flagPole.position.copy(coursePoint(holePoint.x, holePoint.y - 35, 2));
  scene.add(flagPole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshBasicMaterial({ color: 0xf0554f, side: THREE.DoubleSide }));
  flag.position.copy(coursePoint(holePoint.x + 19, holePoint.y - 61, 4));
  scene.add(flag);

  const windMaterial = new THREE.LineBasicMaterial({ color: 0x9be8ff, transparent: true, opacity: 0.62 });
  const windLines = [];
  for (let index = 0; index < 8; index += 1) {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-24, -12, 1), new THREE.Vector3(24, 12, 1)]);
    const line = new THREE.Line(geometry, windMaterial);
    line.position.copy(coursePoint(55 + (index % 4) * 70, 410 + Math.floor(index / 4) * 54, 2));
    scene.add(line);
    windLines.push(line);
  }

  const ballBody = Bodies.circle(210, 666, 10, { restitution: 0.82, friction: 0.003, frictionAir: 0.018, density: 0.002 });
  Composite.add(engine.world, ballBody);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(11, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 })
  );
  ball.castShadow = true;
  scene.add(ball);

  const aimGeometry = new THREE.BufferGeometry().setFromPoints([coursePoint(210, 666, 12), coursePoint(210, 720, 12)]);
  const aimLine = new THREE.Line(aimGeometry, new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 10, gapSize: 7, linewidth: 2 }));
  aimLine.computeLineDistances();
  aimLine.visible = false;
  scene.add(aimLine);

  const drag = { active: false, start: null, current: null };
  const powerFill = document.querySelector("[data-power-fill]");
  const status = document.querySelector("[data-course-status]");

  function canvasToWorld(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * WORLD.width,
      y: ((event.clientY - bounds.top) / bounds.height) * WORLD.height,
    };
  }

  function ballIsReady() {
    return Math.hypot(ballBody.velocity.x, ballBody.velocity.y) < 0.22 && !document.querySelector("[data-celebration]").hidden === false;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!ballIsReady()) return;
    const point = canvasToWorld(event);
    if (Math.hypot(point.x - ballBody.position.x, point.y - ballBody.position.y) > 80) return;
    drag.active = true;
    drag.start = { ...ballBody.position };
    drag.current = point;
    canvas.setPointerCapture(event.pointerId);
    aimLine.visible = true;
    status.textContent = "Pull opposite the direction you want to shoot";
    audio.click();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drag.active) return;
    drag.current = canvasToWorld(event);
    const dx = drag.current.x - drag.start.x;
    const dy = drag.current.y - drag.start.y;
    const distance = Math.min(120, Math.hypot(dx, dy));
    const factor = distance / Math.max(1, Math.hypot(dx, dy));
    const end = { x: drag.start.x - dx * factor, y: drag.start.y - dy * factor };
    aimLine.geometry.setFromPoints([coursePoint(drag.start.x, drag.start.y, 18), coursePoint(end.x, end.y, 18)]);
    aimLine.computeLineDistances();
    powerFill.style.height = `${scorePower(distance)}%`;
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!drag.active) return;
    const point = canvasToWorld(event);
    const dx = drag.start.x - point.x;
    const dy = drag.start.y - point.y;
    const distance = Math.min(120, Math.hypot(dx, dy));
    drag.active = false;
    aimLine.visible = false;
    powerFill.style.height = "0%";
    if (distance < 10) {
      status.textContent = "Drag back from the ball • Release to shoot";
      return;
    }
    const force = 0.145;
    Body.setVelocity(ballBody, { x: dx * force, y: dy * force });
    gameState.currentShots += 1;
    gameState.totalShots += 1;
    document.querySelector("[data-shot-count]").textContent = String(gameState.currentShots);
    document.querySelector("[data-turn-banner]").textContent = "BALL IN PLAY";
    status.textContent = "Track the line…";
    audio.shot(scorePower(distance));
    persist();
  });

  function sinkBall() {
    Body.setVelocity(ballBody, { x: 0, y: 0 });
    Body.setPosition(ballBody, holePoint);
    const tier = celebrateShot(gameState.currentShots || 1, 4);
    const celebration = document.querySelector("[data-celebration]");
    celebration.querySelector("strong").textContent = tier.toUpperCase();
    celebration.hidden = false;
    document.querySelector("[data-turn-banner]").textContent = "COURSE CLEAR";
    audio.win();
  }

  function resetBall() {
    gameState.currentShots = 0;
    document.querySelector("[data-shot-count]").textContent = "0";
    Body.setPosition(ballBody, { x: 210, y: 666 });
    Body.setVelocity(ballBody, { x: 0, y: 0 });
    ball.scale.setScalar(1);
    document.querySelector("[data-celebration]").hidden = true;
    document.querySelector("[data-turn-banner]").textContent = "YOUR TURN";
    status.textContent = "Drag back from the ball • Release to shoot";
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    renderer.setSize(bounds.width, bounds.height, false);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let previous = performance.now();
  function render(time) {
    const delta = Math.min(16.666, time - previous);
    previous = time;
    Engine.update(engine, delta);

    const spinnerAngle = time * 0.00065;
    Body.setAngle(spinnerBody, spinnerAngle);
    spinner.rotation.z = -spinnerAngle;

    if (ballBody.position.y > 375 && ballBody.position.y < 490 && ballBody.position.x < 330) {
      Body.applyForce(ballBody, ballBody.position, { x: 0.000024, y: -0.000018 });
    }

    windLines.forEach((line, index) => {
      line.position.x += 0.18 + (index % 3) * 0.03;
      if (line.position.x > 130) line.position.x = -170;
    });

    ball.position.copy(coursePoint(ballBody.position.x, ballBody.position.y, 16));
    ball.rotation.x += ballBody.velocity.y * 0.008;
    ball.rotation.y += ballBody.velocity.x * 0.008;

    const holeDistance = Math.hypot(ballBody.position.x - holePoint.x, ballBody.position.y - holePoint.y);
    const speed = Math.hypot(ballBody.velocity.x, ballBody.velocity.y);
    if (holeDistance < 33 && speed < 4.4 && document.querySelector("[data-celebration]").hidden) {
      const pull = 0.00011;
      Body.applyForce(ballBody, ballBody.position, {
        x: (holePoint.x - ballBody.position.x) * pull,
        y: (holePoint.y - ballBody.position.y) * pull,
      });
      if (holeDistance < 13) sinkBall();
    }

    if (!drag.active && speed < 0.22 && document.querySelector("[data-celebration]").hidden) {
      document.querySelector("[data-turn-banner]").textContent = "YOUR TURN";
      status.textContent = "Drag back from the ball • Release to shoot";
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  return { resetBall };
}

let courseApi;
function beginQuestion() {
  gameState.answerTimer = 15;
  gameState.answering = true;
  const timer = document.querySelector("[data-answer-timer]");
  const status = document.querySelector("[data-answer-status]");
  document.querySelectorAll("[data-answer]").forEach((button) => button.classList.remove("selected", "correct", "wrong"));
  status.textContent = "The question stays on screen while every player answers.";
  timer.textContent = "15";
}

setInterval(() => {
  if (!gameState.answering || document.querySelector("[data-view='game']").hidden) return;
  gameState.answerTimer = Math.max(0, gameState.answerTimer - 1);
  document.querySelector("[data-answer-timer]").textContent = String(gameState.answerTimer);
  if (gameState.answerTimer === 0) {
    gameState.answering = false;
    document.querySelector("[data-answer-status]").textContent = "Answer locked • Driver is correct. The question remained visible for the full round.";
    document.querySelector('[data-answer="Driver"]').classList.add("correct");
  }
}, 1000);

function showGame() {
  closeModal();
  document.querySelector("[data-view='menu']").hidden = true;
  document.querySelector("[data-view='game']").hidden = false;
  courseApi ||= initCourse();
  courseApi.resetBall();
  beginQuestion();
}

function showMenu() {
  document.querySelector("[data-view='game']").hidden = true;
  document.querySelector("[data-view='menu']").hidden = false;
  gameState.answering = false;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button, a");
  if (!button) return;
  const action = button.dataset.action;
  if (button.matches("[data-answer]")) {
    if (!gameState.answering) return;
    document.querySelectorAll("[data-answer]").forEach((answer) => answer.classList.remove("selected"));
    button.classList.add("selected");
    document.querySelector("[data-answer-status]").textContent = `${button.dataset.answer} locked in • Waiting for the other player…`;
    audio.answer();
    return;
  }
  if (!action) return;
  audio.click();
  if (action === "solo" || action === "start-cpu") showGame();
  if (["cpu", "multiplayer", "stats", "courses", "settings"].includes(action)) openModal(action);
  if (action === "close-modal") closeModal();
  if (action === "exit-game") showMenu();
  if (action === "sound") {
    gameState.sound = !gameState.sound;
    persist();
    setSoundLabels();
    document.querySelectorAll(".toggle[data-action='sound']").forEach((toggle) => toggle.classList.toggle("on", gameState.sound));
    toast(gameState.sound ? "Sound effects on" : "Sound effects muted");
  }
  if (action === "create-room") {
    toast("Room GM4X9K created — share the code with a friend");
  }
  if (action === "join-room") {
    const code = normalizeRoomCode(document.querySelector("[data-room-code]")?.value || "");
    if (code.length < 5) toast("Enter a valid room code");
    else toast(`Looking for room ${code}…`);
  }
  if (action === "next-hole") {
    gameState.hole += 1;
    persist();
    courseApi.resetBall();
    beginQuestion();
    toast(`Course ${String(gameState.hole).padStart(3, "0")} ready`);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-room-code]")) {
    event.target.value = normalizeRoomCode(event.target.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!document.querySelector("[data-modal]").hidden) closeModal();
    else if (!document.querySelector("[data-view='game']").hidden) showMenu();
  }
});

document.querySelector("[data-modal]").addEventListener("click", (event) => {
  if (event.target.matches("[data-modal]")) closeModal();
});

setSoundLabels();
initMenuScene();

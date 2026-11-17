import { TempleScene } from "./scene.js?v=forecourt-moon-fill-1";
import { TempleAudio } from "./audio.js?v=gate-sidewall-integrated-1";
import { PresenceRoom } from "./presence.js?v=atmosphere-hall-1";
import { RitualObjectPreview } from "./ritual-preview.js?v=atmosphere-hall-1";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const namePrefixes = ["松间", "月下", "云外", "雨后", "无声", "缓慢", "温柔", "第七", "空山", "一盏", "微明", "未读"];
const nameSuffixes = ["回声", "行者", "数据", "故障", "星光", "旧梦", "来客", "松针", "清风", "缓存", "白噪", "信号"];
const colors = [0x6d836d, 0x80654f, 0x607b72, 0x7a705c, 0x5e7465];
const randomName = () => `${namePrefixes[Math.floor(Math.random() * namePrefixes.length)]}${nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)]}`;

const profile = {
  name: sessionStorage.getItem("yunqi-name") || randomName(),
  color: colors[Math.floor(Math.random() * colors.length)],
};
sessionStorage.setItem("yunqi-name", profile.name);

const boot = $("#boot");
const experience = $("#experience");
const progress = $("#boot-progress");
const bootCopy = $("#boot-copy");
const notice = $("#notice");
const visitorName = $("#visitor-name");
const visitorCount = $("#visitor-count");
const leaveSeat = $("#leave-seat");
const arrival = $("#arrival");
const soundToggle = $("#sound-toggle");
const controlModeToggle = $("#control-mode-toggle");
const cameraModeToggle = $("#camera-mode-toggle");
const beadsDialog = $("#beads-dialog");
const moktakDialog = $("#moktak-dialog");
const meditateDialog = $("#meditate-dialog");
const audio = new TempleAudio();
const beadsPreview = new RitualObjectPreview({ canvas: $("#beads-preview"), kind: "beads" });
const moktakPreview = new RitualObjectPreview({ canvas: $("#moktak-preview"), kind: "moktak" });
let scene;
let room;
let noticeTimer;
let beads = Number(localStorage.getItem("yunqi-beads") || 0) % 109;
let timerSeconds = 180;
let timerRemaining = timerSeconds;
let timerInterval;
let timerRunning = false;
let activeView = "gate";

function renderControlState(state) {
  if (!state) return;
  const following = state.controlMode === "follow";
  const cameraLabels = { first: "第一", third: "第三", overview: "远景" };
  controlModeToggle.querySelector("b").textContent = following ? "跟随" : "观景";
  controlModeToggle.classList.toggle("is-active", following);
  controlModeToggle.setAttribute("aria-pressed", String(following));
  cameraModeToggle.querySelector("b").textContent = cameraLabels[state.cameraMode] ?? "第三";
  cameraModeToggle.classList.toggle("is-active", following);
}

function showNotice(message, duration = 3200) {
  notice.textContent = message;
  notice.classList.add("is-visible");
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => notice.classList.remove("is-visible"), duration);
}

function applySceneView(view, announce = true) {
  const previousView = activeView;
  audio.transition(previousView, view);
  audio.setZone(view);
  activeView = view;
  $$('[data-scene-view]').forEach((button) => button.classList.toggle("is-active", button.dataset.sceneView === view));
  const messages = {
    gate: "山门之外，先把来处轻轻放下。",
    courtyard: "沿着灯火穿过云庭，水声与竹影都在这里。",
    hall: "大殿已开。点击发光的空坐垫选择位置。",
  };
  if (!announce) {
    notice.textContent = messages[view];
    return;
  }
  showNotice(messages[view], 4200);
}

function setSceneView(view, announce = true) {
  scene?.setView(view);
  applySceneView(view, announce);
}

function networkAction(action) {
  scene.perform(action, room.profile.id);
  room.update({ action, actionNonce: Date.now() });
  window.setTimeout(() => room.update({ action: null }), 500);
}

function openDialog(dialog, preview) {
  if (!dialog.open) dialog.showModal();
  preview?.show();
}

function updateBeads() {
  $("#beads-count").textContent = beads;
  $("#beads-message").textContent = beads === 108 ? "一轮已满。愿你仍能轻轻回到此刻。" : beads > 72 ? "已经很接近一轮圆满。" : beads > 36 ? "不必赶路，念念分明。" : "每一次触碰，都只记在此刻。";
}

async function turnBead() {
  if (beads >= 108) beads = 0;
  beads += 1;
  localStorage.setItem("yunqi-beads", String(beads));
  updateBeads();
  audio.bead();
  beadsPreview.turn();
  scene?.turnPrayerBeads();
  networkAction("beads");
  if (beads === 108) {
    audio.ringBell(true);
    showNotice("一百零八念已圆满。", 4500);
  }
}

function strikeMoktak() {
  moktakPreview.strike();
  networkAction("moktak");
  audio.strikeWood();
  showNotice("一声木鱼，只在你这里响起。", 2200);
}

function formatTime(total) {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimer() {
  $("#timer-value").textContent = formatTime(timerRemaining);
  $("#timer-state").textContent = timerRunning ? "正在与众人同坐" : timerRemaining === 0 ? "这一坐已经完成" : "尚未开始";
  $("#timer-toggle").textContent = timerRunning ? "暂停" : timerRemaining === 0 ? "再坐一次" : "开始静坐";
}

function toggleTimer() {
  if (timerRemaining === 0) timerRemaining = timerSeconds;
  timerRunning = !timerRunning;
  window.clearInterval(timerInterval);
  if (timerRunning) {
    networkAction("meditate");
    timerInterval = window.setInterval(() => {
      timerRemaining -= 1;
      if (timerRemaining <= 0) {
        timerRemaining = 0;
        timerRunning = false;
        window.clearInterval(timerInterval);
        audio.ringBell();
        showNotice("静坐结束。慢一点回到此刻。", 5000);
      }
      updateTimer();
    }, 1000);
  }
  updateTimer();
}

function setTimer(minutes) {
  timerSeconds = minutes * 60;
  timerRemaining = timerSeconds;
  timerRunning = false;
  window.clearInterval(timerInterval);
  $$("[data-minutes]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.minutes) === minutes));
  updateTimer();
}

async function initialize() {
  const bootSteps = [
    [18, "正在连接安静的来客……"],
    [42, "正在铺开大殿的光……"],
    [68, "正在为你留一枚名字……"],
    [86, "正在校准钟声与呼吸……"],
  ];

  for (const [value, copy] of bootSteps) {
    progress.style.width = `${value}%`;
    bootCopy.textContent = copy;
    await new Promise((resolve) => window.setTimeout(resolve, 260));
  }

  experience.hidden = false;
  visitorName.textContent = profile.name;
  scene = new TempleScene({
    canvas: $("#world"),
    labels: $("#labels"),
    onAssetProgress: (ratio) => {
      progress.style.width = `${86 + ratio * 12}%`;
      bootCopy.textContent = ratio < 0.98 ? "正在展开 Lux3D 大殿……" : "正在点亮殿内灯火……";
    },
    onCourtyardStatus: ({ state, loaded, total }) => {
      if (state === "loading" && loaded === 0) showNotice("正在展开云庭的侧殿、回廊与石桥……", 5200);
      if (state === "ready") showNotice("云庭已经展开。沿回廊可以走向竹林静坐亭。", 5200);
      if (state === "partial") showNotice(`云庭已载入 ${loaded}/${total} 件资源，缺失部分暂用原场景补位。`, 5200);
    },
    onSeatSelected: (seat) => {
      room.update({ seat });
      leaveSeat.hidden = false;
      networkAction("meditate");
      audio.ringBell(true);
      showNotice(`已在第 ${seat + 1} 枚坐垫入座。慢慢呼吸。`, 4200);
    },
    onSeatUnavailable: () => showNotice("这枚坐垫已有来客。旁边仍有空位。"),
    onControlState: renderControlState,
    onViewChange: (view) => applySceneView(view, false),
  });
  window.__YUNQI_DIAGNOSTICS__ = () => scene.getDiagnostics();
  document.documentElement.dataset.yunqiDiagnostics = JSON.stringify(scene.getDiagnostics());

  await scene.ready;
  document.documentElement.dataset.yunqiDiagnostics = JSON.stringify(scene.getDiagnostics());
  beadsPreview.load();
  moktakPreview.load();
  setSceneView("gate", false);
  renderControlState(scene.getControlState());

  room = new PresenceRoom(profile);
  room.subscribe(({ self, peers }) => {
    scene.setSelf(self);
    scene.syncPeers(peers);
    visitorCount.textContent = 24 + peers.length;
  });

  progress.style.width = "100%";
  bootCopy.textContent = "山门已开。";
  await new Promise((resolve) => window.setTimeout(resolve, 420));
  boot.classList.add("is-leaving");
  await new Promise((resolve) => window.setTimeout(resolve, 750));
  boot.remove();
}

$("#enter-button").addEventListener("click", async () => {
  arrival.classList.add("is-leaving");
  await audio.toggle(true).catch(() => false);
  soundToggle.classList.toggle("is-on", audio.enabled);
  soundToggle.setAttribute("aria-pressed", String(audio.enabled));
  window.setTimeout(() => arrival.remove(), 520);
  audio.ringBell(true);
  showNotice("点击石径，让小和尚从山门外一步步走入云庭。", 5200);
});

$$('[data-scene-view]').forEach((button) => button.addEventListener("click", () => setSceneView(button.dataset.sceneView)));

soundToggle.addEventListener("click", async () => {
  const enabled = await audio.toggle();
  soundToggle.classList.toggle("is-on", enabled);
  soundToggle.setAttribute("aria-pressed", String(enabled));
  soundToggle.setAttribute("aria-label", enabled ? "关闭环境声音" : "开启环境声音");
  if (enabled) audio.ringBell(true);
});

controlModeToggle.addEventListener("click", () => {
  const state = scene?.toggleControlMode();
  renderControlState(state);
  showNotice(state?.controlMode === "follow" ? "跟随模式：点击地面移动，拖动改变观察方向。" : "观景模式：拖动可360°环视，滚轮调整远近。", 3600);
});

cameraModeToggle.addEventListener("click", () => {
  const state = scene?.cycleCameraMode();
  renderControlState(state);
  const messages = { first: "已切换第一人称视角。", third: "已切换第三人称跟随。", overview: "已切换高位远景。" };
  if (state) showNotice(messages[state.cameraMode], 2600);
});

leaveSeat.addEventListener("click", () => {
  scene.leaveSeat();
  room.update({ seat: null, action: null });
  leaveSeat.hidden = true;
  showNotice("你已经起身，位置重新留给后来的人。", 3500);
});

$$('[data-action]').forEach((button) => button.addEventListener("click", () => {
  const action = button.dataset.action;
  if (action === "beads") { networkAction("beads"); updateBeads(); openDialog(beadsDialog, beadsPreview); return; }
  if (action === "moktak") { networkAction("moktak"); openDialog(moktakDialog, moktakPreview); return; }
  if (action === "meditate") { openDialog(meditateDialog); return; }
  networkAction(action);
  if (action === "gassho") showNotice("你向大殿中的来客合掌致意。", 2500);
  else if (action === "bow") showNotice("放低一点，也许会看见新的方向。", 2800);
}));

$$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
$("#beads-turn").addEventListener("click", turnBead);
$("#beads-preview").addEventListener("preview-activate", turnBead);
$("#beads-preview").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); turnBead(); }
});
$("#moktak-strike").addEventListener("click", strikeMoktak);
$("#moktak-preview").addEventListener("preview-activate", strikeMoktak);
$("#moktak-preview").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); strikeMoktak(); }
});
$("#timer-toggle").addEventListener("click", toggleTimer);
$$('[data-minutes]').forEach((button) => button.addEventListener("click", () => setTimer(Number(button.dataset.minutes))));

updateBeads();
updateTimer();
initialize().catch((error) => {
  console.error(error);
  bootCopy.textContent = "大殿暂时无法点亮，请刷新后重试。";
  boot.classList.add("is-error");
});

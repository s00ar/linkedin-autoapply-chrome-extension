let isRunning = false;
let inputObserver = null;
let userIntervened = false;

function log(msg, type = "log") {
  const prefix = "🦾 [LinkedIn AutoApply]";
  console[type](`${prefix} ${msg}`);
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function showContinueOverlay(targetButton) {
  removeContinueOverlay();

  const rect = targetButton.getBoundingClientRect();

  const overlay = document.createElement("button");
  overlay.id = "continue-overlay";
  overlay.innerText = "▶️ Continuar Auto Apply";
  overlay.style = `
    position: fixed;
    top: ${rect.top + window.scrollY}px;
    left: ${rect.left + window.scrollX}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: bold;
    z-index: 999999;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
  `;

  overlay.onclick = async () => {
    userIntervened = false;
    const btnStart = document.getElementById("btn-start");
    if (btnStart) {
      btnStart.textContent = "🚀 Iniciar Auto Apply";
      btnStart.classList.remove("paused");
      btnStart.classList.add("pulsing");
    }
    targetButton.click();
    removeContinueOverlay();
    log("▶️ Continuado tras intervención del usuario.");
  };

  document.body.appendChild(overlay);
}

function removeContinueOverlay() {
  const el = document.getElementById("continue-overlay");
  if (el) el.remove();
}
async function pauseForUserAndWaitButton(label) {
  const continueLabels = ['Continue', 'Next', 'Review', 'Submit application', 'Done',
    'Continuar', 'Siguiente', 'Revisar', 'Enviar solicitud', 'Listo'];

  userIntervened = true;

  const btnStart = document.getElementById("btn-start");
  if (btnStart) {
    btnStart.classList.remove("pulsing");
    btnStart.classList.add("paused");
    btnStart.textContent = "⏸ Pausado (click para continuar)";
  }

  let found = false;
  for (let i = 0; i < 10; i++) {
    const buttons = [...document.querySelectorAll("button")];
    const target = buttons.find(btn => {
      const txt = btn.innerText?.trim().toLowerCase();
      return btn.offsetParent !== null && continueLabels.some(lbl => txt.includes(lbl.toLowerCase()));
    });

    if (target) {
      showContinueOverlay(target);
      found = true;
      break;
    }

    await delay(1000);
  }

  if (!found) {
    alert("⚠️ No se encontró botón de continuar. Completalo manualmente y hacé clic.");
  }
}

// === CONTINUAR tras input ===
async function continueAfterUserInput(retries = 3) {
  log("🔄 Buscando botón para continuar...");

  const continueLabels = [
    'Continue', 'Next', 'Review', 'Submit application', 'Done',
    'Continuar', 'Siguiente', 'Revisar', 'Enviar solicitud', 'Listo'
  ];

  while (retries-- > 0) {
    const buttons = [...document.querySelectorAll("button")];
    for (const btn of buttons) {
      const text = btn.innerText?.trim().toLowerCase();
      const labelMatch = continueLabels.some(lbl =>
        text.includes(lbl.toLowerCase())
      );
      const isVisible = btn.offsetParent !== null;
      if (labelMatch && isVisible) {
        btn.click();
        log("✅ Botón detectado y clickeado.");
        return true;
      }
    }

    log("⚠️ No se encontró botón, reintentando...");
    await delay(1000);
  }

  log("🚫 No se encontró botón de continuar tras varios intentos.", "warn");
  alert("⚠️ No se encontró cómo continuar. Verificá si falta algún campo o botón.");
  return false;
}

// === Etiqueta de campos ===
function getFieldLabel(field) {
  let label = field.closest('label');
  if (label) return label.innerText.trim();

  let describedBy = field.getAttribute('aria-describedby');
  if (describedBy) {
    const described = document.getElementById(describedBy);
    if (described) return described.innerText.trim();
  }

  let previous = field.closest('div')?.previousElementSibling;
  if (previous && previous.innerText) return previous.innerText.trim();

  return field.name || field.placeholder || field.ariaLabel || "Campo desconocido";
}

// === Botones UI flotantes ===
function createControlButtons() {
  const style = `
    <style>
      .auto-btn {
        position: fixed;
        right: 20px;
        z-index: 999999;
        padding: 14px 22px;
        font-size: 15px;
        font-weight: bold;
        border: none;
        border-radius: 30px;
        cursor: pointer;
        color: white;
        transition: transform 0.1s ease-in-out;
      }
      .auto-btn:active { transform: scale(0.95); }

      .btn-start { bottom: 80px; background: #28a745; }
      .btn-stop { bottom: 20px; background: #dc3545; }

      .btn-start.pulsing {
        animation: pulse 1.5s infinite;
        box-shadow: 0 0 10px #28a74588;
      }

      .btn-start.paused {
        animation: blink 1s infinite;
        background: #ff9800 !important;
      }

      .btn-stop.glow {
        animation: glow 1.5s infinite;
        box-shadow: 0 0 10px #dc354588;
      }

      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(40,167,69,0.7); }
        70% { box-shadow: 0 0 0 15px rgba(40,167,69,0); }
        100% { box-shadow: 0 0 0 0 rgba(40,167,69,0); }
      }
      @keyframes glow {
        0% { box-shadow: 0 0 8px #dc3545; }
        50% { box-shadow: 0 0 18px #dc3545; }
        100% { box-shadow: 0 0 8px #dc3545; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `;
  document.head.insertAdjacentHTML("beforeend", style);

  const btnStart = document.createElement("button");
  btnStart.id = "btn-start";
  btnStart.className = "auto-btn btn-start";
  btnStart.innerText = "🚀 Iniciar Auto Apply";
  btnStart.onclick = () => {
    if (userIntervened) {
      userIntervened = false;
      btnStart.textContent = "🚀 Iniciar Auto Apply";
      btnStart.classList.remove("paused");
      btnStart.classList.add("pulsing");
      continueAfterUserInput();
    } else {
      start();
    }
  };

  const btnStop = document.createElement("button");
  btnStop.id = "btn-stop";
  btnStop.className = "auto-btn btn-stop glow";
  btnStop.innerText = "🛑 Detener";
  btnStop.onclick = stop;

  document.body.appendChild(btnStart);
  document.body.appendChild(btnStop);
}

// === Iniciar / Detener ===
function start() {
  if (!isRunning) {
    isRunning = true;
    document.getElementById("btn-start").classList.add("pulsing");
    document.getElementById("btn-stop").classList.remove("glow");
    showWelcomePopup();
    setupUserInterventionDetection();
    startAutoApply();
  }
}

function stop() {
  isRunning = false;
  userIntervened = false;

  // 🔌 Detener el MutationObserver
  if (inputObserver) {
    inputObserver.disconnect();
    inputObserver = null;
    log("🛑 MutationObserver detenido.");
  }

  const btnStart = document.getElementById("btn-start");
  const btnStop = document.getElementById("btn-stop");

  if (btnStart) {
    btnStart.classList.remove("pulsing", "paused");
    btnStart.textContent = "🚀 Iniciar Auto Apply";
  }

  if (btnStop) {
    btnStop.classList.add("glow");
  }

  alert("🛑 Auto Apply detenido.");
}


// === Modal de bienvenida ===
function showWelcomePopup() {
  const win = window.open("", "_blank", "width=480,height=500");
  win.document.write(`
    <title>Bienvenido</title>
    <style>
      body { font-family: sans-serif; background: #121212; color: white; padding: 20px; }
      button {
        margin-top: 15px;
        padding: 10px 16px;
        font-size: 16px;
        background: #00b9fe;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }
    </style>
    <h2>✨ Bienvenido a LinkedIn Auto Apply by SanDevs</h2>
    <ol>
      <li>Hacé clic en <strong>"Iniciar Auto Apply"</strong></li>
      <li>Completá manualmente si el autocompletar no tiene ese dato</li>
      <li>Podés pausar con el botón del contador ⏸ cuando aparece en la esquina superior derecha</li>
      <li>Al intervenir, el sistema se pausa automáticamente</li>
      <li>Puedes cerrar sin problema esta ventana</li>
    </ol>
    <p>¿Te gustaría que continue realizando herramientas como esta? Invitame un café:</p>
    <p>☕Invitame un café al siguiente link. Toda colaboración ayuda:</p>
    <button onclick="window.open('https://ko-fi.com/sandevs')">Ko-fi.com/sandevs</button>
  `);
}

// === Lógica de automatización ===
async function startAutoApply() {
  const pages = await askHowManyPages();

  for (let p = 0; p < pages; p++) {
    if (!isRunning) break;

    try {
      await processJobsOnPage();
    } catch (e) {
      log(`❌ Error procesando página ${p + 1}: ${e.message}`, "error");
    }

    const next = document.querySelector('.artdeco-pagination__button--next');
    if (next && !next.disabled) {
      try {
        next.click();
        await delay(3000);
      } catch (e) {
        log("❌ Error al hacer clic en 'Siguiente': " + e.message, "error");
      }
    }
  }

  stop();
}

// ... (código omitido para brevedad: sigue igual hasta dentro de processJobsOnPage)

async function processJobsOnPage() {
  const jobs = document.querySelectorAll('.job-card-container--clickable');
  for (let i = 0; i < jobs.length; i++) {
    if (!isRunning) return;

    jobs[i].click();
    await delay(2000);

    const applyBtn = document.querySelector('.jobs-apply-button');
    if (applyBtn?.innerText.includes("Easy Apply")) {
      applyBtn.click();
      await delay(2000);

      let keepGoing = true;
      while (keepGoing && isRunning && !userIntervened) {
        const requiredFields = document.querySelectorAll('input[required], select[required]');
        for (let field of requiredFields) {
          if (!field.value) {
            const label = getFieldLabel(field);
            log(`📝 Campo requerido "${label}" está vacío. Pausando para intervención.`);
            await pauseForUserAndWaitButton(label);
            return;
          }          
        }

        const next = document.querySelector("button[aria-label='Continue to next step']");
        let submit = document.querySelector("button[aria-label='Submit application']");
        const review = document.querySelector("button[aria-label='Review your application']");

        if (!submit) {
          submit = [...document.querySelectorAll('button.artdeco-button--primary')]
            .find(btn => btn.textContent.toLowerCase().includes("submit"));
        }

        if (submit) {
          submit.click();
          await delay(3000);

          // ✅ Detectar si aparece el modal de enviado (y hacer clic en Done)
          const modalDone = [...document.querySelectorAll("button")]
            .find(b => b.innerText.trim().toLowerCase() === "done");

          if (modalDone) {
            modalDone.click();
            await delay(1500);
          } else {
            // Retry por si aparece un poco después
            await delay(1500);
            const doneLater = [...document.querySelectorAll("button")]
              .find(b => b.innerText.trim().toLowerCase() === "done");
            if (doneLater) {
              doneLater.click();
              await delay(1500);
            }
          }

          keepGoing = false;
        } else if (review) review.click();
        else if (next) next.click();
        else keepGoing = false;

        await delay(1500);
      }

      document.querySelector(".artdeco-modal__dismiss")?.click();
      await delay(1500);
    }
  }
}

// ... (resto del código igual)

async function askHowManyPages() {
  return new Promise(resolve => {
    chrome.storage.sync.get(["pagesToApply"], result => {
      const num = parseInt(result.pagesToApply);
      if (!isNaN(num) && num > 0) {
        log(`📄 Se aplicará a ${num} página(s).`);
        resolve(num);
      } else {
        log("⚠️ Valor no válido, aplicando solo en 1 página.");
        resolve(1);
      }
    });
  });
}

if (window.location.href.includes("linkedin.com/jobs")) {
  window.addEventListener("load", () => {
    createControlButtons();
    log("✨ content.js cargado correctamente");
  });
}
// === Detección de intervención del usuario (robusta con MutationObserver) ===
function setupUserInterventionDetection() {
  // 1. Escuchar campos ya existentes
  attachListenersToInputs();

  // 2. Observar nuevos campos dinámicos
  observeNewInputs();
}

function handleUserEdit() {
  if (isRunning && !userIntervened) {
    userIntervened = true;
    const btn = document.getElementById("btn-start");
    if (btn) {
      btn.classList.remove("pulsing");
      btn.classList.add("paused");
      btn.textContent = "⏸ Pausado (click para continuar)";
    }
    showPausedToast(); // 💡 Aquí
    log("🛑 Usuario intervino. Ejecución pausada.");
  }
}

function attachListenersToInputs(container = document) {
  const elements = container.querySelectorAll("input, textarea, select");
  elements.forEach(el => {
    // Evitar duplicar listeners
    el.removeEventListener("input", handleUserEdit);
    el.removeEventListener("click", handleUserEdit);
    el.removeEventListener("change", handleUserEdit);

    el.addEventListener("input", handleUserEdit);
    el.addEventListener("click", handleUserEdit);
    el.addEventListener("change", handleUserEdit);
  });
}

// === Mejora de robustez para LinkedIn: Inputs dinámicos y eventos no capturados ===
function deeplyScanForInputsAndAttach(node) {
  const inputs = node.querySelectorAll?.("input, textarea, select") || [];
  for (const input of inputs) {
    attachListenersToElement(input);
  }
  // También aplicar si el nodo raíz es un campo válido
  if (["INPUT", "TEXTAREA", "SELECT"].includes(node.nodeName)) {
    attachListenersToElement(node);
  }
}

function attachListenersToElement(el) {
  // Limpieza previa por si se duplicaron
  el.removeEventListener("input", handleUserEdit);
  el.removeEventListener("click", handleUserEdit);
  el.removeEventListener("change", handleUserEdit);
  el.removeEventListener("keydown", handleUserEdit);

  // Eventos básicos
  el.addEventListener("input", handleUserEdit);
  el.addEventListener("click", handleUserEdit);
  el.addEventListener("change", handleUserEdit);
  el.addEventListener("keydown", handleUserEdit); // para detectar escritura antes de input
}

function observeNewInputs() {
  if (inputObserver) inputObserver.disconnect(); // Por si ya existía

  inputObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element
          deeplyScanForInputsAndAttach(node);
        }
      }
    }
  });

  inputObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Rescan inicial por si no se capturaron los primeros campos
  deeplyScanForInputsAndAttach(document.body);

  log("🧠 MutationObserver mejorado iniciado para inputs dinámicos.");
}

// BONUS: re-scan cada 3 segundos por si algún campo se escapó
setInterval(() => {
  if (isRunning && !userIntervened) {
    deeplyScanForInputsAndAttach(document.body);
  }
}, 3000);

function showPausedToast() {
  const existing = document.getElementById("paused-toast");
  if (existing) return;

  const toast = document.createElement("div");
  toast.id = "paused-toast";
  toast.innerText = "⏸️ Pausado. Completá el campo y hacé clic en 'Continuar Auto Apply'.";
  toast.style = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    background: #ffc107;
    color: black;
    padding: 12px 18px;
    border-radius: 10px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 0 8px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(toast);
}

// En overlay.onclick():
document.getElementById("paused-toast")?.remove();

// ✅ Versión del script
// Versión: LinkedIn AutoApply by SanDevs - v2.0.1
// Cambios: Mejoras en la detección de botones y campos, y en la lógica de automatización.
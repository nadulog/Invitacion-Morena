(() => {
  const toast = document.getElementById("toast");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Aviso ---------- */
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  /* ---------- Nombres de invitados ----------
     Los completa assets/invitation-personalization.js a partir de ?invite=<token>.
     Acá solo se achica la letra cuando los nombres son largos. */
  const guestEl = document.getElementById("nombres-invitados");
  const fitGuestNames = () => {
    const len = guestEl.textContent.trim().length;
    guestEl.classList.toggle("is-long", len > 12 && len <= 20);
    guestEl.classList.toggle("is-very-long", len > 20);
  };
  new MutationObserver(fitGuestNames).observe(guestEl, { childList: true, characterData: true, subtree: true });

  /* ---------- Cuenta regresiva ---------- */
  const target = new Date("2027-02-06T20:00:00-03:00").getTime();
  const cd = ["cdDays", "cdHours", "cdMinutes", "cdSeconds"].map((id) => document.getElementById(id));
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const s = Math.floor(Math.max(0, target - Date.now()) / 1000);
    [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].forEach((v, i) => {
      const text = pad(v);
      if (cd[i].textContent !== text) cd[i].textContent = text;
    });
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- Aparición al hacer scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Espejo encantado: se raspa para ver la fecha ---------- */
  const datePanel = document.getElementById("datePanel");
  const mirror = document.getElementById("mirror");
  const canvas = document.getElementById("mirrorCanvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const trail = document.getElementById("magicTrail");
  const storageKey = "morena-fecha-revelada-v1";

  let revealed = false;
  try { revealed = sessionStorage.getItem(storageKey) === "1"; } catch {}
  let drawing = false;
  let lastPoint = null;
  let strokes = 0;
  let paintedSize = "";

  const paintMist = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const size = `${Math.round(w)}x${Math.round(h)}`;
    if (size === paintedSize) return;
    paintedSize = size;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Cristal empañado por el hechizo: azul noche con niebla y polvo dorado
    const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
    g.addColorStop(0, "#1d3570");
    g.addColorStop(0.55, "#10224d");
    g.addColorStop(1, "#071029");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = w * (0.12 + Math.random() * 0.25);
      const mist = ctx.createRadialGradient(x, y, 0, x, y, r);
      mist.addColorStop(0, `rgba(140, 170, 235, ${0.06 + Math.random() * 0.1})`);
      mist.addColorStop(1, "rgba(140, 170, 235, 0)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, w, h);
    }

    // Reflejo diagonal del cristal
    ctx.save();
    ctx.translate(w * 0.3, h * 0.3);
    ctx.rotate(-0.6);
    const shine = ctx.createLinearGradient(0, -20, 0, 20);
    shine.addColorStop(0, "rgba(255,255,255,0)");
    shine.addColorStop(0.5, "rgba(220,230,255,0.12)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(-w, -20, w * 2, 40);
    ctx.restore();

    for (let i = 0; i < 360; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.4 + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() < 0.6 ? `rgba(243, 213, 140, ${0.35 + Math.random() * 0.5})` : "rgba(220, 230, 255, 0.5)";
      ctx.fill();
    }
  };

  const finishReveal = () => {
    if (revealed) return;
    revealed = true;
    drawing = false;
    try { sessionStorage.setItem(storageKey, "1"); } catch {}
    mirror.classList.add("is-revealed");
    datePanel.classList.add("is-unlocked");
    if (navigator.vibrate) navigator.vibrate(18);
    setTimeout(() => mirror.classList.add("is-gone"), reducedMotion ? 0 : 1000);
  };

  const pointFrom = (event) => {
    const rect = canvas.getBoundingClientRect();
    // La sección aparece con un pequeño desplazamiento: se escala por si el tamaño visible difiere
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.clientWidth,
      y: ((event.clientY - rect.top) / rect.height) * canvas.clientHeight
    };
  };

  const clearedRatio = () => {
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const step = 20;
    let total = 0;
    let clear = 0;
    // Solo cuenta lo que está dentro del óvalo visible
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const nx = (x / width - 0.5) * 2;
        const ny = (y / height - 0.5) * 2;
        if (nx * nx + ny * ny > 1) continue;
        total++;
        if (data[(y * width + x) * 4 + 3] < 40) clear++;
      }
    }
    return total ? clear / total : 0;
  };

  const sparkle = (p) => {
    if (reducedMotion) return;
    const star = document.createElement("span");
    star.style.left = `${p.x}px`;
    star.style.top = `${p.y}px`;
    star.style.setProperty("--dx", `${(Math.random() - 0.5) * 50}px`);
    star.style.setProperty("--dy", `${-10 - Math.random() * 36}px`);
    trail.append(star);
    setTimeout(() => star.remove(), 950);
  };

  const scratch = (from, to) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = Math.max(44, canvas.clientWidth * 0.2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  };

  if (revealed) {
    mirror.classList.add("is-gone");
  } else {
    paintMist();
    if ("ResizeObserver" in window) new ResizeObserver(() => !revealed && paintMist()).observe(canvas);

    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      lastPoint = pointFrom(event);
      scratch(lastPoint, lastPoint);
      mirror.classList.add("is-scratching");
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!drawing || revealed) return;
      const next = pointFrom(event);
      scratch(lastPoint, next);
      if (Math.random() < 0.5) sparkle(next);
      lastPoint = next;
      if (++strokes % 10 === 0 && clearedRatio() > 0.5) finishReveal();
    });

    const stopDrawing = () => {
      drawing = false;
      if (!revealed && clearedRatio() > 0.5) finishReveal();
    };
    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointercancel", stopDrawing);
    document.getElementById("mirrorSkip").addEventListener("click", finishReveal);
  }

  /* ---------- Música de fondo ---------- */
  // Los celulares no dejan reproducir sonido sin un toque, así que arranca
  // con el primer toque en cualquier parte (salvo que la hayan pausado a propósito).
  const audio = document.getElementById("invitationAudio");
  const audioBtn = document.getElementById("audioToggle");
  let userPaused = false;
  audio.volume = 0.85;

  const syncAudioBtn = () => {
    const playing = !audio.paused;
    audioBtn.classList.toggle("is-playing", playing);
    audioBtn.setAttribute("aria-pressed", String(playing));
    audioBtn.setAttribute("aria-label", playing ? "Pausar música" : "Reproducir música");
  };

  const playAudio = () => audio.play().catch(() => {});
  audio.addEventListener("play", syncAudioBtn);
  audio.addEventListener("pause", syncAudioBtn);

  audioBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (audio.paused) {
      userPaused = false;
      playAudio();
    } else {
      userPaused = true;
      audio.pause();
    }
  });

  const startOnGesture = () => {
    if (userPaused || !audio.paused) return;
    playAudio();
  };
  ["pointerup", "touchend", "click", "keydown"].forEach((type) =>
    document.addEventListener(type, startOnGesture, { passive: true })
  );
  playAudio();

  // Se pausa si salen de la pestaña y vuelve al regresar
  let pausedByHide = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) {
      pausedByHide = true;
      audio.pause();
    } else if (!document.hidden && pausedByHide) {
      pausedByHide = false;
      playAudio();
    }
  });

  /* ---------- Enlaces que todavía no tienen destino ---------- */
  document.querySelectorAll("[data-pending]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("href") !== "#") return;
      event.preventDefault();
      showToast(link.dataset.pending);
    });
  });

  /* ---------- Modal de regalos ---------- */
  const modal = document.getElementById("giftModal");
  document.getElementById("openGifts").addEventListener("click", () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  });
  const closeModal = () => (typeof modal.close === "function" ? modal.close() : modal.removeAttribute("open"));
  modal.querySelector("[data-close]").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      modal.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch {}
      area.remove();
      return ok;
    }
  };

  modal.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await copyText(btn.dataset.copy);
      showToast(ok ? btn.dataset.msg : "No se pudo copiar, mantené presionado el dato");
      if (!ok) return;
      const original = btn.textContent;
      btn.textContent = "¡Listo!";
      setTimeout(() => (btn.textContent = original), 1600);
    });
  });
})();

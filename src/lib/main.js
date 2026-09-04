// =====================================================================
// main.js — Lógica JavaScript centralizada de Makers Fotografía y Video
// ---------------------------------------------------------------------
// Todos los comportamientos del sitio viven aquí, agrupados por sección.
// Se importa una sola vez desde el Layout y se auto-inicializa al cargar
// el DOM. Cada función comprueba que sus elementos existan antes de
// ejecutarse, así que este archivo es seguro aunque un componente
// esté o no presente en la página.
//
// ÍNDICE (por orden de aparición en la página):
//   1. Utilidades
//   2. Navbar (notch que se oculta al bajar)
//   3. Hero: parallax y typewriter
//   4. Tarjetas 3D (tilt con mousemove)
//   5. Modal de imagen (accesible)
//   6. Tabs de galería (Casual / Boda)
//   7. Galería: observador al hacer scroll + botón "Ver más"
//   8. Carrusel de posters
//   9. Reproductor de video (YouTube)
//  10. Calculadora de cotización (con validación)
//  11. Preguntas frecuentes (acordeón con ARIA)
// =====================================================================

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

(() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ===================================================================
  // 1. UTILIDADES
  // ===================================================================

  const el = (id) => document.getElementById(id);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  // ===================================================================
  // 2. NAVBAR
  // ===================================================================
  function initNavbar() {
    const notch = el("notch-container");
    const nav = el("navbar");
    if (!notch) return;

    let lastScrollY = window.scrollY;

    window.addEventListener(
      "scroll",
      () => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        const pastTop = currentScrollY > 60;

        nav?.classList.toggle("scrolled", pastTop);

        if (scrollingDown && pastTop) {
          notch.classList.add("-translate-y-full");
        } else {
          notch.classList.remove("-translate-y-full");
        }

        lastScrollY = currentScrollY;
      },
      { passive: true },
    );
  }

  // ===================================================================
  // 3. HERO — parallax y typewriter
  // ===================================================================
  function initHeroParallax() {
    const heroBg = el("heroBg");
    if (!heroBg) return;

    const heroEnter = el("glassCard");
    if (heroEnter) {
      heroEnter.addEventListener("animationend", () => {
        heroEnter.classList.remove("hero-enter");
      });
    }
    const heroInd = document.querySelector(".hero-fade");
    heroInd?.addEventListener("animationend", () => {
      heroInd.classList.remove("hero-fade");
    });

    let ticking = false;
    let lastScrollY = 0;

    window.addEventListener(
      "scroll",
      () => {
        lastScrollY = window.scrollY;
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = lastScrollY * 0.4;
            const s = 1 + Math.min(lastScrollY / 4000, 0.12);
            heroBg.style.transform = `translate3d(0, ${y}px, 0) scale(${s.toFixed(4)})`;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  function initTypewriter() {
    const target = el("typewriter");
    if (!target) return;

    const words = [
      "ahora eternos.",
      "ahora vivos.",
      "ahora memorables.",
      "ahora inolvidables.",
    ];

    if (prefersReducedMotion) {
      target.textContent = words[0];
      target.className = "text-[var(--accent)]";
      return;
    }

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const cursor = el("typewriter-cursor");
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const delayBetweenWords = 2000;

    const applyColor = (word) => {
      const orange = word === words[0];
      target.className = orange
        ? "text-[var(--accent)] transition-colors duration-300"
        : "text-[var(--text-primary)] transition-colors duration-300";
      if (cursor)
        cursor.className = orange
          ? "animate-pulse ml-0.5 font-normal text-[var(--accent)]"
          : "animate-pulse ml-0.5 font-normal text-[var(--text-primary)]";
    };

    function typeEffect() {
      const currentWord = words[wordIndex];
      applyColor(currentWord);

      if (isDeleting) {
        target.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        target.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      let nextSpeed = isDeleting ? deletingSpeed : typingSpeed;

      if (!isDeleting && charIndex === currentWord.length) {
        nextSpeed = delayBetweenWords;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        nextSpeed = 300;
      }

      setTimeout(typeEffect, nextSpeed);
    }

    typeEffect();
  }

  // ===================================================================
  // 4. TARJETAS 3D
  // ===================================================================
  function initCardTilt() {
    if (prefersReducedMotion || window.matchMedia("(hover: none)").matches) {
      return;
    }

    qsa(".card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = `perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
        card.style.transition = "transform 0.1s ease-out";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)";
        card.style.transition = "transform 0.4s ease-out";
      });
    });
  }

  // ===================================================================
  // 5. MODAL DE IMAGEN
  // ===================================================================
  function initModal() {
    const modal = el("modal");
    const modalImg = el("modalImg");
    const modalLoader = el("modalLoader");
    const modalLoaderImg = el("modalLoaderImg");
    const modalStage = el("modalStage");
    const zoomInBtn = el("modalZoomIn");
    const zoomResetBtn = el("modalZoomReset");
    const closeBtn = el("modalClose");
    if (!modal || !modalImg) return;

    let lastFocused = null;
    let zoom = 1;
    let baseW = 0;
    let baseH = 0;

    const centerScroll = () => {
      if (!modalStage) return;
      modalStage.scrollLeft = (modalStage.scrollWidth - modalStage.clientWidth) / 2;
      modalStage.scrollTop = (modalStage.scrollHeight - modalStage.clientHeight) / 2;
    };

    const applyZoom = () => {
      if (baseW <= 0 || baseH <= 0) return;
      modalImg.style.width = `${(baseW * zoom).toFixed(2)}px`;
      modalImg.style.height = `${(baseH * zoom).toFixed(2)}px`;
      modalImg.style.transform = "translate3d(0, 0, 0)";
      centerScroll();
    };

    const openModal = (src, alt, lowSrc) => {
      lastFocused = document.activeElement;
      zoom = 1;
      baseW = 0;
      baseH = 0;
      modalImg.style.width = "";
      modalImg.style.height = "";
      modalImg.style.transform = "";
      modalImg.classList.remove("is-loaded");
      modalImg.style.opacity = "0";
      modalImg.alt = alt || "";
      modalImg.src = src;

      modalLoaderImg.src = lowSrc || src;
      modalLoaderImg.alt = alt || "";
      modalLoader.classList.remove("hidden");
      modalLoader.style.display = "flex";
      modalLoader.classList.add("flex");

      modal.classList.remove("hidden");
      modal.classList.add("flex");
      modal.setAttribute("aria-hidden", "false");

      if (modalStage) modalStage.scrollLeft = 0;
      if (modalStage) modalStage.scrollTop = 0;
      modalImg.focus();
    };

    const onLoad = () => {
      const stageRect = modalStage?.getBoundingClientRect();
      const vw = stageRect?.width || 0;
      const vh = stageRect?.height || 0;
      const natW = modalImg.naturalWidth || 1;
      const natH = modalImg.naturalHeight || 1;
      const fit = vw > 0 && vh > 0 ? Math.min(vw / natW, vh / natH) : 1;
      baseW = natW * fit;
      baseH = natH * fit;
      modalImg.style.width = `${baseW.toFixed(2)}px`;
      modalImg.style.height = `${baseH.toFixed(2)}px`;
      modalLoader.style.display = "none";
      modalLoader.classList.add("hidden");
      modalImg.style.opacity = "1";
      modalImg.classList.add("is-loaded");
    };
    modalImg.addEventListener("load", onLoad);
    modalImg.addEventListener("error", onLoad);

    const closeModal = () => {
      const wasOpen = !modal.classList.contains("hidden");
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      modal.setAttribute("aria-hidden", "true");
      if (wasOpen) lastFocused?.focus?.();
    };

    closeBtn?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    zoomInBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      zoom = zoom < 1 ? 1 : Math.min(zoom * 1.5, 6);
      applyZoom();
    });
    zoomResetBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      zoom = 1;
      applyZoom();
    });

    modalImg.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      zoom = zoom > 1 ? 1 : Math.min(zoom * 1.5, 6);
      applyZoom();
    });

    let lastTap = 0;
    modalImg.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        e.stopPropagation();
        zoom = zoom > 1 ? 1 : Math.min(zoom * 1.5, 6);
        applyZoom();
      }
      lastTap = now;
    }, { passive: false });

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let panBound = false;

    const bindPan = () => {
      if (panBound || !modalStage) return;
      panBound = true;
      modalStage.addEventListener("pointerdown", (e) => {
        if (zoom <= 1) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        lastX = modalStage.scrollLeft;
        lastY = modalStage.scrollTop;
        document.body.style.cursor = "grabbing";
        modalStage.setPointerCapture?.(e.pointerId);
      });
      modalStage.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        e.preventDefault();
        modalStage.scrollLeft = lastX - (e.clientX - startX);
        modalStage.scrollTop = lastY - (e.clientY - startY);
      });
      const endPan = () => {
        dragging = false;
        document.body.style.cursor = "";
      };
      modalStage.addEventListener("pointerup", endPan);
      modalStage.addEventListener("pointercancel", endPan);
    };
    bindPan();

    window.__openModal = openModal;

    qsa(".card").forEach((card) => {
      const img = card.querySelector("img");
      if (img && img.dataset.original) {
        card.addEventListener("click", () =>
          openModal(img.dataset.original, img.alt, img.src),
        );
      }
    });
  }

  // ===================================================================
  // 6. TABS DE GALERÍA — con soporte ARIA
  // ===================================================================
  function initTabs() {
    const buttons = qsa(".tab-btn");
    const contents = qsa(".tab-content");
    if (buttons.length === 0) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.hasAttribute("disabled")) return;

        const target = btn.dataset.tab;

        buttons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
          const bg = b.querySelector(".tab-bg");
          if (bg) {
            bg.classList.remove("opacity-100");
            bg.classList.add("opacity-0");
          }
        });

        contents.forEach((c) => {
          c.classList.add("hidden");
          c.setAttribute("aria-hidden", "true");
        });

        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const activeBg = btn.querySelector(".tab-bg");
        if (activeBg) {
          activeBg.classList.remove("opacity-0");
          activeBg.classList.add("opacity-100");
        }

        const targetEl = el(target);
        if (targetEl) {
          targetEl.classList.remove("hidden");
          targetEl.setAttribute("aria-hidden", "false");
        }
      });
    });
  }

  // ===================================================================
  // 7. SCROLL REVEAL — bidireccional con blur
  // ===================================================================
  function initScrollReveal() {
    const items = qsa("[data-reveal]");
    if (!items.length) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (typeof IntersectionObserver === "undefined" || prefersReduced) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target.style.removeProperty("transition-delay");
          } else {
            entry.target.classList.remove("is-visible");
            entry.target.style.transitionDelay = "0ms";
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
    );

    items.forEach((item, index) => {
      const base = item.dataset.revealDelay;
      const delay = base != null ? Number(base) : Math.min(index % 8, 6) * 90;
      item.style.setProperty("--reveal-delay", `${delay}ms`);
      observer.observe(item);
    });
  }

  // ===================================================================
  // 8. CARRUSEL DE POSTERS
  // ===================================================================
  function initPosterCarousel() {
    const slides = qsa(".poster-slide");
    const dotsWrap = el("dots-wrap");
    if (slides.length === 0 || !dotsWrap) return;

    const total = slides.length;
    let current = 0;
    let isAnimating = false;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Ir al poster ${i + 1}`);
      dot.style.cssText =
        "height:3px;border-radius:9999px;border:none;cursor:pointer;background:rgba(255,255,255,0.15);transition:all 0.4s ease;";
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    const getPos = (i) => {
      let diff = i - current;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      return diff;
    };

    function update() {
      const wrap = el("carousel-wrap");
      const W = wrap.offsetWidth;
      const isMobile = W < 640;
      const isTablet = W >= 640 && W < 1024;

      const cardW = isMobile
        ? Math.round(W * 0.55)
        : isTablet
          ? 260
          : Math.round(W * 0.15);
      const cardH = Math.round(cardW * 1.5);

      wrap.style.height = `${cardH + 40}px`;
      el("carousel-track").style.height = `${cardH + 40}px`;

      const d1 = isMobile
        ? Math.round(W * 0.32)
        : isTablet
          ? 240
          : Math.round(W * 0.15);
      const d2 = isMobile
        ? Math.round(W * 0.58)
        : isTablet
          ? 430
          : Math.round(W * 0.27);
      const s1 = isMobile ? 0.7 : 0.82;
      const s2 = isMobile ? 0.5 : 0.62;
      const r1 = isMobile ? 4 : 8;
      const r2 = isMobile ? 8 : 14;

      slides.forEach((slide, i) => {
        const pos = getPos(i);
        const overlay = slide.querySelector(".poster-overlay");
        const zoom = slide.querySelector(".poster-zoom");
        const accent = slide.querySelector(".poster-accent");

        slide.style.width = `${cardW}px`;
        slide.style.height = `${cardH}px`;
        slide.style.transition =
          "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.7s ease, filter 0.7s ease";

        if (pos === 0) {
          slide.style.transform = `translateX(0) scale(1) rotateY(0deg) translateY(var(--parallax-y))`;
          slide.style.zIndex = "10";
          slide.style.opacity = "1";
          slide.style.filter = "brightness(1) blur(0px)";
          overlay.style.opacity = "0";
          zoom.style.opacity = "0";
          accent.style.opacity = "1";
        } else if (Math.abs(pos) === 1) {
          const dir = pos > 0 ? 1 : -1;
          slide.style.transform = `translateX(${dir * d1}px) scale(${s1}) rotateY(${dir * -r1}deg) translateY(var(--parallax-y))`;
          slide.style.zIndex = "6";
          slide.style.opacity = "0.9";
          slide.style.filter = "brightness(0.9) blur(5px)";
          overlay.style.opacity = "1";
          zoom.style.opacity = "0";
          accent.style.opacity = "0";
        } else if (Math.abs(pos) === 2) {
          const dir = pos > 0 ? 1 : -1;
          slide.style.transform = `translateX(${dir * d2}px) scale(${s2}) rotateY(${dir * -r2}deg) translateY(var(--parallax-y))`;
          slide.style.zIndex = "3";
          slide.style.opacity = isMobile ? "0" : "0.5";
          slide.style.filter = "brightness(0.4) blur(10px)";
          overlay.style.opacity = "1";
          zoom.style.opacity = "0";
          accent.style.opacity = "0";
        } else {
          const dir = pos > 0 ? 1 : -1;
          slide.style.transform = `translateX(${dir * (d2 + 200)}px) scale(0.4) translateY(var(--parallax-y))`;
          slide.style.zIndex = "0";
          slide.style.opacity = "0";
          slide.style.filter = "blur(8px)";
          accent.style.opacity = "0";
        }
      });

      const isDark = document.documentElement.classList.contains("dark");
      dotsWrap.querySelectorAll("button").forEach((dot, i) => {
        dot.style.width = i === current ? "24px" : "6px";
        dot.style.background =
          i === current ? "#f95602" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)";
      });
    }

    function goTo(index) {
      if (isAnimating) return;
      isAnimating = true;
      current = ((index % total) + total) % total;
      update();
      setTimeout(() => {
        isAnimating = false;
      }, 1000);
    }

    slides.forEach((slide, i) => {
      const zoom = slide.querySelector(".poster-zoom");
      slide.addEventListener("click", () => {
        const pos = getPos(i);
        if (pos === 0) {
          const img = slide.querySelector("img");
          const src = img.dataset.original;
          window.__openModal?.(src, img.alt, img.src);
        } else {
          goTo(i);
        }
      });
      slide.addEventListener("mouseenter", () => {
        if (getPos(i) === 0) zoom.style.opacity = "1";
      });
      slide.addEventListener("mouseleave", () => {
        zoom.style.opacity = "0";
      });
    });

    el("prev-btn").addEventListener("click", () => goTo(current - 1));
    el("next-btn").addEventListener("click", () => goTo(current + 1));

    let startX = 0;
    el("carousel-track").addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );
    el("carousel-track").addEventListener("touchend", (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 45) goTo(diff > 0 ? current + 1 : current - 1);
    });

    document.addEventListener("keydown", (e) => {
      const activeInCarousel = el("carousel-wrap").contains(
        document.activeElement,
      ) || el("carousel-wrap").matches(":focus-within");
      if (!activeInCarousel) return;
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    });

    let autoplay = setInterval(() => goTo(current + 1), 5000);
    el("carousel-wrap").addEventListener("mouseenter", () =>
      clearInterval(autoplay),
    );
    el("carousel-wrap").addEventListener("mouseleave", () => {
      autoplay = setInterval(() => goTo(current + 1), 5000);
    });

    window.addEventListener("resize", () => update());

    window.addEventListener(
      "scroll",
      () => {
        const wrap = el("carousel-wrap");
        const rect = wrap.getBoundingClientRect();
        const windowH = window.innerHeight;

        if (rect.bottom < 0 || rect.top > windowH) return;

        const progress = 1 - rect.bottom / (windowH + rect.height);
        const offset = (progress - 0.5) * 80;

        slides.forEach((slide, i) => {
          const pos = getPos(i);
          const depth = Math.abs(pos) === 0 ? 1 : Math.abs(pos) === 1 ? 0.5 : 0.2;
          slide.style.setProperty("--parallax-y", `${offset * depth}px`);
        });
      },
      { passive: true },
    );

    update();
  }

  // ===================================================================
  // 9. REPRODUCTOR DE VIDEO (YouTube)
  // ===================================================================
  function initVideoPlayer() {
    const mainWrap = el("main-player-wrap");
    const mainPoster = el("main-poster");
    const mainIframe = el("main-iframe");
    const mainThumb = el("main-thumb");
    const mainTitle = el("main-title");
    if (!mainWrap || !mainPoster || !mainIframe) return;

    const MAIN_ID = mainWrap.dataset.videoId;

    const setThumb = (img, thumbSrc) => {
      const match = thumbSrc.match(/\/vi\/([^/]+)\//);
      if (!match) {
        img.src = thumbSrc;
        return;
      }
      const vid = match[1];
      const sizes = ["maxresdefault", "hqdefault", "mqdefault"];

      const trySizes = (i) => {
        if (i >= sizes.length) return;
        img.onerror = () => trySizes(i + 1);
        img.src = `https://i.ytimg.com/vi/${vid}/${sizes[i]}.jpg`;
      };

      trySizes(0);
    };

    function playVideo(id, title, thumbSrc) {
      setThumb(mainThumb, thumbSrc);
      if (mainTitle) mainTitle.textContent = title;

      qsa(".video-thumb-btn").forEach((btn) => {
        btn.style.borderColor =
          btn.dataset.id === id ? "#f95602" : "var(--border-default)";
      });

      mainIframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&controls=1&rel=0`;
      mainIframe.style.opacity = "1";
      mainPoster.style.opacity = "0";
      mainPoster.style.pointerEvents = "none";

      mainWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setThumb(mainThumb, mainThumb.src);

    mainPoster.addEventListener("click", () => {
      playVideo(MAIN_ID, mainTitle?.textContent || "", mainThumb?.src || "");
    });

    qsa(".video-thumb-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        playVideo(
          btn.dataset.id,
          btn.dataset.title,
          btn.querySelector("img").src,
        );
      });
    });
  }

  // ===================================================================
  // 10. CALCULADORA DE COTIZACIÓN (con validación de formulario)
  // ===================================================================
  function initCalculator() {
    const chkFoto = el("chk-foto");
    const chkVideo = el("chk-video");
    const cardFoto = el("card-foto");
    const cardVideo = el("card-video");
    const grupoFoto = el("grupo-foto");
    const grupoVideo = el("grupo-video");
    const fueraEl = el("fuera");
    const kmContainer = el("kmContainer");
    const resultado = el("resultado");
    const totalEl = el("r-total");
    const rTotalOld = el("r-total-old");
    const rTotalOldWrap = el("r-total-old-wrap");
    const contactoWrap = el("contacto-wrap");
    const chkContacto = el("chk-contacto");
    const formContacto = el("form-contacto");
    const resBloques = el("res-bloques");
    const rPaquete = el("r-paquete");
    const cNombre = el("c-nombre");
    const cEmail = el("c-email");
    const cFecha = el("c-fecha");
    const btnEnviar = el("btn-enviar");
    const formError = el("form-error");
    const exportWrap = el("export-wrap");
    const btnPng = el("btn-export-png");
    const btnPdf = el("btn-export-pdf");
    const ticket = el("ticket");
    const tCliente = el("ticket-cliente");
    const tDetalle = el("ticket-detalle");
    const tNoiva = el("ticket-noiva");
    const tTotal = el("ticket-total");
    const tTotalOld = el("ticket-total-old");
    const tFolio = el("ticket-folio");
    if (!chkFoto || !cardFoto) return;

    let prevTotal = 0;
    let ultimoPromo = null;
    let ultimoBruto = 0;

    const PRECIO = {
      horaSesion: 280,
      edicionBase: 1200,
      minExtra: 120,
      viajeKm: 10,
      reel: 600,
      bloqueGrabacion: 800,
    };

    const TEMPORADAS = [
      { nombre: "Día de Reyes", m: 1, d: 2, m2: 1, d2: 5, pct: 15 },
      { nombre: "San Valentín", m: 2, d: 13, m2: 2, d2: 15, pct: 15 },
      { nombre: "Día de las Madres", m: 5, d: 10, m2: 5, d2: 11, pct: 15 },
      { nombre: "Vacaciones", m: 7, d: 15, m2: 8, d2: 5, pct: 15 },
      { nombre: "Regreso a clases", m: 8, d: 6, m2: 8, d2: 20, pct: 10 },
      { nombre: "Navidad", m: 12, d: 15, m2: 12, d2: 24, pct: 15 },
      { nombre: "Año Nuevo", m: 12, d: 26, m2: 1, d2: 2, pct: 15 },
    ];

    const enVentana = (f, w) => {
      const cur = (f.getMonth() + 1) * 100 + f.getDate();
      const ini = w.m * 100 + w.d;
      const fin = w.m2 * 100 + w.d2;
      return ini <= fin
        ? cur >= ini && cur <= fin
        : cur >= ini || cur <= fin;
    };
    const temporadaActiva = (ref) =>
      TEMPORADAS.find((t) => enVentana(ref, t)) || null;

    const bannerPromo = el("banner-promo");

    const fmt = (n) =>
      "$" +
      n.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const fila = (label, valor) =>
      `<div class="res-fila"><span class="res-fila-label">${label}</span><span class="res-fila-valor">${valor}</span></div>`;

    function toggleGrupo(grupo, show) {
      if (show) {
        grupo.style.display = "block";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            grupo.style.opacity = "1";
            grupo.style.transform = "translateY(0)";
          });
        });
      } else {
        grupo.style.opacity = "0";
        grupo.style.transform = "translateY(20px)";
        setTimeout(() => { grupo.style.display = "none"; }, 460);
      }
    }

    function updateCards() {
      cardFoto.classList.toggle("active", chkFoto.checked);
      cardVideo.classList.toggle("active", chkVideo.checked);
      toggleGrupo(grupoFoto, chkFoto.checked);
      toggleGrupo(grupoVideo, chkVideo.checked);
      calcular();
    }

    chkFoto.addEventListener("change", updateCards);
    chkVideo.addEventListener("change", updateCards);
    cardFoto.classList.add("active");

    fueraEl.addEventListener("change", () => {
      if (fueraEl.checked) {
        kmContainer.style.display = "block";
        kmContainer.style.maxHeight = kmContainer.scrollHeight + "px";
        kmContainer.style.opacity = "1";
      } else {
        kmContainer.style.maxHeight = "0px";
        kmContainer.style.opacity = "0";
      }
      calcular();
    });

    el("reel").addEventListener("change", calcular);
    ["fotos", "horas-foto", "km", "horas-video", "minutos-video", "c-fecha"].forEach(
      (id) => {
        el(id)?.addEventListener("input", calcular);
      },
    );

    const hideResult = () => {
      resultado.style.opacity = "0";
      resultado.style.transform = "translateY(20px)";
      resultado.style.pointerEvents = "none";
      chkContacto.checked = false;
      formContacto.classList.add("hidden");
      contactoWrap.classList.add("hidden");
      exportWrap?.classList.add("hidden");
    };

    function calcular() {
      const tieneFoto = chkFoto.checked;
      const tieneVideo = chkVideo.checked;
      if (!tieneFoto && !tieneVideo) {
        hideResult();
        return;
      }

      let bloques = "";
      let total = 0;
      let paquetes = [];

      if (tieneFoto) {
        const fotos = parseInt(el("fotos").value) || 0;
        const horas = parseInt(el("horas-foto").value) || 0;
        const km = parseInt(el("km").value) || 0;
        let precioPorFoto = 0,
          paquete = "";
        if (fotos < 40) {
          precioPorFoto = 22.5;
          paquete = "Básico";
        } else if (fotos < 70) {
          precioPorFoto = 21.5;
          paquete = "Platino";
        } else if (fotos < 150) {
          precioPorFoto = 22;
          paquete = "Dorado";
        } else {
          precioPorFoto = 21;
          paquete = "Personalizado";
        }
        const tFotos = fotos * precioPorFoto;
        const tHoras = horas * PRECIO.horaSesion;
        const tViat = fueraEl.checked ? km * PRECIO.viajeKm : 0;
        if (fotos > 0 || horas > 0) {
          let filas = "";
          if (fotos > 0) {
            filas += fila(`${fotos} fotos × $${precioPorFoto}`, fmt(tFotos));
            if (paquete) paquetes.push("Foto · " + paquete);
          }
          if (horas > 0)
            filas += fila(`Sesión · ${horas} h × $${PRECIO.horaSesion}`, fmt(tHoras));
          if (tViat > 0)
            filas += fila(`Viaje · ${km} km × $${PRECIO.viajeKm}`, fmt(tViat));
          bloques += `<div class="res-bloque"><p class="res-bloque-titulo">Fotografía</p>${filas}</div>`;
          total += tFotos + tHoras + tViat;
        }
      }

      if (tieneVideo) {
        const esReel = el("reel").checked;
        const hV = parseInt(el("horas-video").value) || 0;
        const mV = parseInt(el("minutos-video").value) || 0;
        if (esReel) {
          bloques += `<div class="res-bloque"><p class="res-bloque-titulo">Video</p>${fila("Reel · hasta 60 seg.", fmt(PRECIO.reel))}</div>`;
          total += PRECIO.reel;
          paquetes.push("Video · Reel");
        } else if (hV > 0 || mV > 0) {
          const tGrab = hV > 0 ? Math.ceil(hV / 2) * PRECIO.bloqueGrabacion : 0;
          const extra = Math.max(0, mV - 3);
          const tEdit = mV > 0 ? PRECIO.edicionBase + extra * PRECIO.minExtra : 0;
          let filas = "";
          if (hV > 0) filas += fila(`Grabación · ${hV} h`, fmt(tGrab));
          if (mV > 0)
            filas += fila(
              `Edición · ${mV} min${extra > 0 ? ` (+${extra} extra)` : ""}`,
              fmt(tEdit),
            );
          bloques += `<div class="res-bloque"><p class="res-bloque-titulo">Video</p>${filas}</div>`;
          total += tGrab + tEdit;
          paquetes.push("Video · Completo");
        }
      }

      const refFecha = cFecha.value
        ? new Date(cFecha.value + "T12:00:00")
        : new Date();
      const promo = temporadaActiva(refFecha);
      const totalBruto = total;
      ultimoPromo = promo;
      ultimoBruto = totalBruto;
      if (promo && total > 0) {
        const descuento = Math.round((total * promo.pct) / 100);
        total -= descuento;
        bloques += '<div class="res-bloque"><p class="res-bloque-titulo">Descuento</p>' + fila(promo.pct + "% · " + promo.nombre, "-" + fmt(descuento)) + "</div>";
      }

      if (total === 0) {
        hideResult();
        return;
      }

      resBloques.innerHTML = bloques;
      totalEl.textContent = fmt(total);
      if (rTotalOld && rTotalOldWrap) {
        if (promo && totalBruto > total) {
          rTotalOld.textContent = fmt(totalBruto);
          rTotalOldWrap.classList.remove("hidden");
        } else {
          rTotalOldWrap.classList.add("hidden");
        }
      }
      rPaquete.textContent = paquetes.join("  ·  ");
      resultado.style.opacity = "1";
      resultado.style.transform = "translateY(0)";
      resultado.style.pointerEvents = "auto";
      contactoWrap.classList.remove("hidden");
      exportWrap?.classList.remove("hidden");

      if (total !== prevTotal) {
        totalEl.style.transform = "scale(1.08)";
        totalEl.style.filter = "brightness(1.4)";
        setTimeout(() => {
          totalEl.style.transform = "scale(1)";
          totalEl.style.filter = "brightness(1)";
        }, 280);
        prevTotal = total;
      }
    }

    // Toggle formulario de contacto
    chkContacto.addEventListener("change", function () {
      formContacto.classList.toggle("hidden", !this.checked);
      if (formError) formError.classList.add("hidden");
    });

    // Botón enviar con validación
    btnEnviar.addEventListener("click", () => {
      const nombre = cNombre.value.trim();
      if (!nombre) {
        if (formError) formError.classList.remove("hidden");
        cNombre.focus();
        return;
      }
      if (formError) formError.classList.add("hidden");

      const email = cEmail.value.trim();
      const fecha = cFecha.value;
      const total = totalEl.textContent;
      const paquete = rPaquete.textContent;

      let detalle = "";
      resBloques.querySelectorAll(".res-fila").forEach((rf) => {
        const label = rf.querySelector(".res-fila-label")?.textContent || "";
        const valor = rf.querySelector(".res-fila-valor")?.textContent || "";
        detalle += `  • ${label}: ${valor}\n`;
      });

      const fechaTxt = fecha
        ? `Fecha tentativa: ${new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n`
        : "";
      const emailTxt = email ? `Correo de respuesta: ${email}\n` : "";

      const asunto = `Cotización Makers Fotografía y Video — ${nombre}`;
      const cuerpo = `Hola, equipo de Makers Fotografía y Video.

Mi nombre es ${nombre} y me gustaría solicitar una cotización con los siguientes detalles:

━━━━━━━━━━━━━━━━━━━━━
RESUMEN DE COTIZACIÓN
━━━━━━━━━━━━━━━━━━━━━
${detalle}
Paquete: ${paquete}
Total estimado: ${total} MXN
━━━━━━━━━━━━━━━━━━━━━
${fechaTxt}${emailTxt}
Quedo en espera de su respuesta para confirmar disponibilidad.

Saludos,
${nombre}`;

      const mailto = `mailto:makers25117@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
      window.location.href = mailto;
    });

    /* ---- Ticket ---- */
    const nombreCliente = () => cNombre.value.trim() || "Cliente";

    function llenarTicket() {
      const cliente = [];
      cliente.push(`Cliente: ${nombreCliente()}`);
      if (cFecha.value) {
        cliente.push(
          `Fecha del evento: ${new Date(cFecha.value + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`,
        );
      }
      tCliente.textContent = cliente.join("\n") || "Cliente";

      let filas = "";
      resBloques.querySelectorAll(".res-fila").forEach((rf) => {
        const label = rf.querySelector(".res-fila-label")?.textContent || "";
        const valor = rf.querySelector(".res-fila-valor")?.textContent || "";
        filas += `<div class="ticket-fila"><span class="t-lbl">${label}</span><span class="t-val">${valor}</span></div>`;
      });
      tDetalle.innerHTML = filas;

      if (rPaquete.textContent) {
        tNoiva.textContent = rPaquete.textContent;
      } else {
        tNoiva.textContent = "";
      }

      tTotal.textContent = totalEl.textContent;
      if (tTotalOld) {
        if (ultimoPromo && ultimoBruto > 0 && ultimoBruto !== parseFloat(totalEl.textContent.slice(1).replace(",", ""))) {
          tTotalOld.textContent = `${ultimoPromo.pct}% · Precio regular ${fmt(ultimoBruto)}`;
          tTotalOld.style.display = "flex";
        } else {
          tTotalOld.style.display = "none";
        }
      }
      tFolio.textContent = `Folio ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} · Makers Fotografía y Video`;
    }

    async function capturarTicket() {
      if (!ticket) return null;
      llenarTicket();

      try {
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise((r) => setTimeout(r, 60));
      } catch (_) {}

      const canvas = await html2canvas(ticket, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        onclone: (doc) => {
          const cl = doc.getElementById("ticket");
          if (cl) {
            cl.style.position = "static";
            cl.style.opacity = "1";
            cl.style.zIndex = "auto";
            cl.style.left = "0";
            cl.style.top = "0";
            cl.style.pointerEvents = "auto";
          }
        },
      });
      return canvas;
    }

    btnPng?.addEventListener("click", async () => {
      try {
        const canvas = await capturarTicket();
        if (!canvas) return;
        const a = document.createElement("a");
        a.download = `cotizacion-makers-${nombreCliente().toLowerCase().replace(/\s+/g, "-")}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      } catch (err) {
        console.error("Error al exportar PNG:", err);
        alert("No se pudo generar la imagen. Intenta de nuevo.");
      }
    });

    btnPdf?.addEventListener("click", async () => {
      try {
        const canvas = await capturarTicket();
        if (!canvas) return;
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
          hotfixes: ["px_scaling"],
        });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`cotizacion-makers-${nombreCliente().toLowerCase().replace(/\s+/g, "-")}.pdf`);
      } catch (err) {
        console.error("Error al exportar PDF:", err);
        alert("No se pudo generar el PDF. Intenta de nuevo.");
      }
    });

    /* Banner de promoción + fecha tentativa por defecto */
    if (bannerPromo) {
      const hoy = temporadaActiva(new Date());
      if (hoy) {
        bannerPromo.classList.remove("hidden");
        bannerPromo.innerHTML = `<strong>Promo ${hoy.nombre}</strong> · −${hoy.pct}% en cotizaciones para estas fechas<span class="promo-close" data-promo-close="1" aria-label="Cerrar">×</span>`;
        bannerPromo.querySelector("[data-promo-close]").addEventListener("click", () => {
          bannerPromo.classList.add("hidden");
        });
      }
    }
    if (cFecha) {
      const hoyDate = new Date();
      cFecha.value = cFecha.value || hoyDate.toISOString().slice(0, 10);
    }
  }

  // ===================================================================
  // 11. PREGUNTAS FRECUENTES — acordeón con ARIA completo
  // ===================================================================
  function initFaq() {
    const list = el("faq-list");
    if (!list) return;

    const faqs = [
      {
        categoria: "Precios y cotización",
        items: [
          {
            q: "¿Por qué las fotos tienen diferentes precios según la cantidad?",
            a: "A mayor volumen de fotos el costo por unidad baja ligeramente porque el proceso de selección y edición se optimiza en una sola sesión. Sin embargo el equipo, el tiempo en locación y la postproducción siempre tienen un costo base que se refleja en el precio mínimo.",
          },
          {
            q: "¿Qué incluye el precio de fotografía?",
            a: "Incluye la sesión en locación con equipo profesional Nikon D750, flash Godox AD200 Pro II con difusor y disparador inalámbrico. También la selección, edición y entrega en enlace de nube. La entrega en USB tiene un costo adicional de $100.",
          },
          {
            q: "¿Cómo se cobran los minutos de video?",
            a: "Cada minuto de video final representa horas de trabajo de edición: revisión de tomas, sincronización, colorización en DaVinci Resolve y ajuste de audio. La base incluye los primeros 3 minutos por $1,200; cada minuto adicional sobre los 3 cuesta $120. Por ejemplo, un video de 7 minutos: 7 − 3 = 4 minutos extra, es decir $1,200 + 4 × $120 = $1,680. Cada 2 horas de grabación es un bloque de $800 y se redondea hacia arriba (3 h = $1,600, 5 h = $2,400).",
          },
          {
            q: "¿Por qué se cobran los viáticos por separado?",
            a: "Los viáticos cubren combustible, tiempo de traslado y desgaste del equipo en rutas largas desde Felipe Carrillo Puerto. Se calculan por kilómetro de forma transparente para que sepas exactamente a qué se destina cada peso.",
          },
          {
            q: "¿Puedo contratar foto y video al mismo tiempo?",
            a: "Sí, y es la opción más completa para eventos como bodas o quinceañeras. Al combinar ambos servicios tienes cobertura total del evento con un equipo coordinado. Contáctanos para cotizar un paquete combinado.",
          },
          {
            q: "¿Hay descuentos por temporada?",
            a: "Sí. En fechas como Navidad, Año Nuevo, vacaciones de verano y regreso a clases ofrecemos promociones (generalmente del 10% al 15%) aplicadas automáticamente según la fecha tentativa que eliges en la calculadora. Los cupos son limitados a 2 sesiones por día, por eso conviene reservar con anticipación.",
          },
        ],
      },
      {
        categoria: "Proceso y entrega",
        items: [
          {
            q: "¿Cuánto tiempo tardan en entregar las fotos?",
            a: "Las fotos editadas se entregan en 24 horas. Trabajamos rápido sin sacrificar calidad — cada foto pasa por selección, retoque y ajuste de color antes de entregarse.",
          },
          {
            q: "¿Cuánto tiempo tarda la entrega de video?",
            a: "Un video completo se entrega en 2 días hábiles. Un reel para redes sociales también en 2 días. Editamos en DaVinci Resolve con equipo Mac con chip M5, lo que nos permite trabajar video 4K y entregar en HD con la mejor calidad posible.",
          },
          {
            q: "¿Cómo recibo mis fotos y video? ¿En qué formato?",
            a: "Las fotos se entregan en formato JPG de alta resolución por enlace de nube (Google Drive o similar). El video se entrega en MP4 optimizado para redes o reproducción. Si necesitas un formato específico, háznoslo saber al momento de contratar.",
          },
          {
            q: "¿Puedo solicitar fotos adicionales después de la sesión?",
            a: "Sí, siempre que el material esté disponible. Las fotos adicionales fuera del paquete original se cotizan al precio unitario correspondiente según el total acumulado.",
          },
          {
            q: "¿Qué pasa si el clima u otro imprevisto cancela la sesión?",
            a: "Reagendamos sin costo adicional. Entendemos que los eventos al aire libre dependen del clima. Te pedimos avisarnos con la mayor anticipación posible para coordinar una nueva fecha.",
          },
        ],
      },
      {
        categoria: "Equipo y calidad",
        items: [
          {
            q: "¿Qué equipo utilizan?",
            a: "En fotografía usamos Nikon D750 y Sony a6400 con flash Godox AD200 Pro II, difusor y disparador inalámbrico. En video trabajamos con Sony a6700 y a6400 en configuración multicámara, estabilizador gimbal, micrófonos Hollyland para audio profesional e iluminación continua.",
          },
          {
            q: "¿La música del video tiene derechos de autor?",
            a: "Sí. Usamos Artlist, una plataforma de licencias musicales profesional. Esto significa que tu video puede publicarse en YouTube, Instagram, TikTok o cualquier red social sin riesgo de que sea bloqueado o eliminado por derechos de autor.",
          },
          {
            q: "¿Editan en un estilo específico o puedo pedir algo personalizado?",
            a: "Tenemos nuestro propio estilo de edición, pero nos adaptamos a la visión de cada cliente. Si tienes referencias de colores, tonos o estilos que te gusten, compártelas al momento de contratar y las tomamos en cuenta en la edición.",
          },
        ],
      },
      {
        categoria: "Reservaciones",
        items: [
          {
            q: "¿Se requiere anticipo para apartar la fecha?",
            a: "Sí. Solicitamos un anticipo del 50% para confirmar y apartar tu fecha. El 50% restante se liquida cuando el material esté listo y antes de enviarlo. Esto garantiza el compromiso de ambas partes.",
          },
          {
            q: "¿Con cuánta anticipación debo reservar?",
            a: "Recomendamos reservar con al menos una semana de anticipación para sesiones casuales. Para eventos como bodas o quinceañeras, entre más tiempo de anticipación mejor, ya que las fechas se apartan por orden de llegada.",
          },
          {
            q: "¿Trabajan fines de semana y días festivos?",
            a: "Sí. La mayoría de nuestros eventos son precisamente en fines de semana y días festivos. No hay costo adicional por trabajar en esas fechas, aunque te recomendamos reservar con tiempo suficiente.",
          },
        ],
      },
    ];

    let faqId = 0;

    faqs.forEach((grupo) => {
      const cat = document.createElement("p");
      cat.className =
        "text-[14px] font-bold uppercase mt-8 mb-3";
      cat.style.color = "var(--accent)";
      cat.textContent = grupo.categoria;
      list.appendChild(cat);

      grupo.items.forEach((item) => {
        faqId++;
        const questionId = `faq-q-${faqId}`;
        const answerId = `faq-a-${faqId}`;

        const div = document.createElement("div");
        div.className = "faq-item";
        div.style.borderBottom = "1px solid var(--border-subtle)";
        div.style.overflow = "hidden";
        div.setAttribute("role", "listitem");

        div.innerHTML = `
          <button
            class="faq-btn"
            id="${questionId}"
            aria-expanded="false"
            aria-controls="${answerId}"
            type="button"
            style="width:100%;text-align:left;padding:16px 0;display:flex;justify-content:space-between;align-items:center;gap:16px;background:transparent;border:none;cursor:pointer;font-family:'Outfit',sans-serif;transition:color 0.2s ease;"
          >
            <span class="faq-q" style="font-size:14px;font-weight:600;color:var(--text-tertiary);">${item.q}</span>
            <span class="faq-icon" aria-hidden="true" style="flex-shrink:0;width:20px;height:20px;border-radius:9999px;border:1px solid var(--border-strong);display:flex;align-items:center;justify-content:center;color:var(--accent);opacity:0.7;transition:all 0.3s ease;font-size:18px;min-width:20px;">+</span>
          </button>
          <div
            id="${answerId}"
            role="region"
            aria-labelledby="${questionId}"
            class="faq-body"
            style="max-height:0;overflow:hidden;transition:max-height 0.35s cubic-bezier(0.16,1,0.3,1);"
          >
            <p style="font-size:16px;color:var(--text-muted);line-height:1.85;padding-bottom:1.25rem;font-family:'Outfit',sans-serif;">${item.a}</p>
          </div>
        `;
        list.appendChild(div);

        const btn = div.querySelector(".faq-btn");
        const body = div.querySelector(".faq-body");
        const icon = div.querySelector(".faq-icon");
        const q = div.querySelector(".faq-q");

        btn.addEventListener("click", () => {
          const isOpen = div.classList.contains("open");

          // Cierra todos los demás
          div.parentElement
            .querySelectorAll(".faq-item.open")
            .forEach((openEl) => {
              openEl.classList.remove("open");
              openEl.querySelector(".faq-body").style.maxHeight = "0";
              openEl.querySelector(".faq-icon").style.transform = "rotate(0deg)";
              openEl.querySelector(".faq-icon").style.background = "transparent";
              openEl.querySelector(".faq-btn").setAttribute("aria-expanded", "false");
              openEl.querySelector(".faq-q").style.color = "var(--text-tertiary)";
            });

          if (!isOpen) {
            div.classList.add("open");
            body.style.maxHeight = body.scrollHeight + "px";
            icon.style.transform = "rotate(45deg)";
            icon.style.background = "rgba(var(--accent-rgb), 0.1)";
            btn.setAttribute("aria-expanded", "true");
            q.style.color = "var(--text-primary)";
          }
        });
      });
    });
  }

  // ===================================================================
  // ARRANQUE
  // ===================================================================
  function initPlanSpotlight() {
    if (prefersReducedMotion) return;
    qsa(".plan-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mx", x + "%");
        card.style.setProperty("--my", y + "%");
      });
    });
  }

  function start() {
    initNavbar();
    initHeroParallax();
    initTypewriter();
    initCardTilt();
    initModal();
    initTabs();
    initScrollReveal();
    initPosterCarousel();
    initVideoPlayer();
    initCalculator();
    initFaq();
    initPlanSpotlight();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

export function wait(durationMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

export function nextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

export function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value ?? 0);
}

export function displayDate(value) {
  if (!value) {
    return "not generated";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function durationBetween(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) {
    return "n/a";
  }

  const milliseconds = Math.max(new Date(finishedAt) - new Date(startedAt), 0);
  const seconds = Math.round(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function formatTriggerMode(value) {
  const labels = {
    manual_only: "manual only",
    manual_or_schedule: "manual or schedule",
    manual_or_webhook: "manual or webhook"
  };

  return labels[value] ?? String(value ?? "").replaceAll("_", " ");
}

function agentRoleKey(descriptor) {
  const source =
    typeof descriptor === "string"
      ? normalize(descriptor)
      : normalize(
          [
            descriptor?.agentId,
            descriptor?.agentName,
            descriptor?.name,
            descriptor?.category
          ]
            .filter(Boolean)
            .join(" ")
        );

  if (source.includes("research")) {
    return "research";
  }

  if (source.includes("idea")) {
    return "idea";
  }

  if (source.includes("script")) {
    return "script";
  }

  if (source.includes("editor")) {
    return "editor";
  }

  if (source.includes("schedule")) {
    return "scheduler";
  }

  if (source.includes("analytic")) {
    return "analytics";
  }

  if (source.includes("lead")) {
    return "lead";
  }

  if (source.includes("dm") || source.includes("message")) {
    return "dm";
  }

  if (source.includes("creative")) {
    return "idea";
  }

  if (source.includes("sales")) {
    return "lead";
  }

  return "default";
}

function avatarAsset(kind, descriptor) {
  if (kind === "user") {
    return "./assets/icons/user-avatar.svg";
  }

  const tone = agentRoleKey(descriptor);
  const assets = {
    research: "./assets/icons/agents/research.svg",
    idea: "./assets/icons/agents/idea.svg",
    script: "./assets/icons/agents/script.svg",
    editor: "./assets/icons/agents/editor.svg",
    scheduler: "./assets/icons/agents/scheduler.svg",
    analytics: "./assets/icons/agents/analytics.svg",
    lead: "./assets/icons/agents/lead.svg",
    dm: "./assets/icons/agents/dm.svg",
    default: "./assets/icons/agents/default.svg"
  };

  return assets[tone] ?? assets.default;
}

function avatarMarkup(kind, size = "sm", descriptor = null) {
  const tone = kind === "agent" ? agentRoleKey(descriptor) : "user";

  return `
    <span class="agent-avatar agent-avatar--${kind} agent-avatar--${size}" data-agent-tone="${tone}" aria-hidden="true">
      <img src="${avatarAsset(kind, descriptor)}" alt="" loading="lazy" decoding="async" />
    </span>
  `;
}

export function agentAvatarMarkup(size = "sm", descriptor = null) {
  return avatarMarkup("agent", size, descriptor);
}

export function userAvatarMarkup(size = "sm") {
  return avatarMarkup("user", size);
}

const feedRailWidthStorageKey = "dashboard.feedRailWidth";

export function setFeedRailWidth(width, { persist = true } = {}) {
  const clampedWidth = Math.min(Math.max(Number(width) || 340, 280), 520);
  document.documentElement.style.setProperty("--feed-rail-width", `${clampedWidth}px`);

  if (persist) {
    try {
      window.localStorage.setItem(feedRailWidthStorageKey, String(clampedWidth));
    } catch {}
  }

  return clampedWidth;
}

function savedFeedRailWidth() {
  try {
    return window.localStorage.getItem(feedRailWidthStorageKey);
  } catch {
    return null;
  }
}

export function initializeFeedRailResize({ handle, onWidthChange }) {
  const initialWidth = setFeedRailWidth(savedFeedRailWidth() ?? 340, { persist: false });
  onWidthChange?.(initialWidth);

  if (!handle) {
    return initialWidth;
  }

  function applyWidth(width) {
    const nextWidth = setFeedRailWidth(width);
    handle.setAttribute("aria-valuenow", String(nextWidth));
    onWidthChange?.(nextWidth);
    return nextWidth;
  }

  handle.addEventListener("pointerdown", (event) => {
    if (window.matchMedia("(max-width: 1120px)").matches) {
      return;
    }

    const startX = event.clientX;
    const startWidth = Number(getComputedStyle(document.documentElement).getPropertyValue("--feed-rail-width").replace("px", "")) || initialWidth;

    document.body.classList.add("is-resizing-feed");
    handle.setPointerCapture?.(event.pointerId);

    const onPointerMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      applyWidth(startWidth + delta);
    };

    const stopResize = () => {
      document.body.classList.remove("is-resizing-feed");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });
    window.addEventListener("pointercancel", stopResize, { once: true });
  });

  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const currentWidth =
      Number(getComputedStyle(document.documentElement).getPropertyValue("--feed-rail-width").replace("px", "")) || initialWidth;
    const delta = event.key === "ArrowLeft" ? 20 : -20;
    applyWidth(currentWidth + delta);
  });

  return initialWidth;
}

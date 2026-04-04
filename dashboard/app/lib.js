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

function avatarAsset(kind) {
  const assets = {
    agent: "./assets/icons/agent-bot.svg",
    user: "./assets/icons/user-avatar.svg"
  };

  return assets[kind];
}

function avatarMarkup(kind, size = "sm") {
  return `
    <span class="agent-avatar agent-avatar--${size}" aria-hidden="true">
      <img src="${avatarAsset(kind)}" alt="" loading="lazy" decoding="async" />
    </span>
  `;
}

export function agentAvatarMarkup(size = "sm") {
  return avatarMarkup("agent", size);
}

export function userAvatarMarkup(size = "sm") {
  return avatarMarkup("user", size);
}

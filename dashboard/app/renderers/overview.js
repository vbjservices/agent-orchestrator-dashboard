import { nodes } from "../context.js";
import { dashboardMetrics } from "../model.js";

export function renderMetrics() {
  const cards = dashboardMetrics();

  nodes.metrics.innerHTML = cards
    .map(
      ([tone, label, value, meta]) => `
        <article class="metric-card metric-card--${tone}">
          <p class="metric-card__label">${label}</p>
          <strong class="metric-card__value">${value}</strong>
          <span class="metric-card__meta">${meta}</span>
        </article>
      `
    )
    .join("");
}

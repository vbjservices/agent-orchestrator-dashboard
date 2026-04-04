import { nodes } from "../context.js";
import { displayDate } from "../lib.js";
import { contentPerformanceSnapshot } from "../model.js";

function sparklinePath(values) {
  if (!values.length) {
    return "";
  }

  const width = 240;
  const height = 68;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const normalized = (value - min) / range;
      const y = height - normalized * (height - 10) - 5;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function platformCard(platform) {
  return `
    <article class="platform-card platform-card--${platform.tone}">
      <div class="platform-card__head">
        <div>
          <h3>${platform.label}</h3>
          <small>${platform.handle}</small>
        </div>
        <span class="status-chip status-chip--running">live</span>
      </div>
      <dl class="platform-card__stats">
        <div>
          <dt>${platform.audienceLabel}</dt>
          <dd>${platform.audience}</dd>
        </div>
        <div>
          <dt>${platform.volumeLabel}</dt>
          <dd>${platform.contentVolume}</dd>
        </div>
        <div>
          <dt>Views</dt>
          <dd>${platform.totalViewsLabel}</dd>
        </div>
        <div>
          <dt>Eng. Rate</dt>
          <dd>${platform.averageEngagementLabel}</dd>
        </div>
      </dl>
      <div class="platform-card__sparkline" aria-hidden="true">
        <svg viewBox="0 0 240 68" preserveAspectRatio="none">
          <path d="${sparklinePath(platform.sparkline)}" />
        </svg>
      </div>
    </article>
  `;
}

function postTable(posts) {
  if (!posts.length) {
    return `<p class="empty">No simulated post performance matches the current scope.</p>`;
  }

  const rows = posts
    .map(
      (post) => `
        <tr>
          <td>${displayDate(post.postedAt)}</td>
          <td><span class="performance-platform performance-platform--${post.platformTone}">${post.platformLabel}</span></td>
          <td>
            <strong>${post.title}</strong>
            <small>${post.workflowName} · ${post.workspaceName}</small>
          </td>
          <td>${post.viewsLabel}</td>
          <td>${post.likes}</td>
          <td>${post.comments}</td>
          <td class="performance-table__engagement">${post.engagementRateLabel}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table class="performance-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Platform</th>
          <th>Content</th>
          <th>Views</th>
          <th>Likes</th>
          <th>Comments</th>
          <th>Eng. Rate</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function insightCards(insights) {
  return insights
    .map(
      (insight) => `
        <article class="insight-card insight-card--${insight.tone}">
          <p class="insight-card__label">${insight.label}</p>
          <p class="insight-card__text">${insight.text}</p>
        </article>
      `
    )
    .join("");
}

export function renderPerformanceDashboard() {
  const snapshot = contentPerformanceSnapshot();

  nodes.performanceSummary.innerHTML =
    snapshot.platforms.map(platformCard).join("") ||
    `<p class="empty">Performance summary will appear once content outputs exist.</p>`;

  nodes.performanceTable.innerHTML = postTable(snapshot.posts);
  nodes.performanceInsights.innerHTML =
    insightCards(snapshot.insights) || `<p class="empty">No performance insights are available yet.</p>`;
}

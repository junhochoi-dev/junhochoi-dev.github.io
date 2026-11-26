---
layout: default
title: Log
permalink: /log/
---

{% assign r = site.data.running %}

<div class="page-banner">
<h1 class="page-banner-title">Log</h1>
<p class="page-banner-desc">러닝 기록과 일상·개발 로그를 카테고리별로 모아봅니다.</p>
</div>

<div class="log-main-tabs" id="log-main-tabs">
<button type="button" class="log-main-tab active" data-tab="running">Running</button>
<button type="button" class="log-main-tab" data-tab="daily">Daily</button>
</div>

<section id="tab-running" class="log-tab-panel">
<p class="log-tab-quote">{{ r.quote }}</p>

<div class="stat-grid">
<div class="stat-card stat-card-dark">
<div class="stat-label">TOTAL FINISHES</div>
<div class="stat-value">{{ r.races.size }} Races</div>
<div class="stat-sub">100% Finish Rate · 0 DNF</div>
</div>
<div class="stat-card">
<div class="stat-label">FULL (42.195KM) PB</div>
<div class="stat-value">{{ r.pb_full }}</div>
<div class="stat-sub">Pace {{ r.pb_full_pace }}</div>
</div>
<div class="stat-card">
<div class="stat-label">HALF (21.0975KM) PB</div>
<div class="stat-value">{{ r.pb_half }}</div>
<div class="stat-sub">Pace {{ r.pb_half_pace }}</div>
</div>
<div class="stat-card">
<div class="stat-label">10K PB</div>
<div class="stat-value">{{ r.pb_10k }}</div>
<div class="stat-sub">Pace {{ r.pb_10k_pace }}</div>
</div>
</div>

<div class="log-filter-bar" id="race-filters">
<button type="button" class="log-filter-btn active" data-filter="all">All ({{ r.races.size }})</button>
<button type="button" class="log-filter-btn" data-filter="full">FULL</button>
<button type="button" class="log-filter-btn" data-filter="half">HALF</button>
<button type="button" class="log-filter-btn" data-filter="10k">10K</button>
</div>

<div class="info-card">
<div class="race-header">
<span>일자</span>
<span>대회명</span>
<span>종목</span>
<span>기록</span>
<span>페이스</span>
<span class="col-date">배지</span>
</div>
<ul class="race-list" id="race-list">
{% for race in r.races %}
<li data-type="{{ race.type }}">
<span class="col-issuer">{{ race.date }}</span>
<span class="col-name">{{ race.name }}</span>
<span><span class="edu-badge {% if race.distance == 'FULL' %}edu-badge-primary{% elsif race.distance == 'HALF' %}edu-badge-doing{% else %}edu-badge-secondary{% endif %}">{{ race.distance }}</span></span>
<span class="race-time">{{ race.time }}</span>
<span class="col-issuer">{{ race.pace }}</span>
<span class="col-date">
{% if race.is_pb %}
<span class="pb-badge">PB · {{ race.badge }}</span>
{% else %}
<span class="skill-pill">{{ race.badge }}</span>
{% endif %}
</span>
</li>
{% endfor %}
</ul>
</div>
</section>

<section id="tab-daily" class="log-tab-panel" hidden>
<div class="timeline">
{% for log in site.data.dailylog %}
<div class="timeline-item">
<div class="timeline-header">
<h2 class="timeline-role">{{ log.title }}</h2>
<span class="timeline-date">{{ log.date }}</span>
</div>
<ul class="timeline-list">
{% for item in log.items %}
<li>{{ item }}</li>
{% endfor %}
</ul>
{% if log.tags %}
<ul class="badge-list">
{% for tag in log.tags %}
<li class="skill-pill">#{{ tag }}</li>
{% endfor %}
</ul>
{% endif %}
</div>
{% endfor %}
</div>
</section>

<script>
(function () {
  const mainTabs = document.querySelectorAll('#log-main-tabs .log-main-tab');
  const panels = document.querySelectorAll('.log-tab-panel');

  mainTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = tab.getAttribute('data-tab');
      mainTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      panels.forEach(function (panel) {
        panel.hidden = (panel.id !== 'tab-' + target);
      });
    });
  });

  const buttons = document.querySelectorAll('#race-filters .log-filter-btn');
  const rows = document.querySelectorAll('#race-list li');

  const counts = { full: 0, half: 0, '10k': 0 };
  rows.forEach(function (row) {
    const t = row.getAttribute('data-type');
    if (counts[t] !== undefined) counts[t] += 1;
  });

  buttons.forEach(function (btn) {
    const f = btn.getAttribute('data-filter');
    if (f !== 'all' && counts[f] !== undefined) {
      btn.textContent = btn.textContent + ' (' + counts[f] + ')';
    }
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      rows.forEach(function (row) {
        row.hidden = (f !== 'all' && row.getAttribute('data-type') !== f);
      });
    });
  });
})();
</script>

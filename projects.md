---
layout: default
title: Projects
permalink: /projects/
---

<div class="page-banner">
<h1 class="page-banner-title">Projects</h1>
<p class="page-banner-desc">주요 업무, 연구 및 개발 프로젝트 아카이브</p>
</div>

<div class="timeline">
{% for proj in site.data.projects %}
<div class="timeline-item">
<div class="timeline-header">
<h2 class="timeline-role">{{ proj.title }}</h2>
<span class="timeline-date">{{ proj.period }}</span>
</div>
<div class="timeline-org">{{ proj.org }}</div>
<ul class="timeline-list">
{% for b in proj.bullets %}
<li>{{ b }}</li>
{% endfor %}
</ul>
<ul class="badge-list">
{% for tag in proj.tags %}
<li class="skill-pill">{{ tag }}</li>
{% endfor %}
</ul>
</div>
{% endfor %}
</div>

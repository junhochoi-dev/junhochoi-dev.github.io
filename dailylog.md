---
layout: default
title: DailyLog
permalink: /dailylog/
---

<div class="page-banner">
<h1 class="page-banner-title">DailyLog</h1>
<p class="page-banner-desc">매일의 학습, 개발 작업, 짧은 회고를 날짜별로 기록합니다.</p>
</div>

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

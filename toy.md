---
layout: default
title: Toy
permalink: /toy/
---

<div class="page-banner">
<h1 class="page-banner-title">Toy</h1>
<p class="page-banner-desc">가볍게 만들어 본 실험 프로젝트와 사이드 작업들</p>
</div>

{% if site.data.toy and site.data.toy.size > 0 %}
<div class="two-col-grid">
{% for item in site.data.toy %}
<a href="{{ item.url }}" target="_blank" rel="noopener" class="info-card">
<div class="badge-list" style="margin-top: 0; margin-bottom: 0.75rem;">
<span class="skill-pill">{{ item.tag }}</span>
</div>
<h2 class="info-card-title">{{ item.title }}</h2>
<p class="info-card-desc">{{ item.desc }}</p>
<span class="card-link-label">{{ item.url_label }}</span>
</a>
{% endfor %}
</div>
{% else %}
<div class="info-card" style="text-align: center; padding: 3rem 1.5rem;">
<p class="info-card-desc">아직 등록된 토이 프로젝트가 없습니다.</p>
</div>
{% endif %}

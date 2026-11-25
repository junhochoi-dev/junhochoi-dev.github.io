---
layout: default
title: Home
---

{% assign p = site.data.profile %}

<section class="hero-section">
<span class="hero-badge">{{ p.hero.badge }}</span>
<h1 class="hero-title">{{ p.hero.title }}</h1>
<p class="hero-subtitle">{{ p.hero.subtitle }}</p>
<div class="hero-actions">
{% for act in p.hero.actions %}
<a href="{{ act.url }}" class="btn-{{ act.style }}" {% if act.external %}target="_blank" rel="noopener"{% endif %}>{{ act.label }}</a>
{% endfor %}
</div>
</section>

<h2 class="section-heading">Core Focus</h2>
<div class="card-grid">
{% for item in p.focus %}
<div class="info-card">
<div class="info-card-icon">{{ item.icon }}</div>
<h3 class="info-card-title">{{ item.title }}</h3>
<p class="info-card-desc">{{ item.desc }}</p>
</div>
{% endfor %}
</div>

<h2 class="section-heading">Experience</h2>
<div class="timeline">
{% for exp in p.experience %}
<div class="timeline-item">
<div class="timeline-header">
<h3 class="timeline-role">{{ exp.role }} · <span class="timeline-org">{{ exp.org }}</span></h3>
<span class="timeline-date">{{ exp.period }}</span>
</div>
<ul class="timeline-list">
{% for line in exp.items %}
<li>{{ line }}</li>
{% endfor %}
</ul>
</div>
{% endfor %}
</div>

<div class="info-card stack-card">
<h3 class="info-card-title">🎓 Education &amp; Skills</h3>
<div class="edu-header">
<span>구분</span>
<span>학교</span>
<span>학과</span>
<span class="col-date">기간</span>
</div>
<ul class="edu-list">
{% for edu in p.education %}
<li>
<span><span class="edu-badge {% if edu.primary %}edu-badge-primary{% else %}edu-badge-secondary{% endif %}">{{ edu.type }}</span></span>
<span class="col-school">{{ edu.school }}</span>
<span class="col-major">{{ edu.major }}</span>
<span class="col-date">{{ edu.period }}</span>
</li>
{% endfor %}
</ul>
<ul class="badge-list">
{% for skill in p.skills %}
<li class="skill-pill">{{ skill }}</li>
{% endfor %}
</ul>
</div>

<div class="info-card stack-card">
<h3 class="info-card-title">📜 Licenses &amp; Certifications</h3>
<div class="record-header">
<span>자격증</span>
<span>발급기관</span>
<span class="col-date">취득일자</span>
</div>
<ul class="record-list">
{% for cert in p.certifications %}
<li>
<span class="col-name">
{% if cert.url %}
<a href="{{ cert.url }}" target="_blank" rel="noopener">{{ cert.name }}</a>
{% else %}
{{ cert.name }}
{% endif %}
</span>
<span class="col-issuer">{{ cert.issuer }}</span>
<span class="col-date">{{ cert.date }}</span>
</li>
{% endfor %}
</ul>
</div>

<div class="info-card stack-card">
<h3 class="info-card-title">🏆 Honors &amp; Awards</h3>
<div class="record-header">
<span>수상 내역</span>
<span>수여기관</span>
<span class="col-date">수상일자</span>
</div>
<ul class="record-list">
{% for award in p.awards %}
<li>
<span class="col-name">{{ award.title }}</span>
<span class="col-issuer">{{ award.issuer }}</span>
<span class="col-date">{{ award.date }}</span>
</li>
{% endfor %}
</ul>
</div>

<div class="contact-strip">
<span>{{ p.links_message }}</span>
<div class="contact-links">
{% for link in p.links %}
<a href="{{ link.url }}" {% if link.external %}target="_blank" rel="noopener"{% endif %}>{{ link.label }}</a>
{% endfor %}
</div>
</div>

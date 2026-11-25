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

<div class="two-col-grid">
<div class="info-card">
<h3 class="info-card-title">🎓 Education &amp; Skills</h3>
<ul class="cert-list">
{% for edu in p.education %}
<li><span><strong>{{ edu.school }}</strong> · {{ edu.major }}</span><span class="cert-meta">{{ edu.period }}</span></li>
{% endfor %}
</ul>
<ul class="badge-list">
{% for skill in p.skills %}
<li class="skill-pill">{{ skill }}</li>
{% endfor %}
</ul>
</div>

<div class="info-card">
<h3 class="info-card-title">📜 Licenses &amp; Certifications</h3>
<ul class="cert-list">
{% for cert in p.certifications %}
<li>
{% if cert.url %}
<a href="{{ cert.url }}" target="_blank" rel="noopener">{{ cert.name }}</a>
{% else %}
<span>{{ cert.name }}</span>
{% endif %}
<span class="cert-meta">{{ cert.meta }}</span>
</li>
{% endfor %}
</ul>
</div>
</div>

<div class="info-card">
<h3 class="info-card-title">🏆 Honors &amp; Awards</h3>
<ul class="award-list">
{% for award in p.awards %}
<li><span>{{ award.title }}</span><span class="cert-meta">{{ award.meta }}</span></li>
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

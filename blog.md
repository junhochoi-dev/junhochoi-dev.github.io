---
layout: default
title: Blog
permalink: /blog/
---

<div class="page-banner">
<h1 class="page-banner-title">Blog</h1>
<p class="page-banner-desc">개발 공부, 트러블슈팅, 클라우드 및 AI 엔지니어링 기록</p>
</div>

<div class="blog-list">
{% for post in site.posts %}
<a href="{{ post.url | relative_url }}" class="blog-card">
<div class="blog-card-meta">
<span>{{ post.date | date: "%Y.%m.%d" }}</span>
{% for tag in post.tags %}
<span class="skill-pill">#{{ tag }}</span>
{% endfor %}
</div>
<h2 class="blog-card-title">{{ post.title | escape }}</h2>
<p class="blog-card-excerpt">{{ post.excerpt | strip_html | truncate: 140 }}</p>
</a>
{% endfor %}
</div>

---
layout: default
title: ToDo
permalink: /todo/
---

<div class="page-banner">
<h1 class="page-banner-title">ToDo</h1>
<p class="page-banner-desc">진행 중이거나 앞으로 할 작업 목록을 관리합니다.</p>
</div>

<div class="info-card">
<div class="todo-header">
<span>상태</span>
<span>할 일</span>
<span>분류</span>
<span class="col-date">목표</span>
</div>
<ul class="todo-list">
{% for item in site.data.todo %}
<li class="{% if item.status == 'done' %}todo-done{% endif %}">
<span>
{% if item.status == 'done' %}
<span class="edu-badge edu-badge-primary">DONE</span>
{% elsif item.status == 'doing' %}
<span class="edu-badge edu-badge-doing">DOING</span>
{% else %}
<span class="edu-badge edu-badge-secondary">TODO</span>
{% endif %}
</span>
<span class="col-name todo-title">{{ item.title }}</span>
<span class="col-issuer">{{ item.category }}</span>
<span class="col-date">{{ item.due }}</span>
</li>
{% endfor %}
</ul>
</div>

---
layout: post
title: "HTTPRoute"
date: 2026-11-26 15:07:00 +0900
categories: [Kubernetes]
tags: [kubernetes, gateway-api, httproute]
---

## 개요

Kubernetes Gateway API의 `HTTPRoute` 리소스에 대한 정리 글입니다.

---

## 주요 내용

- 

---

## 예시 YAML

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: example-route
spec:
  parentRefs:
    - name: example-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: example-service
          port: 80
```

---

## 정리

- 

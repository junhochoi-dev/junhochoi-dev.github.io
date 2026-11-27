(function () {
  const hashAInput = document.getElementById('hash-a');
  const hashBInput = document.getElementById('hash-b');
  const calcBtn = document.getElementById('btn-calc');
  const sampleBtn = document.getElementById('btn-sample');
  const swapBtn = document.getElementById('btn-swap');
  const resetBtn = document.getElementById('btn-reset-all');
  const errorEl = document.getElementById('error-msg');
  const resultCard = document.getElementById('result-card');
  const pairIdEl = document.getElementById('res-pair-id');
  const tierBoxEl = document.getElementById('res-tier-box');
  const scoreEl = document.getElementById('res-score');
  const gradeShortEl = document.getElementById('res-grade-short');
  const headlineEl = document.getElementById('res-headline');
  const commentEl = document.getElementById('res-comment');
  const scoreFillEl = document.getElementById('res-score-fill');
  const copyLinkBtn = document.getElementById('btn-copy-link');
  const copyTextBtn = document.getElementById('btn-copy-text');
  const copyToastEl = document.getElementById('copy-toast');

  const metricEls = [
    { val: document.getElementById('m1-val'), bar: document.getElementById('m1-bar') },
    { val: document.getElementById('m2-val'), bar: document.getElementById('m2-bar') },
    { val: document.getElementById('m3-val'), bar: document.getElementById('m3-bar') },
    { val: document.getElementById('m4-val'), bar: document.getElementById('m4-bar') }
  ];

  let lastReport = null;

  function normalizeHash(raw) {
    return raw.trim().toUpperCase();
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function fnv1a32(str, seed) {
    let h = (0x811c9dc5 ^ (seed || 0)) >>> 0;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  async function computePairBytes(a, b) {
    const pair = [a, b].sort();
    const canonical = pair[0] + '::' + pair[1];

    if (window.crypto && window.crypto.subtle) {
      const encoded = new TextEncoder().encode(canonical);
      const buf = await window.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(buf));
    }

    const bytes = [];
    for (let i = 0; i < 8; i += 1) {
      const h = fnv1a32(canonical, i * 0x9e3779b9);
      bytes.push((h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff);
    }
    return bytes;
  }

  function toHex(bytes) {
    return bytes
      .map(function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('')
      .toUpperCase();
  }

  function getGradeInfo(score, isSameHash) {
    if (isSameHash) {
      return {
        tierClass: 'tier-S',
        shortLabel: 'S+ 데칼코마니',
        headline: '“거울을 보는 듯 완벽하게 일치하는 조합입니다.”',
        comment: '두 해시값이 완전히 같습니다! 세상에서 가장 나를 잘 이해하는 100% 데칼코마니 조합이네요.'
      };
    }
    if (score >= 90) {
      return {
        tierClass: 'tier-S',
        shortLabel: 'S등급 천생연분',
        headline: '“해시 비트 단위까지 놀라울 정도로 맞물리는 천생연분!”',
        comment: '말하지 않아도 통하는 포인트가 많아 오래 함께할수록 더 단단해지는 최상위 시너지 궁합입니다.'
      };
    }
    if (score >= 75) {
      return {
        tierClass: 'tier-A',
        shortLabel: 'A등급 황금밸런스',
        headline: '“설렘과 안정감이 균형을 이룬 이상적인 궁합입니다.”',
        comment: '서로의 다른 점이 오히려 매력으로 작용해, 가끔 티격태격해도 금방 웃으며 풀 수 있는 건강한 관계예요.'
      };
    }
    if (score >= 60) {
      return {
        tierClass: 'tier-B',
        shortLabel: 'B등급 성장형 케미',
        headline: '“알아갈수록 편해지고 빛나는 무난한 호감형 케미예요.”',
        comment: '서로의 취향과 소통 방식을 조금만 맞춰가면 기대 이상의 시너지를 만들어 낼 수 있습니다.'
      };
    }
    if (score >= 40) {
      return {
        tierClass: 'tier-C',
        shortLabel: 'C등급 반전매력',
        headline: '“서로 다른 주파수, 대화가 열쇠가 되는 조합입니다.”',
        comment: '초반에는 낯설 수 있지만 다름을 인정하고 대화를 자주 나누면 의외의 케미가 터질 수 있는 사이예요.'
      };
    }
    return {
      tierClass: 'tier-D',
      shortLabel: 'D등급 극과극 모험',
      headline: '“정반대의 성향이 부딪히는 예측 불가 모험가 조합!”',
      comment: '평범한 연애보다 다이나믹한 에피소드가 많을 타입이니 서로에 대한 배려와 여유가 핵심입니다.'
    };
  }

  async function evaluate() {
    clearError();
    const a = normalizeHash(hashAInput.value);
    const b = normalizeHash(hashBInput.value);

    if (!a || !b) {
      showError('두 사람의 해시값을 모두 입력해 주세요.');
      return;
    }

    const isSameHash = a === b;
    const bytes = await computePairBytes(a, b);
    const hex = toHex(bytes);

    let m1, m2, m3, m4, total;
    if (isSameHash) {
      m1 = m2 = m3 = m4 = 100;
      total = 100;
    } else {
      m1 = 35 + (((bytes[0] << 8) | bytes[1]) % 66);
      m2 = 35 + (((bytes[2] << 8) | bytes[3]) % 66);
      m3 = 35 + (((bytes[4] << 8) | bytes[5]) % 66);
      m4 = 35 + (((bytes[6] << 8) | bytes[7]) % 66);
      const rawWeighted = Math.round(m1 * 0.28 + m2 * 0.24 + m3 * 0.24 + m4 * 0.24);
      const jitter = (bytes[8] % 7) - 3;
      total = Math.max(15, Math.min(99, rawWeighted + jitter));
    }

    const grade = getGradeInfo(total, isSameHash);
    tierBoxEl.className = 'tier-badge-compact ' + grade.tierClass;
    scoreEl.textContent = String(total);
    gradeShortEl.textContent = grade.shortLabel;
    headlineEl.textContent = grade.headline;
    commentEl.textContent = grade.comment;
    scoreFillEl.style.width = total + '%';
    pairIdEl.textContent = 'PAIR · ' + hex.slice(0, 12);

    const metrics = [m1, m2, m3, m4];
    metrics.forEach(function (val, idx) {
      metricEls[idx].val.textContent = val + '%';
      metricEls[idx].bar.style.width = val + '%';
    });

    lastReport = {
      a: a,
      b: b,
      total: total,
      grade: grade.shortLabel,
      metrics: metrics,
      digest: hex.slice(0, 12)
    };

    resultCard.hidden = false;
    copyToastEl.hidden = true;
  }

  function showToast(msg) {
    copyToastEl.textContent = msg;
    copyToastEl.hidden = false;
  }

  calcBtn.addEventListener('click', evaluate);

  [hashAInput, hashBInput].forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') evaluate();
    });
  });

  sampleBtn.addEventListener('click', function () {
    hashAInput.value = '8F4E2A9C1B7D30564A21E908C7F13B24';
    hashBInput.value = '3C91D0E4A5F28B1790D24E6A18C3F509';
    evaluate();
  });

  swapBtn.addEventListener('click', function () {
    const temp = hashAInput.value;
    hashAInput.value = hashBInput.value;
    hashBInput.value = temp;
    if (hashAInput.value.trim() && hashBInput.value.trim()) {
      evaluate();
    }
  });

  resetBtn.addEventListener('click', function () {
    hashAInput.value = '';
    hashBInput.value = '';
    clearError();
    resultCard.hidden = true;
    lastReport = null;
  });

  copyLinkBtn.addEventListener('click', function () {
    if (!lastReport) return;
    const url = new URL(window.location.href);
    url.searchParams.set('a', lastReport.a);
    url.searchParams.set('b', lastReport.b);
    navigator.clipboard.writeText(url.toString()).then(function () {
      showToast('결과 링크가 클립보드에 복사되었습니다.');
    }).catch(function () {
      showToast('클립보드 복사에 실패했습니다.');
    });
  });

  copyTextBtn.addEventListener('click', function () {
    if (!lastReport) return;
    const text = [
      '[연애 궁합 측정기 결과]',
      '궁합 점수: ' + lastReport.total + ' / 100 (' + lastReport.grade + ')',
      '가치관 ' + lastReport.metrics[0] + '% · 케미 ' + lastReport.metrics[1] + '% · 소통 ' + lastReport.metrics[2] + '% · 신뢰 ' + lastReport.metrics[3] + '%',
      'PAIR: ' + lastReport.digest
    ].join('\n');
    navigator.clipboard.writeText(text).then(function () {
      showToast('요약 텍스트가 클립보드에 복사되었습니다.');
    }).catch(function () {
      showToast('클립보드 복사에 실패했습니다.');
    });
  });

  const params = new URLSearchParams(window.location.search);
  const initA = params.get('a');
  const initB = params.get('b');
  if (initA && initB) {
    hashAInput.value = initA;
    hashBInput.value = initB;
    evaluate();
  }
})();

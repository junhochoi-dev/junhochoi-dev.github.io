// 연애등급측정기 앱 상태 및 판정 엔진

const state = {
  expectedTier: null,
  currentStep: 0,
  answers: {
    gender: null,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    job: null,
    housing: null,
    appearance: null,
    lifestyle: [],
    spending: null,
    communication: null,
    standard: null
  }
};

// DOM 요소
const screens = {
  intro: document.getElementById('screen-intro'),
  quiz: document.getElementById('screen-quiz'),
  loading: document.getElementById('screen-loading'),
  result: document.getElementById('screen-result')
};

const expectedSelector = document.getElementById('expected-tier-selector');
const btnStart = document.getElementById('btn-start');
const btnPrev = document.getElementById('btn-prev');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const quizBody = document.getElementById('quiz-body');
const toastEl = document.getElementById('toast');

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// 예상 등급 선택
expectedSelector.addEventListener('click', (e) => {
  const chip = e.target.closest('.tier-chip');
  if (!chip) return;
  expectedSelector.querySelectorAll('.tier-chip').forEach((c) => c.classList.remove('selected'));
  chip.classList.add('selected');
  state.expectedTier = chip.dataset.tier;
  btnStart.disabled = false;
  btnStart.textContent = `예상 ${state.expectedTier}등급으로 측정 시작하기`;
});

btnStart.addEventListener('click', () => {
  state.currentStep = 0;
  showScreen('quiz');
  renderQuestion();
});

btnPrev.addEventListener('click', () => {
  if (state.currentStep === 0) {
    showScreen('intro');
    return;
  }
  state.currentStep -= 1;
  renderQuestion();
});

// 만 나이 및 띠 계산
function calculateAgeAndZodiac(y, m, d) {
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age -= 1;
  }
  const zodiacs = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양'];
  const zodiac = zodiacs[y % 12];
  return { age, zodiac };
}

function validateBirthdate(yStr, mStr, dStr) {
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const currentYear = new Date().getFullYear();

  if (!yStr || !mStr || !dStr) return { valid: false, msg: '생년월일 3칸을 모두 입력해 주세요.' };
  if (y < 1950 || y > currentYear - 18) {
    return { valid: false, msg: `출생년도는 1950~${currentYear - 18}년 사이여야 합니다.` };
  }
  if (m < 1 || m > 12) return { valid: false, msg: '월은 1~12 사이로 입력해 주세요.' };
  const maxDay = new Date(y, m, 0).getDate();
  if (d < 1 || d > maxDay) return { valid: false, msg: `${m}월은 1~${maxDay}일까지 입력 가능합니다.` };

  return { valid: true, y, m, d };
}

// 문항 렌더링
function renderQuestion() {
  const q = QUESTIONS[state.currentStep];
  const total = QUESTIONS.length;
  progressText.textContent = `${state.currentStep + 1} / ${total}`;
  progressFill.style.width = `${((state.currentStep + 1) / total) * 100}%`;

  if (q.type === 'profile') {
    renderProfileStep(q);
    return;
  }

  if (q.type === 'single') {
    const selectedIdx = state.answers[q.id];
    quizBody.innerHTML = `
      <span class="q-step-badge">${q.stepTitle}</span>
      <h2 class="q-title">${q.title}</h2>
      <p class="q-desc">${q.desc}</p>
      <div class="options-list">
        ${q.options
          .map(
            (opt, idx) => `
          <button type="button" class="option-btn ${selectedIdx === idx ? 'selected' : ''}" data-idx="${idx}">
            <span>${opt.label}</span>
            <span class="option-check">${selectedIdx === idx ? '✓' : ''}</span>
          </button>
        `
          )
          .join('')}
      </div>
    `;

    quizBody.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.answers[q.id] = Number(btn.dataset.idx);
        goNextStep();
      });
    });
    return;
  }

  if (q.type === 'multi') {
    const selected = state.answers[q.id];
    quizBody.innerHTML = `
      <span class="q-step-badge">${q.stepTitle}</span>
      <h2 class="q-title">${q.title}</h2>
      <p class="q-desc">${q.desc}</p>
      <div class="options-list">
        ${q.options
          .map((opt, idx) => {
            const isSel = selected.includes(idx);
            return `
              <button type="button" class="option-btn ${isSel ? 'selected' : ''}" data-idx="${idx}">
                <span>${opt.label}</span>
                <span class="option-check">${isSel ? '✓' : ''}</span>
              </button>
            `;
          })
          .join('')}
      </div>
      <div style="margin-top: 18px;">
        <button type="button" id="btn-multi-next" class="btn-primary" ${selected.length === 0 ? 'disabled' : ''}>
          선택 완료
        </button>
      </div>
    `;

    quizBody.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        const opt = q.options[idx];
        let next = [...state.answers[q.id]];

        if (opt.exclusive) {
          next = next.includes(idx) ? [] : [idx];
        } else {
          // exclusive 옵션 제거
          const exclusiveIdx = q.options.findIndex((o) => o.exclusive);
          next = next.filter((i) => i !== exclusiveIdx);
          if (next.includes(idx)) {
            next = next.filter((i) => i !== idx);
          } else {
            next.push(idx);
          }
        }
        state.answers[q.id] = next;
        renderQuestion();
      });
    });

    const btnMultiNext = document.getElementById('btn-multi-next');
    if (btnMultiNext) {
      btnMultiNext.addEventListener('click', goNextStep);
    }
  }
}

function renderProfileStep(q) {
  const { gender, birthYear, birthMonth, birthDay } = state.answers;
  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">성별</span>
        <div class="gender-grid">
          <button type="button" class="option-btn ${gender === 'male' ? 'selected' : ''}" data-gender="male">
            <span>남성</span>
            <span class="option-check">${gender === 'male' ? '✓' : ''}</span>
          </button>
          <button type="button" class="option-btn ${gender === 'female' ? 'selected' : ''}" data-gender="female">
            <span>여성</span>
            <span class="option-check">${gender === 'female' ? '✓' : ''}</span>
          </button>
        </div>
      </div>

      <div>
        <span class="field-label">생년월일</span>
        <div class="birth-grid">
          <div class="birth-input-wrap">
            <input id="input-year" class="birth-input" type="number" inputmode="numeric" placeholder="1995" value="${birthYear}" />
            <span class="birth-unit">년</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-month" class="birth-input" type="number" inputmode="numeric" placeholder="05" value="${birthMonth}" />
            <span class="birth-unit">월</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-day" class="birth-input" type="number" inputmode="numeric" placeholder="12" value="${birthDay}" />
            <span class="birth-unit">일</span>
          </div>
        </div>
      </div>

      <div id="age-preview" class="age-preview" style="display:none;"></div>
      <div id="profile-error" class="error-msg"></div>

      <button type="button" id="btn-profile-next" class="btn-primary">다음 문항으로</button>
    </div>
  `;

  const yearEl = document.getElementById('input-year');
  const monthEl = document.getElementById('input-month');
  const dayEl = document.getElementById('input-day');
  const previewEl = document.getElementById('age-preview');
  const errorEl = document.getElementById('profile-error');

  function updatePreview() {
    state.answers.birthYear = yearEl.value.trim();
    state.answers.birthMonth = monthEl.value.trim();
    state.answers.birthDay = dayEl.value.trim();
    const check = validateBirthdate(state.answers.birthYear, state.answers.birthMonth, state.answers.birthDay);
    if (check.valid) {
      const { age, zodiac } = calculateAgeAndZodiac(check.y, check.m, check.d);
      previewEl.style.display = 'block';
      previewEl.textContent = `만 ${age}세 · ${zodiac}띠로 판정됩니다.`;
      errorEl.textContent = '';
    } else {
      previewEl.style.display = 'none';
    }
  }

  quizBody.querySelectorAll('[data-gender]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.gender = btn.dataset.gender;
      quizBody.querySelectorAll('[data-gender]').forEach((b) => {
        const active = b.dataset.gender === state.answers.gender;
        b.classList.toggle('selected', active);
        b.querySelector('.option-check').textContent = active ? '✓' : '';
      });
      errorEl.textContent = '';
    });
  });

  [yearEl, monthEl, dayEl].forEach((input) => {
    input.addEventListener('input', updatePreview);
  });
  updatePreview();

  document.getElementById('btn-profile-next').addEventListener('click', () => {
    if (!state.answers.gender) {
      errorEl.textContent = '성별을 선택해 주세요.';
      return;
    }
    const check = validateBirthdate(yearEl.value.trim(), monthEl.value.trim(), dayEl.value.trim());
    if (!check.valid) {
      errorEl.textContent = check.msg;
      return;
    }
    goNextStep();
  });
}

function goNextStep() {
  if (state.currentStep < QUESTIONS.length - 1) {
    state.currentStep += 1;
    renderQuestion();
  } else {
    runAnalysis();
  }
}

// 로딩 후 결과 계산
function runAnalysis() {
  showScreen('loading');
  const statusEl = document.getElementById('loading-status');
  const messages = [
    '현실 스펙과 시장 수요를 대조하고 있습니다...',
    '생활 허들과 눈높이 균형을 계산 중입니다...',
    '수석 매니저의 최종 판정이 완료되었습니다.'
  ];
  let step = 0;
  const timer = setInterval(() => {
    step += 1;
    if (step < messages.length) {
      statusEl.textContent = messages[step];
    }
  }, 500);

  setTimeout(() => {
    clearInterval(timer);
    const result = evaluateResult();
    renderResult(result);
    showScreen('result');
  }, 1500);
}

// 등급 산정 엔진
function evaluateResult() {
  const { gender, birthYear, birthMonth, birthDay, job, housing, appearance, lifestyle, spending, communication, standard } = state.answers;
  const { age, zodiac } = calculateAgeAndZodiac(Number(birthYear), Number(birthMonth), Number(birthDay));

  const jobOpt = QUESTIONS[1].options[job];
  const housingOpt = QUESTIONS[2].options[housing];
  const appOpt = QUESTIONS[3].options[appearance];
  const spendOpt = QUESTIONS[5].options[spending];
  const commOpt = QUESTIONS[6].options[communication];
  const stdOpt = QUESTIONS[7].options[standard];

  // 1) 연령 시장 가중치 (결정사 현실 반영, 최대 15점)
  let ageScore = 10;
  if (gender === 'female') {
    if (age <= 29) ageScore = 15;
    else if (age <= 33) ageScore = 12;
    else if (age <= 37) ageScore = 8;
    else ageScore = 4;
  } else {
    if (age >= 27 && age <= 34) ageScore = 15;
    else if (age <= 26 || age <= 38) ageScore = 11;
    else ageScore = 6;
  }

  // 2) 현실 스펙 (직업 + 주거 + 외모일부 + 나이) -> 100점 환산
  const rawSpec = jobOpt.spec + housingOpt.spec + appOpt.spec + ageScore; // max ~75
  const specPercent = Math.min(100, Math.round((rawSpec / 75) * 100));

  // 3) 연애 성향 (소비관 + 소통) -> 100점 환산
  const rawLove = spendOpt.love + commOpt.love; // max 34
  const lovePercent = Math.max(10, Math.min(100, Math.round((rawLove / 34) * 100)));

  // 4) 생활 허들 페널티
  const lifestyleOpts = QUESTIONS[4].options;
  let hurdlePenalty = 0;
  const hurdleTags = [];
  lifestyle.forEach((idx) => {
    const opt = lifestyleOpts[idx];
    hurdlePenalty += opt.penalty || 0;
    if (opt.tag) hurdleTags.push(opt.tag);
  });

  // 5) 시장 호감도 -> 100점 환산
  const rawAppeal = jobOpt.appeal + housingOpt.appeal + appOpt.appeal + spendOpt.appeal + commOpt.appeal - hurdlePenalty * 0.8;
  const appealPercent = Math.max(10, Math.min(100, Math.round(((rawAppeal + 6) / 50) * 100)));

  // 6) 메타인지(눈높이 균형) -> 100점 환산
  let eyePenalty = 0;
  if (specPercent < 55 && stdOpt.demandLevel >= 3) eyePenalty = 14;
  else if (specPercent < 75 && stdOpt.demandLevel === 4) eyePenalty = 12;
  else if (stdOpt.demandLevel === 4 && hurdlePenalty >= 8) eyePenalty = 10;

  const metaPercent = Math.max(15, Math.min(100, 75 + stdOpt.metaBonus - eyePenalty * 2));

  // 총점 계산 (100점 만점)
  const totalScore = Math.max(
    15,
    Math.min(
      98,
      Math.round(specPercent * 0.42 + lovePercent * 0.25 + appealPercent * 0.23 + metaPercent * 0.1 - hurdlePenalty * 0.7)
    )
  );

  // 등급 결정
  let actualTier = 'D';
  for (const t of TIER_ORDER) {
    if (totalScore >= TIER_PROFILES[t].minScore) {
      actualTier = t;
      break;
    }
  }

  return {
    genderLabel: gender === 'male' ? '남성' : '여성',
    age,
    zodiac,
    expectedTier: state.expectedTier,
    actualTier,
    totalScore,
    hurdleTags,
    eyePenalty,
    metrics: [
      { label: '현실 스펙 (직업·자산·연령)', score: specPercent },
      { label: '연애 성향 (경제관·소통)', score: lovePercent },
      { label: '시장 호감도 (매력·유연함)', score: appealPercent },
      { label: '메타인지 (눈높이 균형)', score: metaPercent }
    ]
  };
}

let lastResult = null;

function renderResult(res) {
  lastResult = res;
  const profile = TIER_PROFILES[res.actualTier];

  document.getElementById('result-profile-badge').textContent = `만 ${res.age}세 · ${res.zodiac}띠 · ${res.genderLabel}`;
  document.getElementById('result-doc-id').textContent = `SCORE ${res.totalScore} / 100`;
  document.getElementById('res-expected-tier').textContent = res.expectedTier;

  const actualBox = document.getElementById('res-actual-box');
  actualBox.className = `compare-box actual tier-${res.actualTier}`;
  document.getElementById('res-actual-tier').textContent = res.actualTier;

  // 예상 vs 실제 갭 메시지
  const expIdx = TIER_ORDER.indexOf(res.expectedTier);
  const actIdx = TIER_ORDER.indexOf(res.actualTier);
  const diff = actIdx - expIdx; // 양수면 기대보다 낮음
  const gapPill = document.getElementById('res-gap-pill');

  if (diff === 0) {
    gapPill.textContent = `정확한 메타인지! 예상과 실제(${res.actualTier}등급)가 일치합니다`;
    gapPill.className = 'gap-pill good';
  } else if (diff < 0) {
    gapPill.textContent = `겸손하시네요! 예상보다 ${Math.abs(diff)}단계 높은 ${res.actualTier}등급 판정`;
    gapPill.className = 'gap-pill good';
  } else {
    gapPill.textContent = `현실 자각 경보! 예상(${res.expectedTier})보다 ${diff}단계 낮은 ${res.actualTier}등급`;
    gapPill.className = 'gap-pill';
  }

  document.getElementById('res-headline').textContent = profile.headline;

  let extraComment = profile.comment;
  if (res.hurdleTags.length > 0) {
    extraComment += ` 특히 [${res.hurdleTags.join(', ')}] 요소가 매칭 풀을 좁히는 요인으로 작용했습니다.`;
  }
  if (res.eyePenalty > 0) {
    extraComment += ' 본인 스펙 대비 희망 조건이 높게 설정되어 감점이 발생했습니다.';
  }
  document.getElementById('res-comment').textContent = extraComment;
  document.getElementById('res-advice').textContent = profile.advice;

  const metricsEl = document.getElementById('res-metrics');
  metricsEl.innerHTML = res.metrics
    .map(
      (m) => `
      <div class="metric-row">
        <div class="metric-top">
          <span>${m.label}</span>
          <span>${m.score}점</span>
        </div>
        <div class="metric-bar-bg">
          <div class="metric-bar-fill" style="width: ${m.score}%"></div>
        </div>
      </div>
    `
    )
    .join('');
}

// 결과 카드 PNG 저장 (외부 라이브러리 없이 Canvas API 사용)
document.getElementById('btn-save-img').addEventListener('click', () => {
  if (!lastResult) return;
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = '#f4f5f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 카드
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 40, 40, 640, 820, 28);
  ctx.fill();

  // 상단 타이틀
  ctx.fillStyle = '#1c2434';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('연애등급측정기 · 결정사 모의 판정', 80, 105);

  ctx.fillStyle = '#5f6673';
  ctx.font = '600 18px sans-serif';
  ctx.fillText(`만 ${lastResult.age}세 · ${lastResult.zodiac}띠 · ${lastResult.genderLabel} (총점 ${lastResult.totalScore}점)`, 80, 140);

  // 예상 vs 실제 박스
  ctx.fillStyle = '#f8f9fb';
  roundRect(ctx, 80, 180, 240, 150, 20);
  ctx.fill();
  ctx.fillStyle = '#5f6673';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('내 예상', 200, 225);
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(lastResult.expectedTier, 200, 295);

  const tierColors = { S: '#7c3aed', A: '#2563eb', B: '#059669', C: '#d97706', D: '#dc2626' };
  ctx.fillStyle = tierColors[lastResult.actualTier];
  roundRect(ctx, 400, 180, 240, 150, 20);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('실제 판정', 520, 225);
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(lastResult.actualTier, 520, 295);

  ctx.fillStyle = '#9aa1ae';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('→', 360, 270);

  // 코멘트
  ctx.textAlign = 'left';
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 22px sans-serif';
  const headline = TIER_PROFILES[lastResult.actualTier].headline;
  wrapText(ctx, headline, 80, 390, 560, 32);

  // 4대 지표
  let y = 490;
  lastResult.metrics.forEach((m) => {
    ctx.fillStyle = '#181c23';
    ctx.font = '600 18px sans-serif';
    ctx.fillText(m.label, 80, y);
    ctx.textAlign = 'right';
    ctx.fillText(`${m.score}점`, 640, y);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#ebeef3';
    roundRect(ctx, 80, y + 12, 560, 14, 7);
    ctx.fill();

    ctx.fillStyle = '#1c2434';
    roundRect(ctx, 80, y + 12, (560 * m.score) / 100, 14, 7);
    ctx.fill();
    y += 72;
  });

  ctx.fillStyle = '#8b92a0';
  ctx.font = '500 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('나도 측정해보기 · 연애등급측정기', 360, 825);

  const link = document.createElement('a');
  link.download = `연애등급측정기_결과_${lastResult.actualTier}등급.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('결과 카드 이미지를 저장했습니다!');
});

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split('');
  let line = '';
  for (let i = 0; i < chars.length; i += 1) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = chars[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// 결과 텍스트 + URL 복사
document.getElementById('btn-copy-link').addEventListener('click', async () => {
  if (!lastResult) return;
  const text = `[연애등급측정기]\n내 예상: ${lastResult.expectedTier}등급 → 실제 판정: ${lastResult.actualTier}등급 (${lastResult.totalScore}점)\n${TIER_PROFILES[lastResult.actualTier].headline}\n${window.location.href}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast('결과가 클립보드에 복사되었습니다!');
  } catch {
    showToast('복사에 실패했습니다. 브라우저 권한을 확인해 주세요.');
  }
});

// 다시 하기
document.getElementById('btn-retry').addEventListener('click', () => {
  state.expectedTier = null;
  state.currentStep = 0;
  state.answers = {
    gender: null,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    job: null,
    housing: null,
    appearance: null,
    lifestyle: [],
    spending: null,
    communication: null,
    standard: null
  };
  expectedSelector.querySelectorAll('.tier-chip').forEach((c) => c.classList.remove('selected'));
  btnStart.disabled = true;
  btnStart.textContent = '예상 등급을 선택하면 시작합니다';
  showScreen('intro');
});

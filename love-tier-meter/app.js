// 연애등급측정기 앱 상태 및 판정 엔진

const state = {
  currentStep: 0,
  answers: {
    gender: null,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    birthMinute: '',
    unknownTime: false,
    region: '서울',
    heightCm: '',
    weightKg: '',
    educationDegree: null,
    educationTier: null,
    employmentType: null,
    salaryManwon: '',
    incentiveManwon: '',
    housingType: null,
    housingCostManwon: '',
    cashManwon: '',
    pensionManwon: '',
    investManwon: '',
    debtManwon: '',
    car: null,
    exerciseFreq: null,
    exerciseDuration: null,
    exerciseYears: null,
    smoking: null,
    drinking: null,
    religion: null,
    diet: null,
    datingCount: null,
    datingLongest: null,
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

const btnStart = document.getElementById('btn-start');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const quizBody = document.getElementById('quiz-body');
const toastEl = document.getElementById('toast');

let isHandlingPopState = false;
let lifeTimerInterval = null;

function clearLifeTimer() {
  if (lifeTimerInterval) {
    clearInterval(lifeTimerInterval);
    lifeTimerInterval = null;
  }
}

function showScreen(name, pushHistory = true) {
  if (name !== 'quiz') clearLifeTimer();
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pushHistory && !isHandlingPopState) {
    history.pushState({ screen: name, step: state.currentStep }, '');
  }
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

history.replaceState({ screen: 'intro', step: 0 }, '');

window.addEventListener('popstate', (e) => {
  const target = e.state;
  if (!target) return;
  isHandlingPopState = true;
  if (target.screen === 'intro') {
    showScreen('intro', false);
  } else if (target.screen === 'quiz') {
    state.currentStep = target.step || 0;
    showScreen('quiz', false);
    renderQuestion();
  } else if (target.screen === 'result' && lastResult) {
    showScreen('result', false);
  }
  isHandlingPopState = false;
});

btnStart.addEventListener('click', () => {
  state.currentStep = 0;
  showScreen('quiz');
  renderQuestion();
});

function handleBackStep() {
  clearLifeTimer();
  if (state.currentStep === 0) {
    showScreen('intro');
    return;
  }
  state.currentStep -= 1;
  showScreen('quiz');
  renderQuestion();
}

function bindBackButtons() {
  quizBody.querySelectorAll('.btn-quiz-back').forEach((btn) => {
    btn.addEventListener('click', handleBackStep);
  });
}

// 12지신 & 나이 계산
function getZodiacInfo(y) {
  const list = [
    { name: '원숭이', emoji: '🐵' },
    { name: '닭', emoji: '🐔' },
    { name: '개', emoji: '🐶' },
    { name: '돼지', emoji: '🐷' },
    { name: '쥐', emoji: '🐭' },
    { name: '소', emoji: '🐮' },
    { name: '호랑이', emoji: '🐯' },
    { name: '토끼', emoji: '🐰' },
    { name: '용', emoji: '🐲' },
    { name: '뱀', emoji: '🐍' },
    { name: '말', emoji: '🐴' },
    { name: '양', emoji: '🐑' }
  ];
  return list[y % 12];
}

function calculateAges(y, m, d) {
  const today = new Date();
  const yearAge = today.getFullYear() - y;
  let manAge = yearAge;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    manAge -= 1;
  }
  return { manAge, yearAge };
}

function getKoreanDecadeName(targetAge) {
  const map = {
    20: '스무 살',
    30: '서른',
    40: '마흔',
    50: '쉰',
    60: '예순',
    70: '일흔',
    80: '여든',
    90: '아흔',
    100: '백 살'
  };
  return map[targetAge] || `${targetAge}세`;
}

function getNextMilestoneCountdown(y, m, d, hour, minute, manAge) {
  const now = new Date();
  const nextDecade = Math.floor(manAge / 10) * 10 + 10;
  const targetYear = y + nextDecade;
  const targetDate = new Date(targetYear, m - 1, d, hour, minute, 0);

  if (targetDate <= now) return null;

  let years = targetDate.getFullYear() - now.getFullYear();
  let months = targetDate.getMonth() - now.getMonth();
  let days = targetDate.getDate() - now.getDate();
  let hours = targetDate.getHours() - now.getHours();
  let mins = targetDate.getMinutes() - now.getMinutes();

  if (mins < 0) {
    mins += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    const prevMonthLastDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate();
    days += prevMonthLastDay;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return {
    decadeLabel: getKoreanDecadeName(nextDecade),
    text: `${years}년 ${months}개월 ${days}일 ${hours}시간 ${mins}분 뒤 ${getKoreanDecadeName(nextDecade)}`
  };
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
  clearLifeTimer();
  const q = QUESTIONS[state.currentStep];
  const total = QUESTIONS.length;
  const percent = Math.round(((state.currentStep + 1) / total) * 100);
  progressText.textContent = `${state.currentStep + 1} / ${total} (${percent}%)`;
  progressFill.style.width = `${percent}%`;

  if (q.type === 'profile') return renderProfileStep(q);
  if (q.type === 'body') return renderBodyStep(q);
  if (q.type === 'education') return renderEducationStep(q);
  if (q.type === 'job') return renderJobStep(q);
  if (q.type === 'housing') return renderHousingStep(q);
  if (q.type === 'savings') return renderSavingsStep(q);
  if (q.type === 'selfcare') return renderSelfcareStep(q);
  if (q.type === 'lifestyle') return renderLifestyleStep(q);
  if (q.type === 'dating') return renderDatingStep(q);

  if (q.type === 'single') {
    const selectedIdx = state.answers[q.id];
    const nextLabel = state.currentStep === total - 1 ? '결과 보기' : '다음 문항으로';
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
      <div class="quiz-nav-row" style="margin-top: 18px;">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-single-next" class="btn-primary" ${selectedIdx === null ? 'disabled' : ''}>
          ${nextLabel}
        </button>
      </div>
    `;

    quizBody.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.answers[q.id] = Number(btn.dataset.idx);
        renderQuestion();
      });
    });

    document.getElementById('btn-single-next').addEventListener('click', () => {
      if (state.answers[q.id] === null) return;
      goNextStep();
    });
    bindBackButtons();
  }
}

// 1. 기본 프로필
function renderProfileStep(q) {
  const { gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, unknownTime, region } = state.answers;
  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">성별</span>
        <div class="gender-grid">
          <button type="button" class="option-btn ${gender === 'male' ? 'selected' : ''}" data-gender="male">
            <span>👨 남성</span>
            <span class="option-check">${gender === 'male' ? '✓' : ''}</span>
          </button>
          <button type="button" class="option-btn ${gender === 'female' ? 'selected' : ''}" data-gender="female">
            <span>👩 여성</span>
            <span class="option-check">${gender === 'female' ? '✓' : ''}</span>
          </button>
        </div>
      </div>

      <div>
        <span class="field-label">생년월일 및 출생 시간</span>
        <div class="birth-grid">
          <div class="birth-input-wrap">
            <input id="input-year" class="birth-input" type="number" inputmode="numeric" placeholder="0000" value="${birthYear}" />
            <span class="birth-unit">년</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-month" class="birth-input" type="number" inputmode="numeric" placeholder="00" value="${birthMonth}" />
            <span class="birth-unit">월</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-day" class="birth-input" type="number" inputmode="numeric" placeholder="00" value="${birthDay}" />
            <span class="birth-unit">일</span>
          </div>
        </div>

        <div id="time-inputs-wrap" class="time-grid" style="display: ${unknownTime ? 'none' : 'grid'};">
          <div class="birth-input-wrap">
            <input id="input-hour" class="birth-input" type="number" inputmode="numeric" min="0" max="23" placeholder="00" value="${birthHour}" />
            <span class="birth-unit">시</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-minute" class="birth-input" type="number" inputmode="numeric" min="0" max="59" placeholder="00" value="${birthMinute}" />
            <span class="birth-unit">분</span>
          </div>
        </div>

        <label class="checkbox-row">
          <input type="checkbox" id="chk-unknown-time" ${unknownTime ? 'checked' : ''} />
          <span>시 · 분 모름</span>
        </label>
      </div>

      <div id="life-counter-box" class="life-counter-box" style="display:none;">
        <div id="life-age-line" class="life-age-line"></div>
        <div id="life-timer-line" class="life-timer-line"></div>
        <div id="life-milestone-line" class="life-milestone-line"></div>
      </div>

      <div>
        <span class="field-label">현재 거주 지역 (참고 정보)</span>
        <select id="select-region" class="select-input">
          ${REGIONS.map((r) => `<option value="${r}" ${region === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>

      <div id="profile-error" class="error-msg"></div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-profile-next" class="btn-primary">다음 문항으로</button>
      </div>
    </div>
  `;

  const yearEl = document.getElementById('input-year');
  const monthEl = document.getElementById('input-month');
  const dayEl = document.getElementById('input-day');
  const hourEl = document.getElementById('input-hour');
  const minEl = document.getElementById('input-minute');
  const chkUnknownEl = document.getElementById('chk-unknown-time');
  const timeWrapEl = document.getElementById('time-inputs-wrap');
  const regionEl = document.getElementById('select-region');
  const counterBox = document.getElementById('life-counter-box');
  const ageLineEl = document.getElementById('life-age-line');
  const timerLineEl = document.getElementById('life-timer-line');
  const milestoneLineEl = document.getElementById('life-milestone-line');
  const errorEl = document.getElementById('profile-error');

  function updateLifeCounter() {
    clearLifeTimer();
    state.answers.birthYear = yearEl.value.trim();
    state.answers.birthMonth = monthEl.value.trim();
    state.answers.birthDay = dayEl.value.trim();
    state.answers.birthHour = hourEl.value.trim();
    state.answers.birthMinute = minEl.value.trim();

    const check = validateBirthdate(state.answers.birthYear, state.answers.birthMonth, state.answers.birthDay);
    if (!check.valid) {
      counterBox.style.display = 'none';
      return;
    }

    const { manAge, yearAge } = calculateAges(check.y, check.m, check.d);
    const zodiac = getZodiacInfo(check.y);
    counterBox.style.display = 'flex';
    ageLineEl.textContent = `${zodiac.emoji} ${zodiac.name}띠 · 만 ${manAge}세 (연 ${yearAge}세)`;

    if (state.answers.unknownTime) {
      timerLineEl.style.display = 'none';
      milestoneLineEl.style.display = 'none';
      return;
    }

    const h = state.answers.birthHour === '' ? 0 : Number(state.answers.birthHour);
    const min = state.answers.birthMinute === '' ? 0 : Number(state.answers.birthMinute);
    if (Number.isNaN(h) || h < 0 || h > 23 || Number.isNaN(min) || min < 0 || min > 59) {
      timerLineEl.style.display = 'none';
      milestoneLineEl.style.display = 'none';
      return;
    }

    timerLineEl.style.display = 'block';
    milestoneLineEl.style.display = 'block';

    const birthDateTime = new Date(check.y, check.m - 1, check.d, h, min, 0);

    function tick() {
      const now = new Date();
      const diffSec = Math.max(0, Math.floor((now - birthDateTime) / 1000));
      const totalHours = Math.floor(diffSec / 3600);
      const remMin = Math.floor((diffSec % 3600) / 60);
      const remSec = diffSec % 60;
      const pad = (n) => String(n).padStart(2, '0');

      timerLineEl.textContent = `${totalHours.toLocaleString()}시간 ${pad(remMin)}분 ${pad(remSec)}초 인생 사는 중`;

      const ms = getNextMilestoneCountdown(check.y, check.m, check.d, h, min, manAge);
      milestoneLineEl.textContent = ms ? ms.text : '';
    }

    tick();
    lifeTimerInterval = setInterval(tick, 1000);
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

  chkUnknownEl.addEventListener('change', () => {
    state.answers.unknownTime = chkUnknownEl.checked;
    timeWrapEl.style.display = state.answers.unknownTime ? 'none' : 'grid';
    updateLifeCounter();
  });

  regionEl.addEventListener('change', () => {
    state.answers.region = regionEl.value;
  });

  [yearEl, monthEl, dayEl, hourEl, minEl].forEach((input) => {
    input.addEventListener('input', () => {
      errorEl.textContent = '';
      updateLifeCounter();
    });
  });

  updateLifeCounter();

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
    if (!state.answers.unknownTime) {
      const hStr = hourEl.value.trim();
      const mStr = minEl.value.trim();
      if (hStr !== '' && (Number(hStr) < 0 || Number(hStr) > 23)) {
        errorEl.textContent = '출생 시는 0~23 사이로 입력해 주세요.';
        return;
      }
      if (mStr !== '' && (Number(mStr) < 0 || Number(mStr) > 59)) {
        errorEl.textContent = '출생 분은 0~59 사이로 입력해 주세요.';
        return;
      }
    }
    goNextStep();
  });
  bindBackButtons();
}

// 2. 신체 조건 (BMI 바 미리 표시 + 입력 시 화살표 이동)
function getBmiCategory(bmi) {
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상';
  if (bmi < 25) return '과체중';
  return '비만';
}

function getBmiBarPercent(bmi) {
  let pct = 0;
  if (bmi < 23) {
    const ratio = Math.max(0, Math.min(1, (bmi - 15) / (23 - 15)));
    pct = ratio * 40;
  } else if (bmi < 25) {
    const ratio = (bmi - 23) / (25 - 23);
    pct = 40 + ratio * 25;
  } else {
    const ratio = Math.max(0, Math.min(1, (bmi - 25) / (35 - 25)));
    pct = 65 + ratio * 35;
  }
  return Math.max(4, Math.min(96, pct));
}

function renderBodyStep(q) {
  const { heightCm, weightKg } = state.answers;
  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div class="body-grid">
        <div>
          <span class="field-label">키</span>
          <div class="salary-input-wrap">
            <input id="input-height" class="salary-input" type="number" inputmode="decimal" placeholder="000" value="${heightCm}" />
            <span class="salary-unit">cm</span>
          </div>
        </div>
        <div>
          <span class="field-label">몸무게</span>
          <div class="salary-input-wrap">
            <input id="input-weight" class="salary-input" type="number" inputmode="decimal" placeholder="00" value="${weightKg}" />
            <span class="salary-unit">kg</span>
          </div>
        </div>
      </div>

      <div id="body-preview" class="bmi-gauge-wrap">
        <div id="bmi-summary" class="bmi-summary">키와 몸무게를 입력하면 내 BMI 위치가 표시됩니다</div>
        <div class="bmi-pointer-track">
          <div id="bmi-pointer" class="bmi-pointer" style="left: 20%; opacity: 0;">
            <span id="bmi-pointer-tag" class="bmi-pointer-tag">-</span>
            <span class="bmi-pointer-arrow"></span>
          </div>
        </div>
        <div class="bmi-bar">
          <div class="bmi-seg-normal"></div>
          <div class="bmi-seg-over"></div>
          <div class="bmi-seg-obese"></div>
        </div>
        <div class="bmi-labels">
          <span>정상</span>
          <span>과체중</span>
          <span>비만</span>
        </div>
      </div>
      <div id="body-error" class="error-msg"></div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-body-next" class="btn-primary">다음 문항으로</button>
      </div>
    </div>
  `;

  const heightEl = document.getElementById('input-height');
  const weightEl = document.getElementById('input-weight');
  const summaryEl = document.getElementById('bmi-summary');
  const pointerEl = document.getElementById('bmi-pointer');
  const pointerTagEl = document.getElementById('bmi-pointer-tag');
  const errorEl = document.getElementById('body-error');

  function updateBodyPreview() {
    state.answers.heightCm = heightEl.value.trim();
    state.answers.weightKg = weightEl.value.trim();
    const h = Number(state.answers.heightCm);
    const w = Number(state.answers.weightKg);
    if (h >= 120 && h <= 230 && w >= 30 && w <= 220) {
      const bmi = w / ((h / 100) * (h / 100));
      const pct = getBmiBarPercent(bmi);
      summaryEl.textContent = `${h}cm · ${w}kg · BMI ${bmi.toFixed(1)} (${getBmiCategory(bmi)})`;
      pointerEl.style.opacity = '1';
      pointerEl.style.left = `${pct}%`;
      pointerTagEl.textContent = bmi.toFixed(1);
      errorEl.textContent = '';
    } else {
      summaryEl.textContent = '키와 몸무게를 입력하면 내 BMI 위치가 표시됩니다';
      pointerEl.style.opacity = '0';
    }
  }

  [heightEl, weightEl].forEach((input) => input.addEventListener('input', updateBodyPreview));
  updateBodyPreview();

  document.getElementById('btn-body-next').addEventListener('click', () => {
    const h = Number(heightEl.value.trim());
    const w = Number(weightEl.value.trim());
    if (!heightEl.value.trim() || Number.isNaN(h) || h < 120 || h > 230) {
      errorEl.textContent = '키는 120~230cm 사이로 입력해 주세요.';
      return;
    }
    if (!weightEl.value.trim() || Number.isNaN(w) || w < 30 || w > 220) {
      errorEl.textContent = '몸무게는 30~220kg 사이로 입력해 주세요.';
      return;
    }
    goNextStep();
  });
  bindBackButtons();
}

// 3. 학력 (최종학력 한 줄씩 + 수도권/지방 구분)
function renderEducationStep(q) {
  const { educationDegree, educationTier } = state.answers;
  const selectedDegreeObj = educationDegree !== null ? q.degreeOptions[educationDegree] : null;
  const showTier = Boolean(selectedDegreeObj && selectedDegreeObj.needsTier);
  const canProceed = educationDegree !== null && (!showTier || educationTier !== null);

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">최종 학력</span>
        <div class="options-list">
          ${q.degreeOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${educationDegree === idx ? 'selected' : ''}" data-deg-idx="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${educationDegree === idx ? '✓' : ''}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div id="univ-tier-wrap" style="display: ${showTier ? 'block' : 'none'};">
        <span class="field-label">출신 대학 구분 (학부 기준)</span>
        <div class="options-list">
          ${q.tierOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${educationTier === idx ? 'selected' : ''}" data-tier-idx="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${educationTier === idx ? '✓' : ''}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div id="edu-error" class="error-msg"></div>
      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-edu-next" class="btn-primary" ${canProceed ? '' : 'disabled'}>다음 문항으로</button>
      </div>
    </div>
  `;

  quizBody.querySelectorAll('[data-deg-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.degIdx);
      state.answers.educationDegree = idx;
      if (!q.degreeOptions[idx].needsTier) {
        state.answers.educationTier = null;
      }
      renderEducationStep(q);
    });
  });

  quizBody.querySelectorAll('[data-tier-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.educationTier = Number(btn.dataset.tierIdx);
      renderEducationStep(q);
    });
  });

  document.getElementById('btn-edu-next').addEventListener('click', () => {
    if (state.answers.educationDegree === null) {
      document.getElementById('edu-error').textContent = '최종 학력을 선택해 주세요.';
      return;
    }
    const deg = q.degreeOptions[state.answers.educationDegree];
    if (deg.needsTier && state.answers.educationTier === null) {
      document.getElementById('edu-error').textContent = '출신 대학 구분을 선택해 주세요.';
      return;
    }
    goNextStep();
  });
  bindBackButtons();
}

// 4. 직업 · 소득 (순 계약 연봉 + 인센티브 + 세전/세후 좌우 합계)
function formatManwonKorean(manwon) {
  const sign = manwon < 0 ? '-' : '';
  const abs = Math.abs(Math.round(manwon));
  if (abs === 0) return '0원';
  const eok = Math.floor(abs / 10000);
  const rest = abs % 10000;
  if (eok > 0 && rest > 0) return `${sign}${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${sign}${eok}억원`;
  return `${sign}${abs.toLocaleString()}만원`;
}

function estimateAfterTaxManwon(grossManwon) {
  if (grossManwon <= 0) return 0;
  let rate = 0.08;
  if (grossManwon <= 3000) rate = 0.1;
  else if (grossManwon <= 5000) rate = 0.14;
  else if (grossManwon <= 8000) rate = 0.19;
  else if (grossManwon <= 12000) rate = 0.24;
  else if (grossManwon <= 20000) rate = 0.3;
  else rate = 0.35;
  return Math.round(grossManwon * (1 - rate));
}

function renderJobStep(q) {
  const { employmentType, salaryManwon, incentiveManwon } = state.answers;
  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">고용 형태</span>
        <div class="employment-grid">
          ${q.employmentOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${employmentType === idx ? 'selected' : ''}" data-emp-idx="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${employmentType === idx ? '✓' : ''}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div>
        <span class="field-label">세전 순 계약 연봉</span>
        <div class="salary-input-wrap">
          <input id="input-salary" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="0000" value="${salaryManwon}" />
          <span class="salary-unit">만원</span>
        </div>
        <p class="field-memo">※ 성과금·인센티브·각종 수당 등을 제외한 <strong>순 계약 연봉(기본급)</strong>만 입력해 주세요. (소득 없으면 0)</p>
      </div>

      <div>
        <span class="field-label">예상 인센티브 · 성과금 (연간)</span>
        <div class="salary-input-wrap">
          <input id="input-incentive" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="000" value="${incentiveManwon}" />
          <span class="salary-unit">만원</span>
        </div>
      </div>

      <div id="salary-compare-box" class="salary-compare-box" style="display:none;">
        <div class="salary-compare-item">
          <span class="salary-compare-label">세전 총합 (연봉+인센)</span>
          <span id="gross-total-val" class="salary-compare-val">0원</span>
        </div>
        <div class="salary-compare-item">
          <span class="salary-compare-label">예상 세후 실수령</span>
          <span id="net-total-val" class="salary-compare-val">0원</span>
        </div>
      </div>

      <div id="job-error" class="error-msg"></div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-job-next" class="btn-primary">다음 문항으로</button>
      </div>
    </div>
  `;

  const salaryEl = document.getElementById('input-salary');
  const incEl = document.getElementById('input-incentive');
  const compareBox = document.getElementById('salary-compare-box');
  const grossEl = document.getElementById('gross-total-val');
  const netEl = document.getElementById('net-total-val');
  const errorEl = document.getElementById('job-error');

  function updateSalaryPreview() {
    const rawS = salaryEl.value.trim();
    const rawI = incEl.value.trim();
    state.answers.salaryManwon = rawS;
    state.answers.incentiveManwon = rawI;

    if (rawS === '' && rawI === '') {
      compareBox.style.display = 'none';
      return;
    }
    const s = Math.max(0, Math.floor(Number(rawS) || 0));
    const inc = Math.max(0, Math.floor(Number(rawI) || 0));
    const totalGross = s + inc;
    const totalNet = estimateAfterTaxManwon(totalGross);

    compareBox.style.display = 'grid';
    grossEl.textContent = formatManwonKorean(totalGross);
    netEl.textContent = formatManwonKorean(totalNet);
    errorEl.textContent = '';
  }

  quizBody.querySelectorAll('[data-emp-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.empIdx);
      state.answers.employmentType = idx;
      quizBody.querySelectorAll('[data-emp-idx]').forEach((b) => {
        const active = Number(b.dataset.empIdx) === idx;
        b.classList.toggle('selected', active);
        b.querySelector('.option-check').textContent = active ? '✓' : '';
      });
      if (q.employmentOptions[idx].zeroSalaryDefault) {
        if (salaryEl.value.trim() === '') salaryEl.value = '0';
        if (incEl.value.trim() === '') incEl.value = '0';
        updateSalaryPreview();
      }
      errorEl.textContent = '';
    });
  });

  [salaryEl, incEl].forEach((el) => el.addEventListener('input', updateSalaryPreview));
  updateSalaryPreview();

  document.getElementById('btn-job-next').addEventListener('click', () => {
    if (state.answers.employmentType === null) {
      errorEl.textContent = '고용 형태를 선택해 주세요.';
      return;
    }
    const rawS = salaryEl.value.trim();
    const numS = Number(rawS);
    if (rawS === '' || Number.isNaN(numS) || numS < 0) {
      errorEl.textContent = '순 계약 연봉을 만원 단위 숫자로 입력해 주세요. (0 이상)';
      return;
    }
    goNextStep();
  });
  bindBackButtons();
}

// 5. 자산 - 부동산
function renderHousingStep(q) {
  const { housingType, housingCostManwon } = state.answers;
  const selectedOpt = housingType !== null ? q.options[housingType] : null;

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">거주 형태</span>
        <div class="employment-grid">
          ${q.options
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${housingType === idx ? 'selected' : ''}" data-house-idx="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${housingType === idx ? '✓' : ''}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div id="housing-cost-wrap" style="display: ${selectedOpt ? 'block' : 'none'};">
        <span class="field-label" id="housing-cost-label">${selectedOpt ? selectedOpt.costLabel : '월 주거 비용 (만원)'}</span>
        <div class="salary-input-wrap">
          <input id="input-housing-cost" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="00" value="${housingCostManwon}" />
          <span class="salary-unit">만원</span>
        </div>
      </div>

      <div id="housing-error" class="error-msg"></div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-housing-next" class="btn-primary" ${housingType === null ? 'disabled' : ''}>다음 문항으로</button>
      </div>
    </div>
  `;

  const costEl = document.getElementById('input-housing-cost');
  const errorEl = document.getElementById('housing-error');

  quizBody.querySelectorAll('[data-house-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.housingType = Number(btn.dataset.houseIdx);
      renderHousingStep(q);
    });
  });

  if (costEl) {
    costEl.addEventListener('input', () => {
      state.answers.housingCostManwon = costEl.value.trim();
      errorEl.textContent = '';
    });
  }

  document.getElementById('btn-housing-next').addEventListener('click', () => {
    if (state.answers.housingType === null) {
      errorEl.textContent = '주거 형태를 선택해 주세요.';
      return;
    }
    const raw = costEl.value.trim();
    if (raw === '' || Number.isNaN(Number(raw)) || Number(raw) < 0) {
      errorEl.textContent = '매월 나가는 비용을 숫자로 입력해 주세요. (없으면 0 입력)';
      return;
    }
    state.answers.housingCostManwon = raw;
    goNextStep();
  });
  bindBackButtons();
}

// 6. 자산 - 저축
function renderSavingsStep(q) {
  const { cashManwon, pensionManwon, investManwon, debtManwon } = state.answers;
  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div class="savings-grid">
        <div>
          <span class="field-label">현금 · 예적금</span>
          <div class="salary-input-wrap">
            <input id="input-cash" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="0000" value="${cashManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
        <div>
          <span class="field-label">연금 · 퇴직연금</span>
          <div class="salary-input-wrap">
            <input id="input-pension" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="0000" value="${pensionManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
        <div>
          <span class="field-label">주식 · 코인</span>
          <div class="salary-input-wrap">
            <input id="input-invest" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="000" value="${investManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
        <div>
          <span class="field-label">대출 (부동산 외)</span>
          <div class="salary-input-wrap">
            <input id="input-debt" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="0" value="${debtManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
      </div>

      <div id="savings-preview" class="age-preview">순 금융자산: 0원</div>
      <div id="savings-error" class="error-msg"></div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-savings-next" class="btn-primary">다음 문항으로</button>
      </div>
    </div>
  `;

  const cashEl = document.getElementById('input-cash');
  const pensionEl = document.getElementById('input-pension');
  const investEl = document.getElementById('input-invest');
  const debtEl = document.getElementById('input-debt');
  const previewEl = document.getElementById('savings-preview');

  function updateSavingsPreview() {
    state.answers.cashManwon = cashEl.value.trim();
    state.answers.pensionManwon = pensionEl.value.trim();
    state.answers.investManwon = investEl.value.trim();
    state.answers.debtManwon = debtEl.value.trim();

    const net =
      (Number(state.answers.cashManwon) || 0) +
      (Number(state.answers.pensionManwon) || 0) +
      (Number(state.answers.investManwon) || 0) -
      (Number(state.answers.debtManwon) || 0);
    previewEl.textContent = `순 금융자산: ${formatManwonKorean(net)}`;
  }

  [cashEl, pensionEl, investEl, debtEl].forEach((el) => el.addEventListener('input', updateSavingsPreview));
  updateSavingsPreview();

  document.getElementById('btn-savings-next').addEventListener('click', () => {
    goNextStep();
  });
  bindBackButtons();
}

// 8. 자기관리 - 운동
function renderSelfcareStep(q) {
  const { exerciseFreq, exerciseDuration, exerciseYears } = state.answers;
  const canProceed = exerciseFreq !== null && exerciseDuration !== null && exerciseYears !== null;

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div class="sub-group">
        <span class="field-label">주 운동 횟수</span>
        <div class="employment-grid">
          ${q.freqOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${exerciseFreq === idx ? 'selected' : ''}" data-freq-idx="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${exerciseFreq === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div class="sub-group">
        <span class="field-label">1회 운동 시간</span>
        <div class="employment-grid">
          ${q.durationOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${exerciseDuration === idx ? 'selected' : ''}" data-dur-idx="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${exerciseDuration === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div class="sub-group">
        <span class="field-label">꾸준히 한 운동 기간</span>
        <div class="employment-grid">
          ${q.yearsOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${exerciseYears === idx ? 'selected' : ''}" data-yrs-idx="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${exerciseYears === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-selfcare-next" class="btn-primary" ${canProceed ? '' : 'disabled'}>다음 문항으로</button>
      </div>
    </div>
  `;

  quizBody.querySelectorAll('[data-freq-idx]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.exerciseFreq = Number(b.dataset.freqIdx);
      renderSelfcareStep(q);
    })
  );
  quizBody.querySelectorAll('[data-dur-idx]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.exerciseDuration = Number(b.dataset.durIdx);
      renderSelfcareStep(q);
    })
  );
  quizBody.querySelectorAll('[data-yrs-idx]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.exerciseYears = Number(b.dataset.yrsIdx);
      renderSelfcareStep(q);
    })
  );

  document.getElementById('btn-selfcare-next').addEventListener('click', () => {
    if (canProceed) goNextStep();
  });
  bindBackButtons();
}

// 9. 자기관리 - 생활습관 (흡연, 음주, 종교, 식단 성향)
function renderLifestyleStep(q) {
  const { smoking, drinking, religion, diet } = state.answers;
  const canProceed = smoking !== null && drinking !== null && religion !== null && diet !== null;

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">흡연 유무</span>
        <div class="options-list">
          ${q.smokingOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${smoking === idx ? 'selected' : ''}" data-smk="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${smoking === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div>
        <span class="field-label">음주 주 횟수</span>
        <div class="employment-grid">
          ${q.drinkingOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${drinking === idx ? 'selected' : ''}" data-drk="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${drinking === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div>
        <span class="field-label">종교 유무</span>
        <div class="options-list">
          ${q.religionOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${religion === idx ? 'selected' : ''}" data-rel="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${religion === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div>
        <span class="field-label">식단 성향 · 식습관</span>
        <div class="options-list">
          ${q.dietOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${diet === idx ? 'selected' : ''}" data-diet="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${diet === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-life-next" class="btn-primary" ${canProceed ? '' : 'disabled'}>다음 문항으로</button>
      </div>
    </div>
  `;

  quizBody.querySelectorAll('[data-smk]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.smoking = Number(b.dataset.smk);
      renderLifestyleStep(q);
    })
  );
  quizBody.querySelectorAll('[data-drk]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.drinking = Number(b.dataset.drk);
      renderLifestyleStep(q);
    })
  );
  quizBody.querySelectorAll('[data-rel]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.religion = Number(b.dataset.rel);
      renderLifestyleStep(q);
    })
  );
  quizBody.querySelectorAll('[data-diet]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.diet = Number(b.dataset.diet);
      renderLifestyleStep(q);
    })
  );

  document.getElementById('btn-life-next').addEventListener('click', () => {
    if (canProceed) goNextStep();
  });
  bindBackButtons();
}

// 10. 연애 이력
function renderDatingStep(q) {
  const { datingCount, datingLongest } = state.answers;
  const canProceed = datingCount !== null && datingLongest !== null;

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">연애 횟수</span>
        <div class="employment-grid">
          ${q.countOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${datingCount === idx ? 'selected' : ''}" data-dc="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${datingCount === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div>
        <span class="field-label">연애 최장기간</span>
        <div class="options-list">
          ${q.longestOptions
            .map(
              (opt, idx) => `
            <button type="button" class="option-btn ${datingLongest === idx ? 'selected' : ''}" data-dl="${idx}">
              <span>${opt.label}</span>
              <span class="option-check">${datingLongest === idx ? '✓' : ''}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-dating-next" class="btn-primary" ${canProceed ? '' : 'disabled'}>다음 문항으로</button>
      </div>
    </div>
  `;

  quizBody.querySelectorAll('[data-dc]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.datingCount = Number(b.dataset.dc);
      renderDatingStep(q);
    })
  );
  quizBody.querySelectorAll('[data-dl]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.datingLongest = Number(b.dataset.dl);
      renderDatingStep(q);
    })
  );

  document.getElementById('btn-dating-next').addEventListener('click', () => {
    if (canProceed) goNextStep();
  });
  bindBackButtons();
}

function goNextStep() {
  clearLifeTimer();
  if (state.currentStep < QUESTIONS.length - 1) {
    state.currentStep += 1;
    showScreen('quiz');
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
    '자산·소득과 피지컬 지표를 분석하고 있습니다...',
    '자기관리와 생활 허들, 연애 성향을 대조 중입니다...',
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
function getQuestionById(id) {
  return QUESTIONS.find((q) => q.id === id);
}

function evaluateResult() {
  const a = state.answers;
  const { manAge, yearAge } = calculateAges(Number(a.birthYear), Number(a.birthMonth), Number(a.birthDay));
  const zodiac = getZodiacInfo(Number(a.birthYear));

  // 1) 피지컬
  const h = Number(a.heightCm);
  const w = Number(a.weightKg);
  const bmi = w / ((h / 100) * (h / 100));

  let heightSpec = 4;
  if (a.gender === 'male') {
    if (h >= 178) heightSpec = 8;
    else if (h >= 174) heightSpec = 6;
    else if (h >= 170) heightSpec = 4;
    else heightSpec = 1;
  } else {
    if (h >= 160 && h <= 168) heightSpec = 8;
    else if ((h >= 155 && h < 160) || (h > 168 && h <= 173)) heightSpec = 6;
    else heightSpec = 4;
  }

  let bmiSpec = 2;
  if (bmi >= 18.5 && bmi <= 23.0) bmiSpec = 6;
  else if ((bmi > 23.0 && bmi < 25.0) || (bmi >= 17.5 && bmi < 18.5)) bmiSpec = 4;
  else if (bmi >= 28.0) bmiSpec = 0;

  // 2) 학력
  const eduQ = getQuestionById('education');
  const degOpt = eduQ.degreeOptions[a.educationDegree];
  const tierOpt = degOpt.needsTier && a.educationTier !== null ? eduQ.tierOptions[a.educationTier] : { spec: 0 };
  const eduSpec = degOpt.spec + tierOpt.spec;

  // 3) 직업 · 총소득
  const empOpt = getQuestionById('job').employmentOptions[a.employmentType];
  const grossSalary = (Number(a.salaryManwon) || 0) + (Number(a.incentiveManwon) || 0);
  let salarySpec = 2;
  if (grossSalary >= 12000) salarySpec = 20;
  else if (grossSalary >= 8500) salarySpec = 16;
  else if (grossSalary >= 6000) salarySpec = 13;
  else if (grossSalary >= 4000) salarySpec = 9;
  else if (grossSalary >= 2500) salarySpec = 5;

  // 4) 자산 (부동산 + 월 주거비 보정 + 순금융자산 + 차량)
  const houseOpt = getQuestionById('housing').options[a.housingType];
  const houseCost = Number(a.housingCostManwon) || 0;
  const costPenalty = houseCost >= 150 ? 4 : houseCost >= 80 ? 2 : 0;

  const netFinancial =
    (Number(a.cashManwon) || 0) +
    (Number(a.pensionManwon) || 0) +
    (Number(a.investManwon) || 0) -
    (Number(a.debtManwon) || 0);
  let savingsSpec = 2;
  if (netFinancial >= 30000) savingsSpec = 18;
  else if (netFinancial >= 15000) savingsSpec = 14;
  else if (netFinancial >= 7000) savingsSpec = 10;
  else if (netFinancial >= 2000) savingsSpec = 6;
  else if (netFinancial < 0) savingsSpec = 0;

  const carOpt = getQuestionById('car').options[a.car];

  // 5) 연령 가중치
  let ageScore = 10;
  if (a.gender === 'female') {
    if (manAge <= 29) ageScore = 14;
    else if (manAge <= 33) ageScore = 11;
    else if (manAge <= 37) ageScore = 7;
    else ageScore = 4;
  } else {
    if (manAge >= 27 && manAge <= 34) ageScore = 14;
    else if (manAge <= 26 || manAge <= 38) ageScore = 10;
    else ageScore = 5;
  }

  // 지표 1: 자산 · 스펙 (100점 환산, max ~119)
  const rawAssetSpec =
    heightSpec + bmiSpec + eduSpec + empOpt.spec + salarySpec + (houseOpt.spec - costPenalty) + savingsSpec + carOpt.spec + ageScore;
  const assetSpecPercent = Math.max(10, Math.min(100, Math.round((rawAssetSpec / 119) * 100)));

  // 지표 2: 자기관리 · 생활 (운동 + 생활습관 허들)
  const selfQ = getQuestionById('selfcare');
  const exScore =
    selfQ.freqOptions[a.exerciseFreq].score +
    selfQ.durationOptions[a.exerciseDuration].score +
    selfQ.yearsOptions[a.exerciseYears].score; // max 35

  const lifeQ = getQuestionById('lifestyle');
  const smkOpt = lifeQ.smokingOptions[a.smoking];
  const drkOpt = lifeQ.drinkingOptions[a.drinking];
  const relOpt = lifeQ.religionOptions[a.religion];
  const dietOpt = lifeQ.dietOptions[a.diet];
  const hurdlePenalty = smkOpt.penalty + drkOpt.penalty + relOpt.penalty + dietOpt.penalty;
  const hurdleTags = [smkOpt.tag, drkOpt.tag, relOpt.tag, dietOpt.tag].filter(Boolean);

  const selfcarePercent = Math.max(10, Math.min(100, Math.round(((exScore + 25 - hurdlePenalty * 1.4) / 60) * 100)));

  // 지표 3: 연애 내공 · 성향 (연애 횟수/최장기간 + 소비관 + 소통)
  const datQ = getQuestionById('dating');
  const datingExpScore = datQ.countOptions[a.datingCount].score + datQ.longestOptions[a.datingLongest].score; // max 25
  const spendOpt = getQuestionById('spending').options[a.spending];
  const commOpt = getQuestionById('communication').options[a.communication];
  const rawLove = datingExpScore + spendOpt.love + commOpt.love; // max 59
  const lovePercent = Math.max(10, Math.min(100, Math.round((rawLove / 59) * 100)));

  // 지표 4: 메타인지 (눈높이 균형)
  const stdOpt = getQuestionById('standard').options[a.standard];
  let eyePenalty = 0;
  if (assetSpecPercent < 55 && stdOpt.demandLevel >= 3) eyePenalty = 14;
  else if (assetSpecPercent < 75 && stdOpt.demandLevel === 4) eyePenalty = 12;
  else if (stdOpt.demandLevel === 4 && hurdlePenalty >= 8) eyePenalty = 10;

  const metaPercent = Math.max(15, Math.min(100, 75 + stdOpt.metaBonus - eyePenalty * 2));

  // 총점
  const totalScore = Math.max(
    15,
    Math.min(
      98,
      Math.round(assetSpecPercent * 0.45 + selfcarePercent * 0.22 + lovePercent * 0.23 + metaPercent * 0.1 - hurdlePenalty * 0.4)
    )
  );

  let actualTier = 'D';
  for (const t of TIER_ORDER) {
    if (totalScore >= TIER_PROFILES[t].minScore) {
      actualTier = t;
      break;
    }
  }

  return {
    genderLabel: a.gender === 'male' ? '👨 남성' : '👩 여성',
    manAge,
    yearAge,
    zodiac,
    region: a.region,
    actualTier,
    totalScore,
    hurdleTags,
    eyePenalty,
    metrics: [
      { label: '자산 · 스펙 (부동산·저축·소득·피지컬)', score: assetSpecPercent },
      { label: '자기관리 · 생활 (운동·생활습관)', score: selfcarePercent },
      { label: '연애 내공 · 성향 (경험·소비·소통)', score: lovePercent },
      { label: '메타인지 (눈높이 균형)', score: metaPercent }
    ]
  };
}

let lastResult = null;

function renderResult(res) {
  lastResult = res;
  const profile = TIER_PROFILES[res.actualTier];

  document.getElementById('result-profile-badge').textContent = `${res.zodiac.emoji} 만 ${res.manAge}세(연 ${res.yearAge}) · ${res.genderLabel} · ${res.region}`;
  document.getElementById('result-doc-id').textContent = `SCORE ${res.totalScore} / 100`;

  const actualBox = document.getElementById('res-actual-box');
  actualBox.className = `tier-result-hero tier-${res.actualTier}`;
  document.getElementById('res-actual-tier').textContent = res.actualTier;
  document.getElementById('res-tier-label').textContent = profile.label;

  document.getElementById('res-headline').textContent = profile.headline;

  let extraComment = profile.comment;
  if (res.hurdleTags.length > 0) {
    extraComment += ` 특히 [${res.hurdleTags.join(', ')}] 요소가 매칭 풀을 좁히는 요인으로 작용했습니다.`;
  }
  if (res.eyePenalty > 0) {
    extraComment += ' 본인 조건 대비 희망 기준이 높게 설정되어 감점이 발생했습니다.';
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

// 결과 카드 PNG 저장
document.getElementById('btn-save-img').addEventListener('click', () => {
  if (!lastResult) return;
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f4f5f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 40, 40, 640, 820, 28);
  ctx.fill();

  ctx.fillStyle = '#1c2434';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('연애등급측정기 · 결정사 모의 판정', 80, 105);

  ctx.fillStyle = '#5f6673';
  ctx.font = '600 17px sans-serif';
  ctx.fillText(
    `${lastResult.zodiac.emoji} 만 ${lastResult.manAge}세 · ${lastResult.genderLabel} · ${lastResult.region} (총점 ${lastResult.totalScore}점)`,
    80,
    140
  );

  const tierColors = { S: '#7c3aed', A: '#2563eb', B: '#059669', C: '#d97706', D: '#dc2626' };
  ctx.fillStyle = tierColors[lastResult.actualTier];
  roundRect(ctx, 80, 175, 560, 165, 22);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('결정사 모의 판정 등급', 360, 215);
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText(lastResult.actualTier, 360, 288);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(TIER_PROFILES[lastResult.actualTier].label, 360, 322);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 22px sans-serif';
  const headline = TIER_PROFILES[lastResult.actualTier].headline;
  wrapText(ctx, headline, 80, 390, 560, 32);

  let y = 490;
  lastResult.metrics.forEach((m) => {
    ctx.fillStyle = '#181c23';
    ctx.font = '600 17px sans-serif';
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
  const text = `[연애등급측정기]\n판정 결과: ${lastResult.actualTier}등급 · ${TIER_PROFILES[lastResult.actualTier].label} (${lastResult.totalScore}점)\n${TIER_PROFILES[lastResult.actualTier].headline}\n${window.location.href}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast('결과가 클립보드에 복사되었습니다!');
  } catch {
    showToast('복사에 실패했습니다. 브라우저 권한을 확인해 주세요.');
  }
});

// 결과 화면에서 뒤로가서 수정
document.getElementById('btn-result-back').addEventListener('click', () => {
  state.currentStep = QUESTIONS.length - 1;
  showScreen('quiz');
  renderQuestion();
});

// 다시 하기
document.getElementById('btn-retry').addEventListener('click', () => {
  clearLifeTimer();
  state.currentStep = 0;
  state.answers = {
    gender: null,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    birthMinute: '',
    unknownTime: false,
    region: '서울',
    heightCm: '',
    weightKg: '',
    educationDegree: null,
    educationTier: null,
    employmentType: null,
    salaryManwon: '',
    incentiveManwon: '',
    housingType: null,
    housingCostManwon: '',
    cashManwon: '',
    pensionManwon: '',
    investManwon: '',
    debtManwon: '',
    car: null,
    exerciseFreq: null,
    exerciseDuration: null,
    exerciseYears: null,
    smoking: null,
    drinking: null,
    religion: null,
    diet: null,
    datingCount: null,
    datingLongest: null,
    spending: null,
    communication: null,
    standard: null
  };
  showScreen('intro');
});

// 연애등급측정기 앱 상태 및 판정 엔진

const STORAGE_KEY = 'love_tier_meter_v1';

function pickRandomNickname() {
  return RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
}

function createDefaultAnswers() {
  return {
    userName: '',
    isNamePrivate: false,
    randomNickname: pickRandomNickname(),
    gender: null,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthAmPm: 'AM',
    birthHour: '',
    birthMinute: '',
    unknownTime: false,
    bloodType: null,
    mbti: { ei: null, sn: null, tf: null, jp: null },
    regionSido: '서울특별시',
    regionGungu: '강남구',
    workSido: '서울특별시',
    workGungu: '강남구',
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
    isaManwon: '',
    pensionManwon: '',
    investManwon: '',
    debtManwon: '',
    car: null,
    exerciseFreq: null,
    exerciseDuration: null,
    exerciseYears: null,
    smoking: null,
    drinking: null,
    diet: null,
    religion: null,
    datingCount: null,
    datingLongest: null,
    standard: null
  };
}

const state = {
  currentScreen: 'intro',
  currentStep: 0,
  answers: createDefaultAnswers()
};

let lastResult = null;

function saveAppState() {
  try {
    const payload = {
      screen: state.currentScreen,
      currentStep: state.currentStep,
      answers: state.answers,
      lastResult
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 저장 공간 제한 시 무시
  }
}

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

function clearRegionMap() {}

function getRegionDisplay(a = state.answers) {
  const sido = a.regionSido || '서울특별시';
  const gungu = a.regionGungu || '';
  return gungu ? `${sido} ${gungu}` : sido;
}

function getWorkRegionDisplay(a = state.answers) {
  const sido = a.workSido || '서울특별시';
  const gungu = a.workGungu || '';
  return gungu ? `${sido} ${gungu}` : sido;
}

function getDisplayName() {
  if (state.answers.isNamePrivate) return state.answers.randomNickname;
  const trimmed = state.answers.userName.trim();
  return trimmed || state.answers.randomNickname;
}

function getGreetingHtml(q) {
  if (q.id === 'profile') return '';
  return `<p class="q-greeting">“${getDisplayName()}”님의 ${q.stepTitle}에 대해 물어보려고 해요</p>`;
}

function showScreen(name, pushHistory = true) {
  if (name !== 'quiz') {
    clearLifeTimer();
    clearRegionMap();
  }
  state.currentScreen = name;
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  saveAppState();

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
  clearRegionMap();
  const q = QUESTIONS[state.currentStep];
  const total = QUESTIONS.length;
  const percent = Math.round(((state.currentStep + 1) / total) * 100);
  progressText.textContent = `${state.currentStep + 1} / ${total} (${percent}%)`;
  progressFill.style.width = `${percent}%`;
  saveAppState();

  if (q.type === 'profile') return renderProfileStep(q);
  if (q.type === 'personality') return renderPersonalityStep(q);
  if (q.type === 'region') return renderRegionStep(q);
  if (q.type === 'body') return renderBodyStep(q);
  if (q.type === 'education') return renderEducationStep(q);
  if (q.type === 'job') return renderJobStep(q);
  if (q.type === 'housing') return renderHousingStep(q);
  if (q.type === 'savings') return renderSavingsStep(q);
  if (q.type === 'selfcare') return renderSelfcareStep(q);
  if (q.type === 'smoking') return renderSmokingStep(q);
  if (q.type === 'dating') return renderDatingStep(q);

  if (q.type === 'single') {
    const selectedIdx = state.answers[q.id];
    const nextLabel = state.currentStep === total - 1 ? '결과 보기' : '다음 문항으로';
    quizBody.innerHTML = `
      <span class="q-step-badge">${q.stepTitle}</span>
      ${getGreetingHtml(q)}
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
        saveAppState();
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
function to24Hour(hour12, ampm) {
  if (ampm === 'PM') return hour12 === 12 ? 12 : hour12 + 12;
  return hour12 === 12 ? 0 : hour12;
}

function getMbtiString(mbtiObj) {
  if (!mbtiObj) return '';
  const { ei, sn, tf, jp } = mbtiObj;
  if (!ei || !sn || !tf || !jp) return '';
  return `${ei}${sn}${tf}${jp}`;
}

function renderProfileStep(q) {
  const {
    userName,
    isNamePrivate,
    randomNickname,
    gender,
    birthYear,
    birthMonth,
    birthDay,
    birthAmPm,
    birthHour,
    birthMinute,
    unknownTime
  } = state.answers;

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 18;

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">이름 (닉네임)</span>
        <input id="input-name" class="select-input" type="text" maxlength="12"
          placeholder="${isNamePrivate ? `랜덤 닉네임: ${randomNickname}` : '이름 또는 닉네임을 입력해 주세요'}"
          value="${isNamePrivate ? '' : userName}" ${isNamePrivate ? 'disabled' : ''} />
        <label class="checkbox-row">
          <input type="checkbox" id="chk-private-name" ${isNamePrivate ? 'checked' : ''} />
          <span>미공개 (랜덤 닉네임: <strong>${randomNickname}</strong>)</span>
        </label>
      </div>

      <div>
        <span class="field-label">성별</span>
        <div class="gender-grid">
          <button type="button" class="option-btn gender-btn ${gender === 'male' ? 'selected' : ''}" data-gender="male">
            <span class="gender-icon">👨</span>
            <span class="gender-text">남성</span>
            <span class="option-check">${gender === 'male' ? '✓' : ''}</span>
          </button>
          <button type="button" class="option-btn gender-btn ${gender === 'female' ? 'selected' : ''}" data-gender="female">
            <span class="gender-icon">👩</span>
            <span class="gender-text">여성</span>
            <span class="option-check">${gender === 'female' ? '✓' : ''}</span>
          </button>
        </div>
      </div>

      <div>
        <span class="field-label">생년월일 및 출생 시간</span>
        <div class="birth-grid">
          <div class="birth-input-wrap">
            <input id="input-year" class="birth-input" type="text" inputmode="numeric" maxlength="4" placeholder="0000" value="${birthYear}" />
            <span class="birth-unit">년</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-month" class="birth-input" type="text" inputmode="numeric" maxlength="2" placeholder="00" value="${birthMonth}" />
            <span class="birth-unit">월</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-day" class="birth-input" type="text" inputmode="numeric" maxlength="2" placeholder="00" value="${birthDay}" />
            <span class="birth-unit">일</span>
          </div>
        </div>

        <div id="time-inputs-wrap" class="time-grid" style="display: ${unknownTime ? 'none' : 'grid'};">
          <div class="ampm-toggle">
            <button type="button" class="ampm-btn ${birthAmPm === 'AM' ? 'active' : ''}" data-ampm="AM">오전</button>
            <button type="button" class="ampm-btn ${birthAmPm === 'PM' ? 'active' : ''}" data-ampm="PM">오후</button>
          </div>
          <div class="birth-input-wrap">
            <input id="input-hour" class="birth-input" type="text" inputmode="numeric" maxlength="2" placeholder="1~12" value="${birthHour}" />
            <span class="birth-unit">시</span>
          </div>
          <div class="birth-input-wrap">
            <input id="input-minute" class="birth-input" type="text" inputmode="numeric" maxlength="2" placeholder="0~59" value="${birthMinute}" />
            <span class="birth-unit">분</span>
          </div>
        </div>

        <label class="checkbox-row">
          <input type="checkbox" id="chk-unknown-time" ${unknownTime ? 'checked' : ''} />
          <span>출생시간 모름</span>
        </label>
      </div>

      <div id="life-counter-box" class="life-counter-box" style="display:none;">
        <div id="life-age-line" class="life-age-line"></div>
        <div id="life-timer-line" class="life-timer-line"></div>
        <div id="life-milestone-line" class="life-milestone-line"></div>
      </div>

      <div id="profile-error" class="error-msg"></div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-profile-next" class="btn-primary">다음 문항으로</button>
      </div>
    </div>
  `;

  const nameEl = document.getElementById('input-name');
  const chkPrivateEl = document.getElementById('chk-private-name');
  const yearEl = document.getElementById('input-year');
  const monthEl = document.getElementById('input-month');
  const dayEl = document.getElementById('input-day');
  const hourEl = document.getElementById('input-hour');
  const minEl = document.getElementById('input-minute');
  const chkUnknownEl = document.getElementById('chk-unknown-time');
  const timeWrapEl = document.getElementById('time-inputs-wrap');
  const counterBox = document.getElementById('life-counter-box');
  const ageLineEl = document.getElementById('life-age-line');
  const timerLineEl = document.getElementById('life-timer-line');
  const milestoneLineEl = document.getElementById('life-milestone-line');
  const errorEl = document.getElementById('profile-error');

  nameEl.addEventListener('input', () => {
    state.answers.userName = nameEl.value;
    errorEl.textContent = '';
    saveAppState();
  });

  chkPrivateEl.addEventListener('change', () => {
    state.answers.isNamePrivate = chkPrivateEl.checked;
    if (chkPrivateEl.checked) {
      state.answers.randomNickname = pickRandomNickname();
    }
    saveAppState();
    renderProfileStep(q);
  });

  function sanitizeYear() {
    let v = yearEl.value.replace(/\D/g, '').slice(0, 4);
    if (v.length === 4) {
      const n = Number(v);
      if (n > maxYear) v = String(maxYear);
      else if (n < 1950) v = '1950';
    }
    yearEl.value = v;
  }

  function sanitizeMonth() {
    let v = monthEl.value.replace(/\D/g, '').slice(0, 2);
    if (v !== '') {
      if (v === '00') v = '01';
      else if (Number(v) > 12) v = '12';
    }
    monthEl.value = v;
  }

  function sanitizeDay() {
    let v = dayEl.value.replace(/\D/g, '').slice(0, 2);
    const yNum = Number(yearEl.value);
    const mNum = Number(monthEl.value);
    const maxDay = yNum >= 1950 && mNum >= 1 && mNum <= 12 ? new Date(yNum, mNum, 0).getDate() : 31;
    if (v !== '') {
      if (v === '00') v = '01';
      else if (Number(v) > maxDay) v = String(maxDay);
    }
    dayEl.value = v;
  }

  function sanitizeHour() {
    let v = hourEl.value.replace(/\D/g, '').slice(0, 2);
    if (v !== '') {
      if (v === '00') v = '01';
      else if (Number(v) > 12) v = '12';
    }
    hourEl.value = v;
  }

  function sanitizeMinute() {
    let v = minEl.value.replace(/\D/g, '').slice(0, 2);
    if (v !== '' && Number(v) > 59) {
      v = '59';
    }
    minEl.value = v;
  }

  function updateLifeCounter() {
    clearLifeTimer();
    state.answers.birthYear = yearEl.value.trim();
    state.answers.birthMonth = monthEl.value.trim();
    state.answers.birthDay = dayEl.value.trim();
    state.answers.birthHour = hourEl.value.trim();
    state.answers.birthMinute = minEl.value.trim();
    saveAppState();

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

    const hRaw = state.answers.birthHour === '' ? 12 : Number(state.answers.birthHour);
    const min = state.answers.birthMinute === '' ? 0 : Number(state.answers.birthMinute);
    if (Number.isNaN(hRaw) || hRaw < 1 || hRaw > 12 || Number.isNaN(min) || min < 0 || min > 59) {
      timerLineEl.style.display = 'none';
      milestoneLineEl.style.display = 'none';
      return;
    }

    const h24 = to24Hour(hRaw, state.answers.birthAmPm);
    timerLineEl.style.display = 'block';
    milestoneLineEl.style.display = 'block';

    const birthDateTime = new Date(check.y, check.m - 1, check.d, h24, min, 0);

    function tick() {
      const now = new Date();
      const diffSec = Math.max(0, Math.floor((now - birthDateTime) / 1000));
      const totalHours = Math.floor(diffSec / 3600);
      const remMin = Math.floor((diffSec % 3600) / 60);
      const remSec = diffSec % 60;
      const pad = (n) => String(n).padStart(2, '0');

      timerLineEl.textContent = `${totalHours.toLocaleString()}시간 ${pad(remMin)}분 ${pad(remSec)}초 인생 사는 중`;

      const ms = getNextMilestoneCountdown(check.y, check.m, check.d, h24, min, manAge);
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
      saveAppState();
    });
  });

  quizBody.querySelectorAll('[data-ampm]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.birthAmPm = btn.dataset.ampm;
      quizBody.querySelectorAll('[data-ampm]').forEach((b) => {
        b.classList.toggle('active', b.dataset.ampm === state.answers.birthAmPm);
      });
      updateLifeCounter();
    });
  });

  chkUnknownEl.addEventListener('change', () => {
    state.answers.unknownTime = chkUnknownEl.checked;
    timeWrapEl.style.display = state.answers.unknownTime ? 'none' : 'grid';
    updateLifeCounter();
  });

  yearEl.addEventListener('input', () => {
    sanitizeYear();
    sanitizeDay();
    errorEl.textContent = '';
    updateLifeCounter();
  });
  monthEl.addEventListener('input', () => {
    sanitizeMonth();
    sanitizeDay();
    errorEl.textContent = '';
    updateLifeCounter();
  });
  dayEl.addEventListener('input', () => {
    sanitizeDay();
    errorEl.textContent = '';
    updateLifeCounter();
  });
  hourEl.addEventListener('input', () => {
    sanitizeHour();
    errorEl.textContent = '';
    updateLifeCounter();
  });
  minEl.addEventListener('input', () => {
    sanitizeMinute();
    errorEl.textContent = '';
    updateLifeCounter();
  });

  updateLifeCounter();

  document.getElementById('btn-profile-next').addEventListener('click', () => {
    if (!state.answers.isNamePrivate && state.answers.userName.trim() === '') {
      errorEl.textContent = '이름을 입력하거나 "미공개 (랜덤 닉네임)"을 선택해 주세요.';
      return;
    }
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
      if (hStr !== '' && (Number(hStr) < 1 || Number(hStr) > 12)) {
        errorEl.textContent = '출생 시는 오전/오후 기준 1~12 사이로 입력해 주세요.';
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

// 1-2. 혈액형 · MBTI
function renderPersonalityStep(q) {
  const { bloodType, mbti } = state.answers;
  const mbtiStr = getMbtiString(mbti);
  const canProceed = Boolean(bloodType && mbtiStr);

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    ${getGreetingHtml(q)}
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">혈액형</span>
        <div class="blood-grid">
          ${BLOOD_TYPES.map(
            (bt) => `
            <button type="button" class="option-btn ${bloodType === bt ? 'selected' : ''}" data-blood="${bt}">
              <span>${bt}</span>
              <span class="option-check">${bloodType === bt ? '✓' : ''}</span>
            </button>`
          ).join('')}
        </div>
      </div>

      <div>
        <span class="field-label">MBTI ${mbtiStr ? `(${mbtiStr})` : ''}</span>
        <div class="mbti-axes">
          ${MBTI_AXES.map(
            (axis) => `
            <div class="mbti-row">
              ${axis.options
                .map(
                  (opt) => `
                <button type="button" class="option-btn mbti-btn ${mbti[axis.key] === opt.code ? 'selected' : ''}" data-mbti-axis="${axis.key}" data-mbti-code="${opt.code}">
                  <span>${opt.label}</span>
                  <span class="option-check">${mbti[axis.key] === opt.code ? '✓' : ''}</span>
                </button>`
                )
                .join('')}
            </div>`
          ).join('')}
        </div>
      </div>

      <div id="personality-error" class="error-msg"></div>

      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-personality-next" class="btn-primary" ${canProceed ? '' : 'disabled'}>다음 문항으로</button>
      </div>
    </div>
  `;

  quizBody.querySelectorAll('[data-blood]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.bloodType = btn.dataset.blood;
      saveAppState();
      renderPersonalityStep(q);
    });
  });

  quizBody.querySelectorAll('[data-mbti-axis]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.mbti[btn.dataset.mbtiAxis] = btn.dataset.mbtiCode;
      saveAppState();
      renderPersonalityStep(q);
    });
  });

  document.getElementById('btn-personality-next').addEventListener('click', () => {
    const errorEl = document.getElementById('personality-error');
    if (!state.answers.bloodType) {
      errorEl.textContent = '혈액형을 선택해 주세요.';
      return;
    }
    if (!getMbtiString(state.answers.mbti)) {
      errorEl.textContent = 'MBTI 4가지 성향을 모두 선택해 주세요.';
      return;
    }
    goNextStep();
  });
  bindBackButtons();
}

// 1-3. 현재 거주 지역 (시/도, 시/군/구 + 경량 SVG 지도 양방향 연동)
const SVG_SIDO_TO_REGION = {
  강원도: '강원특별자치도',
  전라북도: '전북특별자치도'
};
const REGION_SIDO_TO_SVG = {
  강원특별자치도: '강원도',
  전북특별자치도: '전라북도'
};

function isSvgDistrictMatched(svgId, selectedGungu, sido) {
  if (sido === '세종특별자치시' && selectedGungu === '세종시 전체' && svgId === '세종시') {
    return true;
  }
  return svgId === selectedGungu || svgId.startsWith(`${selectedGungu} `);
}

function resolveGunguFromSvgId(svgId, sido) {
  const districts = (KOREA_REGIONS[sido] && KOREA_REGIONS[sido].districts) || {};
  if (sido === '세종특별자치시' && svgId === '세종시') return '세종시 전체';
  if (districts[svgId]) return svgId;
  const base = svgId.split(' ')[0];
  if (districts[base]) return base;
  return null;
}

function renderRegionSelectorHtml(prefix, rawSido, rawGungu) {
  const sidoList = Object.keys(KOREA_REGIONS);
  const sido = KOREA_REGIONS[rawSido] ? rawSido : sidoList[0];
  const sidoObj = KOREA_REGIONS[sido];
  const gunguList = Object.keys(sidoObj.districts);
  const gungu = sidoObj.districts[rawGungu] ? rawGungu : gunguList[0];
  const nationalSvg = typeof KOREA_SVG_MAPS !== 'undefined' ? KOREA_SVG_MAPS['전국'] : null;

  return {
    sido,
    gungu,
    html: `
      <div class="region-select-grid">
        <div>
          <span class="field-label">시 · 도</span>
          <select id="${prefix}-select-sido" class="select-input">
            ${sidoList.map((s) => `<option value="${s}" ${sido === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <span class="field-label">시 · 군 · 구</span>
          <select id="${prefix}-select-gungu" class="select-input">
            ${gunguList.map((g) => `<option value="${g}" ${gungu === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="region-map-wrap">
        <div class="region-map-bar">
          <span id="${prefix}-map-label">📍 ${sido} ${gungu}</span>
          <span id="${prefix}-map-coords" class="region-map-coords">SVG 지도 클릭으로도 선택 가능</span>
        </div>
        <div class="region-svg-grid">
          <div class="region-svg-panel">
            <div class="region-svg-panel-head">
              <span>대한민국 시 · 도</span>
              <span id="${prefix}-sido-hover" class="region-svg-hover">${sido}</span>
            </div>
            <svg id="${prefix}-national-svg" class="region-svg-box" viewBox="${nationalSvg ? nationalSvg.viewBox : '0 0 800 759'}" stroke-linecap="round" stroke-linejoin="round">
              ${nationalSvg ? nationalSvg.paths.map((p) => `<path class="region-svg-path" data-svg-sido="${p.id}" d="${p.d}" />`).join('') : ''}
            </svg>
          </div>
          <div class="region-svg-panel">
            <div class="region-svg-panel-head">
              <span id="${prefix}-detail-title">${sido} 시 · 군 · 구</span>
              <span id="${prefix}-gungu-hover" class="region-svg-hover">${gungu}</span>
            </div>
            <div id="${prefix}-detail-container"></div>
          </div>
        </div>
      </div>
    `
  };
}

function mountRegionSelector({ prefix, sidoKey, gunguKey }) {
  const sidoEl = document.getElementById(`${prefix}-select-sido`);
  const gunguEl = document.getElementById(`${prefix}-select-gungu`);
  const labelEl = document.getElementById(`${prefix}-map-label`);
  const coordsEl = document.getElementById(`${prefix}-map-coords`);
  const nationalSvgEl = document.getElementById(`${prefix}-national-svg`);
  const detailContainerEl = document.getElementById(`${prefix}-detail-container`);
  const detailTitleEl = document.getElementById(`${prefix}-detail-title`);
  const sidoHoverEl = document.getElementById(`${prefix}-sido-hover`);
  const gunguHoverEl = document.getElementById(`${prefix}-gungu-hover`);

  function renderDetailSvg(sido, gungu, clickedSubName) {
    const svgData = typeof KOREA_SVG_MAPS !== 'undefined' ? KOREA_SVG_MAPS[sido] : null;
    detailTitleEl.textContent = sido === '해외' ? '해외 근무' : `${sido} 시 · 군 · 구`;
    gunguHoverEl.textContent = clickedSubName || gungu;

    if (!svgData) {
      detailContainerEl.innerHTML = `
        <div class="region-svg-overseas">
          <div style="font-size: 32px;">🌍</div>
          <div>${gungu}</div>
          <div style="font-size: 11.5px; opacity: 0.8;">왼쪽 한국 지도를 클릭하면 국내 지역으로 돌아옵니다</div>
        </div>
      `;
      return;
    }

    detailContainerEl.innerHTML = `
      <svg id="${prefix}-detail-svg" class="region-svg-box" viewBox="${svgData.viewBox}" stroke-linecap="round" stroke-linejoin="round">
        ${svgData.paths
          .map((p) => {
            const active = isSvgDistrictMatched(p.id, gungu, sido);
            return `<path class="region-svg-path ${active ? 'active' : ''}" data-svg-gungu="${p.id}" d="${p.d}" />`;
          })
          .join('')}
      </svg>
    `;

    const detailSvgEl = document.getElementById(`${prefix}-detail-svg`);
    if (detailSvgEl) {
      detailSvgEl.querySelectorAll('.region-svg-path').forEach((pathEl) => {
        const svgId = pathEl.dataset.svgGungu;
        pathEl.addEventListener('mouseenter', () => {
          gunguHoverEl.textContent = svgId;
        });
        pathEl.addEventListener('mouseleave', () => {
          gunguHoverEl.textContent = state.answers[gunguKey];
        });
        pathEl.addEventListener('click', () => {
          const resolved = resolveGunguFromSvgId(svgId, state.answers[sidoKey]);
          if (!resolved) return;
          state.answers[gunguKey] = resolved;
          gunguEl.value = resolved;
          syncMapAndLabel(svgId !== resolved ? svgId : null);
        });
      });
    }
  }

  function syncMapAndLabel(clickedSubName = null) {
    const s = state.answers[sidoKey];
    const g = state.answers[gunguKey];
    const displaySub = clickedSubName ? `${g} (${clickedSubName})` : g;
    labelEl.textContent = `📍 ${s} ${displaySub}`;
    coordsEl.textContent = s === '해외' ? '해외 선택됨' : '지도에서 구/시/군 클릭 가능';
    sidoHoverEl.textContent = s;
    saveAppState();

    const targetSvgSido = REGION_SIDO_TO_SVG[s] || s;
    nationalSvgEl.querySelectorAll('.region-svg-path').forEach((pathEl) => {
      pathEl.classList.toggle('active', pathEl.dataset.svgSido === targetSvgSido);
    });
    renderDetailSvg(s, g, clickedSubName);
  }

  nationalSvgEl.querySelectorAll('.region-svg-path').forEach((pathEl) => {
    const rawSido = pathEl.dataset.svgSido;
    const mappedSido = SVG_SIDO_TO_REGION[rawSido] || rawSido;
    pathEl.addEventListener('mouseenter', () => {
      sidoHoverEl.textContent = mappedSido;
    });
    pathEl.addEventListener('mouseleave', () => {
      sidoHoverEl.textContent = state.answers[sidoKey];
    });
    pathEl.addEventListener('click', () => {
      if (!KOREA_REGIONS[mappedSido]) return;
      state.answers[sidoKey] = mappedSido;
      sidoEl.value = mappedSido;
      const nextGungus = Object.keys(KOREA_REGIONS[mappedSido].districts);
      state.answers[gunguKey] = nextGungus[0];
      gunguEl.innerHTML = nextGungus.map((g) => `<option value="${g}">${g}</option>`).join('');
      gunguEl.value = state.answers[gunguKey];
      syncMapAndLabel();
    });
  });

  sidoEl.addEventListener('change', () => {
    const nextSido = sidoEl.value;
    state.answers[sidoKey] = nextSido;
    const nextGungus = Object.keys(KOREA_REGIONS[nextSido].districts);
    state.answers[gunguKey] = nextGungus[0];
    gunguEl.innerHTML = nextGungus.map((g) => `<option value="${g}">${g}</option>`).join('');
    gunguEl.value = state.answers[gunguKey];
    syncMapAndLabel();
  });

  gunguEl.addEventListener('change', () => {
    state.answers[gunguKey] = gunguEl.value;
    syncMapAndLabel();
  });

  syncMapAndLabel();
}

function renderRegionStep(q) {
  const sel = renderRegionSelectorHtml('region', state.answers.regionSido, state.answers.regionGungu);
  state.answers.regionSido = sel.sido;
  state.answers.regionGungu = sel.gungu;

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    ${getGreetingHtml(q)}
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      ${sel.html}
      <div class="quiz-nav-row">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-region-next" class="btn-primary">다음 문항으로</button>
      </div>
    </div>
  `;

  mountRegionSelector({ prefix: 'region', sidoKey: 'regionSido', gunguKey: 'regionGungu' });

  document.getElementById('btn-region-next').addEventListener('click', () => {
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
    ${getGreetingHtml(q)}
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
    saveAppState();
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
    ${getGreetingHtml(q)}
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
      saveAppState();
      renderEducationStep(q);
    });
  });

  quizBody.querySelectorAll('[data-tier-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.educationTier = Number(btn.dataset.tierIdx);
      saveAppState();
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

// 4. 직업 · 소득 (순 계약 연봉 + 인센티브 + 세전/세후 연·월 합계)
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
  const workSel = renderRegionSelectorHtml('work', state.answers.workSido, state.answers.workGungu);
  state.answers.workSido = workSel.sido;
  state.answers.workGungu = workSel.gungu;
  const hideWorkRegion = Boolean(employmentType !== null && q.employmentOptions[employmentType] && q.employmentOptions[employmentType].zeroSalaryDefault);

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    ${getGreetingHtml(q)}
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

      <div id="work-region-wrap" style="display: ${hideWorkRegion ? 'none' : 'block'};">
        <span class="field-label">직장 위치</span>
        ${workSel.html}
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
          <span class="salary-compare-label">세전 총합 (연)</span>
          <span id="gross-total-val" class="salary-compare-val">0원</span>
        </div>
        <div class="salary-compare-item">
          <span class="salary-compare-label">예상 세후 (연)</span>
          <span id="net-total-val" class="salary-compare-val">0원</span>
        </div>
        <div class="salary-compare-item">
          <span class="salary-compare-label">예상 월 실수령</span>
          <span id="monthly-net-val" class="salary-compare-val">0원</span>
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
  const monthlyEl = document.getElementById('monthly-net-val');
  const errorEl = document.getElementById('job-error');

  function updateSalaryPreview() {
    const rawS = salaryEl.value.trim();
    const rawI = incEl.value.trim();
    state.answers.salaryManwon = rawS;
    state.answers.incentiveManwon = rawI;
    saveAppState();

    if (rawS === '' && rawI === '') {
      compareBox.style.display = 'none';
      return;
    }
    const s = Math.max(0, Math.floor(Number(rawS) || 0));
    const inc = Math.max(0, Math.floor(Number(rawI) || 0));
    const totalGross = s + inc;
    const totalNet = estimateAfterTaxManwon(totalGross);
    const monthlyNet = Math.round(totalNet / 12);

    compareBox.style.display = 'grid';
    grossEl.textContent = formatManwonKorean(totalGross);
    netEl.textContent = formatManwonKorean(totalNet);
    monthlyEl.textContent = formatManwonKorean(monthlyNet);
    errorEl.textContent = '';
  }

  const workRegionWrap = document.getElementById('work-region-wrap');
  mountRegionSelector({ prefix: 'work', sidoKey: 'workSido', gunguKey: 'workGungu' });

  quizBody.querySelectorAll('[data-emp-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.empIdx);
      state.answers.employmentType = idx;
      saveAppState();
      quizBody.querySelectorAll('[data-emp-idx]').forEach((b) => {
        const active = Number(b.dataset.empIdx) === idx;
        b.classList.toggle('selected', active);
        b.querySelector('.option-check').textContent = active ? '✓' : '';
      });
      if (workRegionWrap) {
        workRegionWrap.style.display = q.employmentOptions[idx].zeroSalaryDefault ? 'none' : 'block';
      }
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
    ${getGreetingHtml(q)}
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
      saveAppState();
      renderHousingStep(q);
    });
  });

  if (costEl) {
    costEl.addEventListener('input', () => {
      state.answers.housingCostManwon = costEl.value.trim();
      errorEl.textContent = '';
      saveAppState();
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

// 6. 자산 - 저축 (한 줄씩 배치 + 청약/ISA 추가)
function renderSavingsStep(q) {
  const { cashManwon, isaManwon, pensionManwon, investManwon, debtManwon } = state.answers;
  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    ${getGreetingHtml(q)}
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div class="savings-list">
        <div>
          <span class="field-label">현금 · 입출금 · 예적금</span>
          <div class="salary-input-wrap">
            <input id="input-cash" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="0000" value="${cashManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
        <div>
          <span class="field-label">청약 · ISA · 절세통장</span>
          <div class="salary-input-wrap">
            <input id="input-isa" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="000" value="${isaManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
        <div>
          <span class="field-label">연금 · 퇴직연금 (IRP 등)</span>
          <div class="salary-input-wrap">
            <input id="input-pension" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="0000" value="${pensionManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
        <div>
          <span class="field-label">주식 · 펀드 · 코인</span>
          <div class="salary-input-wrap">
            <input id="input-invest" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="000" value="${investManwon}" />
            <span class="salary-unit">만원</span>
          </div>
        </div>
        <div>
          <span class="field-label">대출 (부동산 외 신용 · 학자금 등)</span>
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
  const isaEl = document.getElementById('input-isa');
  const pensionEl = document.getElementById('input-pension');
  const investEl = document.getElementById('input-invest');
  const debtEl = document.getElementById('input-debt');
  const previewEl = document.getElementById('savings-preview');

  function updateSavingsPreview() {
    state.answers.cashManwon = cashEl.value.trim();
    state.answers.isaManwon = isaEl.value.trim();
    state.answers.pensionManwon = pensionEl.value.trim();
    state.answers.investManwon = investEl.value.trim();
    state.answers.debtManwon = debtEl.value.trim();
    saveAppState();

    const net =
      (Number(state.answers.cashManwon) || 0) +
      (Number(state.answers.isaManwon) || 0) +
      (Number(state.answers.pensionManwon) || 0) +
      (Number(state.answers.investManwon) || 0) -
      (Number(state.answers.debtManwon) || 0);
    previewEl.textContent = `순 금융자산: ${formatManwonKorean(net)}`;
  }

  [cashEl, isaEl, pensionEl, investEl, debtEl].forEach((el) => el.addEventListener('input', updateSavingsPreview));
  updateSavingsPreview();

  document.getElementById('btn-savings-next').addEventListener('click', () => {
    goNextStep();
  });
  bindBackButtons();
}

// 8. 자기관리 - 운동 (거의 안함 시 하위 문항 숨김)
function renderSelfcareStep(q) {
  const { exerciseFreq, exerciseDuration, exerciseYears } = state.answers;
  const isNoExercise = exerciseFreq === 0;
  const canProceed =
    exerciseFreq !== null && (isNoExercise || (exerciseDuration !== null && exerciseYears !== null));

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    ${getGreetingHtml(q)}
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

      <div class="sub-group" style="display: ${isNoExercise ? 'none' : 'block'};">
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

      <div class="sub-group" style="display: ${isNoExercise ? 'none' : 'block'};">
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
      const idx = Number(b.dataset.freqIdx);
      state.answers.exerciseFreq = idx;
      if (idx === 0) {
        state.answers.exerciseDuration = null;
        state.answers.exerciseYears = null;
      }
      saveAppState();
      renderSelfcareStep(q);
    })
  );
  quizBody.querySelectorAll('[data-dur-idx]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.exerciseDuration = Number(b.dataset.durIdx);
      saveAppState();
      renderSelfcareStep(q);
    })
  );
  quizBody.querySelectorAll('[data-yrs-idx]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.exerciseYears = Number(b.dataset.yrsIdx);
      saveAppState();
      renderSelfcareStep(q);
    })
  );

  document.getElementById('btn-selfcare-next').addEventListener('click', () => {
    if (canProceed) goNextStep();
  });
  bindBackButtons();
}

// 9. 자기관리 - 흡연 (2x2: 좌측 병합 비흡연, 우측 상단 연초, 우측 하단 전자담배)
function renderSmokingStep(q) {
  const { smoking } = state.answers;
  const canProceed = smoking !== null;

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    ${getGreetingHtml(q)}
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div class="smoking-grid">
        <button type="button" class="option-btn smoking-non ${smoking === 0 ? 'selected' : ''}" data-smk="0">
          <span style="font-size:28px;line-height:1;">🚭</span>
          <span>${q.options[0].label}</span>
          <span class="option-check">${smoking === 0 ? '✓' : ''}</span>
        </button>
        <button type="button" class="option-btn ${smoking === 1 ? 'selected' : ''}" data-smk="1">
          <span>🚬 ${q.options[1].label}</span>
          <span class="option-check">${smoking === 1 ? '✓' : ''}</span>
        </button>
        <button type="button" class="option-btn ${smoking === 2 ? 'selected' : ''}" data-smk="2">
          <span>💨 ${q.options[2].label}</span>
          <span class="option-check">${smoking === 2 ? '✓' : ''}</span>
        </button>
      </div>

      <div class="quiz-nav-row" style="margin-top: 10px;">
        <button type="button" class="btn-secondary btn-quiz-back">← 뒤로가기</button>
        <button type="button" id="btn-smoking-next" class="btn-primary" ${canProceed ? '' : 'disabled'}>다음 문항으로</button>
      </div>
    </div>
  `;

  quizBody.querySelectorAll('[data-smk]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.smoking = Number(b.dataset.smk);
      saveAppState();
      renderSmokingStep(q);
    })
  );

  document.getElementById('btn-smoking-next').addEventListener('click', () => {
    if (canProceed) goNextStep();
  });
  bindBackButtons();
}

// 10. 연애 이력 (0회 시 최장기간 숨김)
function renderDatingStep(q) {
  const { datingCount, datingLongest } = state.answers;
  const isNoDating = datingCount === 0;
  const canProceed = datingCount !== null && (isNoDating || datingLongest !== null);

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    ${getGreetingHtml(q)}
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

      <div style="display: ${isNoDating ? 'none' : 'block'};">
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
      const idx = Number(b.dataset.dc);
      state.answers.datingCount = idx;
      if (idx === 0) {
        state.answers.datingLongest = null;
      }
      saveAppState();
      renderDatingStep(q);
    })
  );
  quizBody.querySelectorAll('[data-dl]').forEach((b) =>
    b.addEventListener('click', () => {
      state.answers.datingLongest = Number(b.dataset.dl);
      saveAppState();
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
    `${getDisplayName()}님의 자산·소득과 피지컬 지표를 분석하고 있습니다...`,
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

// 등급 산정 엔진 (+, 기본, - 세분화)
function getQuestionById(id) {
  return QUESTIONS.find((q) => q.id === id);
}

function resolveSubTier(score) {
  for (const item of SUB_TIER_THRESHOLDS) {
    if (score >= item.minScore) return item;
  }
  return SUB_TIER_THRESHOLDS[SUB_TIER_THRESHOLDS.length - 1];
}

const TOKEN_PREFIX = 'LTM1.';
const TOKEN_KEY = 'LoveTierMeter#2026!EnumCipherKey';
const BLOOD_ENUM = ['A', 'B', 'O', 'AB'];
const MBTI_ENUM = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P']
];

function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padLen = (4 - (str.length % 4)) % 4;
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function xorObfuscateBytes(bytes) {
  const out = new Uint8Array(bytes.length);
  let stateMix = 0x5a;
  for (let i = 0; i < bytes.length; i += 1) {
    const k = TOKEN_KEY.charCodeAt(i % TOKEN_KEY.length);
    stateMix = (stateMix * 33 + k + i) & 0xff;
    out[i] = bytes[i] ^ stateMix;
  }
  return out;
}

function encodeRegionPair(sido, gungu) {
  const sidoList = Object.keys(KOREA_REGIONS);
  const sIdx = Math.max(0, sidoList.indexOf(sido));
  const sKey = sidoList[sIdx];
  const gunguList = Object.keys(KOREA_REGIONS[sKey].districts);
  const gIdx = Math.max(0, gunguList.indexOf(gungu));
  return [sIdx, gIdx];
}

function decodeRegionPair(sIdx, gIdx) {
  const sidoList = Object.keys(KOREA_REGIONS);
  const sKey = sidoList[sIdx] || sidoList[0];
  const gunguList = Object.keys(KOREA_REGIONS[sKey].districts);
  const gKey = gunguList[gIdx] || gunguList[0];
  return [sKey, gKey];
}

function encodeMbtiMask(mbti) {
  const keys = ['ei', 'sn', 'tf', 'jp'];
  let mask = 0;
  keys.forEach((k, idx) => {
    const v = mbti && mbti[k];
    const code = v === MBTI_ENUM[idx][0] ? 1 : v === MBTI_ENUM[idx][1] ? 2 : 0;
    mask = mask * 3 + code;
  });
  return mask;
}

function decodeMbtiMask(mask) {
  const keys = ['ei', 'sn', 'tf', 'jp'];
  const out = { ei: null, sn: null, tf: null, jp: null };
  let cur = Math.max(0, Math.min(80, Number(mask) || 0));
  for (let idx = keys.length - 1; idx >= 0; idx -= 1) {
    const rem = cur % 3;
    cur = Math.floor(cur / 3);
    out[keys[idx]] = rem === 1 ? MBTI_ENUM[idx][0] : rem === 2 ? MBTI_ENUM[idx][1] : null;
  }
  return out;
}

function numOrEmpty(val) {
  return val === '' || val === null || val === undefined ? -1 : Number(val);
}

function strFromNum(n) {
  return n === -1 || Number.isNaN(n) ? '' : String(n);
}

function idxOrNeg(val) {
  return val === null || val === undefined ? -1 : Number(val);
}

function idxOrNull(n) {
  return n < 0 || Number.isNaN(n) ? null : n;
}

function encodeResultCode(a) {
  const [rS, rG] = encodeRegionPair(a.regionSido, a.regionGungu);
  const [wS, wG] = encodeRegionPair(a.workSido, a.workGungu);
  const nickIdx = Math.max(0, RANDOM_NICKNAMES.indexOf(a.randomNickname));
  const fields = [
    encodeURIComponent(a.isNamePrivate ? '' : a.userName || ''),
    a.isNamePrivate ? 1 : 0,
    nickIdx,
    a.gender === 'male' ? 0 : a.gender === 'female' ? 1 : -1,
    numOrEmpty(a.birthYear),
    numOrEmpty(a.birthMonth),
    numOrEmpty(a.birthDay),
    a.birthAmPm === 'PM' ? 1 : 0,
    numOrEmpty(a.birthHour),
    numOrEmpty(a.birthMinute),
    a.unknownTime ? 1 : 0,
    BLOOD_ENUM.indexOf(a.bloodType),
    encodeMbtiMask(a.mbti),
    rS,
    rG,
    wS,
    wG,
    numOrEmpty(a.heightCm),
    numOrEmpty(a.weightKg),
    idxOrNeg(a.educationDegree),
    idxOrNeg(a.educationTier),
    idxOrNeg(a.employmentType),
    numOrEmpty(a.salaryManwon),
    numOrEmpty(a.incentiveManwon),
    idxOrNeg(a.housingType),
    numOrEmpty(a.housingCostManwon),
    numOrEmpty(a.cashManwon),
    numOrEmpty(a.isaManwon),
    numOrEmpty(a.pensionManwon),
    numOrEmpty(a.investManwon),
    numOrEmpty(a.debtManwon),
    idxOrNeg(a.car),
    idxOrNeg(a.exerciseFreq),
    idxOrNeg(a.exerciseDuration),
    idxOrNeg(a.exerciseYears),
    idxOrNeg(a.smoking),
    idxOrNeg(a.drinking),
    idxOrNeg(a.diet),
    idxOrNeg(a.religion),
    idxOrNeg(a.datingCount),
    idxOrNeg(a.datingLongest),
    idxOrNeg(a.standard)
  ];

  const payloadBytes = new TextEncoder().encode(fields.join('|'));
  let checksum = 0x3c;
  for (let i = 0; i < payloadBytes.length; i += 1) {
    checksum = (checksum ^ payloadBytes[i]) & 0xff;
  }
  const framed = new Uint8Array(payloadBytes.length + 1);
  framed[0] = checksum;
  framed.set(payloadBytes, 1);
  return TOKEN_PREFIX + toBase64Url(xorObfuscateBytes(framed));
}

function decodeResultCode(rawCode) {
  try {
    const trimmed = String(rawCode || '').trim();
    if (!trimmed.startsWith(TOKEN_PREFIX)) return null;
    const framed = xorObfuscateBytes(fromBase64Url(trimmed.slice(TOKEN_PREFIX.length)));
    if (framed.length < 2) return null;
    const expectedSum = framed[0];
    const payloadBytes = framed.slice(1);
    let actualSum = 0x3c;
    for (let i = 0; i < payloadBytes.length; i += 1) {
      actualSum = (actualSum ^ payloadBytes[i]) & 0xff;
    }
    if (actualSum !== expectedSum) return null;

    const parts = new TextDecoder().decode(payloadBytes).split('|');
    if (parts.length !== 42) return null;

    const n = (idx) => Number(parts[idx]);
    const [regionSido, regionGungu] = decodeRegionPair(n(13), n(14));
    const [workSido, workGungu] = decodeRegionPair(n(15), n(16));

    return {
      userName: decodeURIComponent(parts[0] || ''),
      isNamePrivate: n(1) === 1,
      randomNickname: RANDOM_NICKNAMES[n(2)] || RANDOM_NICKNAMES[0],
      gender: n(3) === 0 ? 'male' : n(3) === 1 ? 'female' : null,
      birthYear: strFromNum(n(4)),
      birthMonth: strFromNum(n(5)),
      birthDay: strFromNum(n(6)),
      birthAmPm: n(7) === 1 ? 'PM' : 'AM',
      birthHour: strFromNum(n(8)),
      birthMinute: strFromNum(n(9)),
      unknownTime: n(10) === 1,
      bloodType: BLOOD_ENUM[n(11)] || null,
      mbti: decodeMbtiMask(n(12)),
      regionSido,
      regionGungu,
      workSido,
      workGungu,
      heightCm: strFromNum(n(17)),
      weightKg: strFromNum(n(18)),
      educationDegree: idxOrNull(n(19)),
      educationTier: idxOrNull(n(20)),
      employmentType: idxOrNull(n(21)),
      salaryManwon: strFromNum(n(22)),
      incentiveManwon: strFromNum(n(23)),
      housingType: idxOrNull(n(24)),
      housingCostManwon: strFromNum(n(25)),
      cashManwon: strFromNum(n(26)),
      isaManwon: strFromNum(n(27)),
      pensionManwon: strFromNum(n(28)),
      investManwon: strFromNum(n(29)),
      debtManwon: strFromNum(n(30)),
      car: idxOrNull(n(31)),
      exerciseFreq: idxOrNull(n(32)),
      exerciseDuration: idxOrNull(n(33)),
      exerciseYears: idxOrNull(n(34)),
      smoking: idxOrNull(n(35)),
      drinking: idxOrNull(n(36)),
      diet: idxOrNull(n(37)),
      religion: idxOrNull(n(38)),
      datingCount: idxOrNull(n(39)),
      datingLongest: idxOrNull(n(40)),
      standard: idxOrNull(n(41))
    };
  } catch {
    return null;
  }
}

function evaluateResult() {
  const a = state.answers;
  const displayName = getDisplayName();
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
  const tierOpt = degOpt.needsTier && a.educationTier !== null ? eduQ.tierOptions[a.educationTier] : null;
  const eduSpec = degOpt.spec + (tierOpt ? tierOpt.spec : 0);

  // 3) 직업 · 총소득
  const empOpt = getQuestionById('job').employmentOptions[a.employmentType];
  const grossSalary = (Number(a.salaryManwon) || 0) + (Number(a.incentiveManwon) || 0);
  const netSalary = estimateAfterTaxManwon(grossSalary);
  const monthlyNet = Math.round(netSalary / 12);
  let salarySpec = 2;
  if (grossSalary >= 12000) salarySpec = 20;
  else if (grossSalary >= 8500) salarySpec = 16;
  else if (grossSalary >= 6000) salarySpec = 13;
  else if (grossSalary >= 4000) salarySpec = 9;
  else if (grossSalary >= 2500) salarySpec = 5;

  // 4) 자산
  const houseOpt = getQuestionById('housing').options[a.housingType];
  const houseCost = Number(a.housingCostManwon) || 0;
  const costPenalty = houseCost >= 150 ? 4 : houseCost >= 80 ? 2 : 0;

  const netFinancial =
    (Number(a.cashManwon) || 0) +
    (Number(a.isaManwon) || 0) +
    (Number(a.pensionManwon) || 0) +
    (Number(a.investManwon) || 0) -
    (Number(a.debtManwon) || 0);

  let savingsSpec = 2;
  if (netFinancial >= 30000) savingsSpec = 18;
  else if (netFinancial >= 15000) savingsSpec = 14;
  else if (netFinancial >= 7000) savingsSpec = 10;
  else if (netFinancial >= 2000) savingsSpec = 6;
  else if (netFinancial < 0) savingsSpec = 0;

  const carQ = getQuestionById('car');
  const carOpt = carQ.options[a.car];
  const hasCar = a.car === 0 || a.car === 1;

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

  // 지표 1: 스펙 (피지컬·학력·직업·소득·연령)
  const rawSpec = heightSpec + bmiSpec + eduSpec + empOpt.spec + salarySpec + ageScore;
  const specPercent = Math.max(10, Math.min(100, Math.round((rawSpec / 77) * 100)));

  // 지표 2: 자산 (부동산·주거비·순금융자산·차량)
  const rawAsset = (houseOpt.spec - costPenalty) + savingsSpec + carOpt.spec;
  const assetPercent = Math.max(10, Math.min(100, Math.round((rawAsset / 42) * 100)));
  const assetSpecPercent = Math.round(specPercent * 0.55 + assetPercent * 0.45);

  // 지표 2: 자기관리 · 생활
  const selfQ = getQuestionById('selfcare');
  const freqOpt = selfQ.freqOptions[a.exerciseFreq];
  const isNoExercise = a.exerciseFreq === 0;
  const durOpt = !isNoExercise && a.exerciseDuration !== null ? selfQ.durationOptions[a.exerciseDuration] : null;
  const yrsOpt = !isNoExercise && a.exerciseYears !== null ? selfQ.yearsOptions[a.exerciseYears] : null;
  const exScore = freqOpt.score + (durOpt ? durOpt.score : 0) + (yrsOpt ? yrsOpt.score : 0);

  const smkOpt = getQuestionById('smoking').options[a.smoking];
  const drkOpt = getQuestionById('drinking').options[a.drinking];
  const dietOpt = getQuestionById('diet').options[a.diet];
  const relOpt = getQuestionById('religion').options[a.religion];
  const hurdlePenalty = smkOpt.penalty + drkOpt.penalty + relOpt.penalty + dietOpt.penalty;
  const hurdleTags = [smkOpt.tag, drkOpt.tag, relOpt.tag, dietOpt.tag].filter(Boolean);

  const selfcarePercent = Math.max(10, Math.min(100, Math.round(((exScore + 25 - hurdlePenalty * 1.4) / 60) * 100)));

  // 지표 3: 연애 이력
  const datQ = getQuestionById('dating');
  const dcOpt = datQ.countOptions[a.datingCount];
  const isNoDating = a.datingCount === 0;
  const dlOpt = !isNoDating && a.datingLongest !== null ? datQ.longestOptions[a.datingLongest] : null;
  const datingExpScore = dcOpt.score + (dlOpt ? dlOpt.score : 2);
  const lovePercent = Math.max(15, Math.min(100, Math.round((datingExpScore / 25) * 100)));

  // 지표 4: 메타인지
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
      Math.round(specPercent * 0.26 + assetPercent * 0.22 + selfcarePercent * 0.24 + lovePercent * 0.16 + metaPercent * 0.12 - hurdlePenalty * 0.4)
    )
  );

  const tierObj = resolveSubTier(totalScore);
  const mbtiStr = getMbtiString(a.mbti) || '-';
  const regionText = getRegionDisplay(a);
  const workRegionText = empOpt.zeroSalaryDefault ? '해당 없음' : getWorkRegionDisplay(a);

  const bmiCat = getBmiCategory(bmi);
  const bmiTone = bmiCat === '정상' ? 'good' : bmiCat === '과체중' || bmiCat === '저체중' ? 'warn' : 'bad';
  const cashVal = Number(a.cashManwon) || 0;
  const isaVal = Number(a.isaManwon) || 0;
  const pensionVal = Number(a.pensionManwon) || 0;
  const investVal = Number(a.investManwon) || 0;
  const debtVal = Number(a.debtManwon) || 0;

  const summarySections = [
    {
      title: '01. 인적 사항',
      rows: [
        {
          cols: 3,
          cells: [
            { key: '성명', val: `${displayName}${a.isNamePrivate ? ' (비공개)' : ''}` },
            { key: '성별 · 나이', val: `${a.gender === 'male' ? '남성' : '여성'} · 만 ${manAge}세 (${zodiac.emoji} ${zodiac.name})` },
            { key: '혈액형 · MBTI', val: `${a.bloodType || '-'} · ${mbtiStr}` }
          ]
        },
        {
          cols: 2,
          cells: [
            { key: '현재 거주지', val: regionText },
            { key: '직장 위치', val: workRegionText }
          ]
        }
      ]
    },
    {
      title: '02. 신체 조건',
      rows: [
        {
          cols: 3,
          cells: [
            { key: '신장', val: `${h} cm` },
            { key: '체중', val: `${w} kg` },
            { key: 'BMI 지수', val: `${bmi.toFixed(1)}`, badge: bmiCat, badgeTone: bmiTone }
          ]
        }
      ]
    },
    {
      title: '03. 학력 · 직업 · 소득',
      rows: [
        {
          cols: 2,
          cells: [
            { key: '최종 학력', val: tierOpt ? `${degOpt.label} (${tierOpt.label.split(' ')[0]})` : degOpt.label },
            { key: '고용 형태', val: empOpt.label }
          ]
        },
        {
          cols: 3,
          cells: [
            { key: '세전 총소득 (연)', val: formatManwonKorean(grossSalary) },
            { key: '예상 세후 (연)', val: formatManwonKorean(netSalary) },
            { key: '예상 월 실수령', val: formatManwonKorean(monthlyNet), highlight: true }
          ]
        }
      ]
    },
    {
      title: '04. 자산 · 주거 · 차량',
      rows: [
        {
          cols: 2,
          cells: [
            { key: '주거 형태 · 월 주거비', val: `${houseOpt.label} (월 ${houseCost}만원)` },
            {
              key: '자차 소유',
              val: hasCar ? carOpt.label : '',
              checks: [
                { label: '보유', checked: hasCar },
                { label: '미보유', checked: !hasCar }
              ]
            }
          ]
        },
        {
          cols: 3,
          cells: [
            { key: '현금 · 예적금', val: formatManwonKorean(cashVal) },
            { key: 'ISA · 청약', val: formatManwonKorean(isaVal) },
            { key: '연금 저축', val: formatManwonKorean(pensionVal) }
          ]
        },
        {
          cols: 3,
          cells: [
            { key: '주식 · 코인', val: formatManwonKorean(investVal) },
            { key: '대출 (부동산 외)', val: debtVal > 0 ? `-${formatManwonKorean(debtVal)}` : '0원' },
            { key: '순 금융자산 합계', val: formatManwonKorean(netFinancial), highlight: true }
          ]
        }
      ]
    },
    {
      title: '05. 자기관리 · 생활 습관',
      rows: [
        {
          cols: 3,
          cells: [
            { key: '주 운동 횟수', val: freqOpt.label },
            { key: '1회 운동 시간', val: isNoExercise ? '해당 없음' : durOpt.label },
            { key: '운동 경력', val: isNoExercise ? '해당 없음' : yrsOpt.label }
          ]
        },
        {
          cols: 1,
          cells: [
            {
              key: '흡연 여부',
              checks: [
                { label: '비흡연', checked: a.smoking === 0 },
                { label: '연초 흡연', checked: a.smoking === 1 },
                { label: '전자담배', checked: a.smoking === 2 }
              ]
            }
          ]
        },
        {
          cols: 3,
          cells: [
            { key: '음주 빈도', val: drkOpt.label },
            { key: '식습관', val: dietOpt.label.split(' ')[0] },
            { key: '종교', val: relOpt.label.split(' ')[0] }
          ]
        }
      ]
    },
    {
      title: '06. 연애 이력',
      rows: [
        {
          cols: 2,
          cells: [
            { key: '연애 횟수', val: dcOpt.label },
            { key: '최장 연애 기간', val: isNoDating ? '해당 없음' : dlOpt.label }
          ]
        }
      ]
    }
  ];
  const summaryItems = summarySections.flatMap((sec) => sec.rows.flatMap((r) => r.cells));

  const metrics = [
    { name: '스펙', sub: '피지컬·학력·직업·소득', label: '스펙 (피지컬·학력·직업·소득·연령)', score: specPercent },
    { name: '자산', sub: '부동산·주거비·저축·차량', label: '자산 (부동산·주거비·저축·차량)', score: assetPercent },
    { name: '자기관리', sub: '운동·흡연·음주·식단', label: '자기관리 · 생활 (운동·흡연·음주·식단)', score: selfcarePercent },
    { name: '연애 이력', sub: '경험·최장기간', label: '연애 이력 (경험·최장기간)', score: lovePercent },
    { name: '메타인지', sub: '눈높이 균형', label: '메타인지 (눈높이 균형)', score: metaPercent }
  ].map((m) => {
    const t = resolveSubTier(m.score);
    return { ...m, tier: t.tier, baseTier: t.base };
  });

  const restoreCode = encodeResultCode(a);

  return {
    displayName,
    genderLabel: a.gender === 'male' ? '👨 남성' : '👩 여성',
    manAge,
    yearAge,
    zodiac,
    region: regionText,
    actualTier: tierObj.tier,
    baseTier: tierObj.base,
    totalScore,
    hurdleTags,
    eyePenalty,
    summaryItems,
    summarySections,
    metrics,
    restoreCode
  };
}

function getQrPayload(code) {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    return `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(code)}`;
  }
  return code;
}

function drawQrToCanvas(ctx, text, x, y, size) {
  if (typeof qrcode !== 'function') return false;
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 2;
  const cell = size / (count + quiet * 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#1c2434';
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < count; c += 1) {
      if (qr.isDark(r, c)) {
        const px = Math.floor(x + (c + quiet) * cell);
        const py = Math.floor(y + (r + quiet) * cell);
        const pw = Math.ceil(cell);
        ctx.fillRect(px, py, pw, pw);
      }
    }
  }
  return true;
}

function renderResult(res) {
  lastResult = res;
  const profile = TIER_PROFILES[res.baseTier];

  document.getElementById('result-profile-badge').textContent = `${res.zodiac.emoji} ${res.displayName} · 만 ${res.manAge}세(연 ${res.yearAge}) · ${res.genderLabel} · ${res.region}`;
  document.getElementById('result-doc-id').textContent = `SCORE ${res.totalScore} / 100`;

  const actualBox = document.getElementById('res-actual-box');
  actualBox.className = `tier-badge-compact tier-${res.baseTier}`;
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
  document.getElementById('res-advice').textContent = `💡 매니저 처방: ${profile.advice}`;

  const ringCirc = 2 * Math.PI * 30;
  const metricsEl = document.getElementById('res-metrics');
  metricsEl.innerHTML = res.metrics
    .map((m) => {
      const t = m.tier && m.baseTier ? { tier: m.tier, base: m.baseTier } : resolveSubTier(m.score);
      const offset = ringCirc * (1 - m.score / 100);
      const title = m.name || m.label.split(' (')[0];
      const sub = m.sub || (m.label.includes('(') ? m.label.split('(')[1].replace(')', '') : '');
      return `
      <div class="metric-card tier-${t.base}">
        <div class="metric-ring-wrap">
          <svg class="metric-ring-svg" viewBox="0 0 72 72">
            <circle class="metric-ring-track" cx="36" cy="36" r="30"></circle>
            <circle class="metric-ring-fill" cx="36" cy="36" r="30"
              stroke-dasharray="${ringCirc.toFixed(2)}"
              stroke-dashoffset="${offset.toFixed(2)}"></circle>
          </svg>
          <div class="metric-ring-center">
            <span class="metric-tier">${t.tier}</span>
            <span class="metric-score">${m.score}점</span>
          </div>
        </div>
        <div class="metric-name">${title}</div>
        <div class="metric-sub">${sub}</div>
      </div>
    `;
    })
    .join('');

  const sections = res.summarySections || [];
  const summarySheetEl = document.getElementById('res-summary-sheet');
  summarySheetEl.innerHTML = sections
    .map(
      (sec) => `
      <div class="resume-section">
        <div class="resume-section-title">${sec.title}</div>
        ${(sec.rows || [])
          .map(
            (row) => `
          <div class="resume-row cols-${row.cols}">
            ${row.cells
              .map((cell) => {
                const checksHtml = cell.checks
                  ? `<span class="resume-check-group">${cell.checks
                      .map(
                        (c) =>
                          `<span class="resume-check-opt ${c.checked ? 'is-checked' : ''}"><span class="resume-check ${c.checked ? 'checked' : ''}">${c.checked ? '✓' : ''}</span><span>${c.label}</span></span>`
                      )
                      .join('')}</span>`
                  : '';
                const badgeHtml = cell.badge
                  ? `<span class="resume-badge tone-${cell.badgeTone || 'good'}">${cell.badge}</span>`
                  : '';
                const valTextHtml = cell.val ? `<span>${cell.val}</span>` : '';
                return `
                <div class="resume-cell ${cell.highlight ? 'highlight' : ''}">
                  <span class="resume-cell-key">${cell.key}</span>
                  <span class="resume-cell-val">${checksHtml}${valTextHtml}${badgeHtml}</span>
                </div>
              `;
              })
              .join('')}
          </div>
        `
          )
          .join('')}
      </div>
    `
    )
    .join('');

  const restoreEl = document.getElementById('res-restore-code');
  const qrCanvas = document.getElementById('res-qr-canvas');
  const code = res.restoreCode || encodeResultCode(state.answers);
  res.restoreCode = code;
  if (restoreEl) {
    restoreEl.textContent = code;
  }
  if (qrCanvas) {
    const qCtx = qrCanvas.getContext('2d');
    drawQrToCanvas(qCtx, getQrPayload(code), 0, 0, qrCanvas.width);
  }
  saveAppState();
}

// 결과 카드 전체 PNG 저장
function getWrappedLines(ctx, text, maxWidth) {
  const chars = text.split('');
  const lines = [];
  let line = '';
  for (let i = 0; i < chars.length; i += 1) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      lines.push(line);
      line = chars[i];
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

document.getElementById('btn-save-img').addEventListener('click', () => {
  if (!lastResult) return;
  const profile = TIER_PROFILES[lastResult.baseTier];

  let extraComment = profile.comment;
  if (lastResult.hurdleTags.length > 0) {
    extraComment += ` 특히 [${lastResult.hurdleTags.join(', ')}] 요소가 매칭 풀을 좁히는 요인으로 작용했습니다.`;
  }
  if (lastResult.eyePenalty > 0) {
    extraComment += ' 본인 조건 대비 희망 기준이 높게 설정되어 감점이 발생했습니다.';
  }
  const adviceText = `💡 매니저 처방: ${profile.advice}`;

  const canvas = document.createElement('canvas');
  canvas.width = 820;
  const ctx = canvas.getContext('2d');

  // 텍스트 줄바꿈 사전 계산
  ctx.font = 'bold 19px sans-serif';
  const headlineLines = getWrappedLines(ctx, profile.headline, 460);
  ctx.font = '500 15px sans-serif';
  const commentLines = getWrappedLines(ctx, extraComment, 460);
  const adviceLines = getWrappedLines(ctx, adviceText, 460);

  const verdictHeight = Math.max(
    175,
    36 + headlineLines.length * 26 + 10 + commentLines.length * 22 + 12 + adviceLines.length * 22 + 20
  );
  const metricsTop = 180 + verdictHeight + 36;
  const metricsHeight = 166;
  const resumeSections = lastResult.summarySections || [];
  const summaryTop = metricsTop + metricsHeight + 38;
  const totalSectionRows = resumeSections.reduce((sum, s) => sum + (s.rows ? s.rows.length : 0), 0);
  const summaryHeight = 28 + resumeSections.length * 46 + totalSectionRows * 54;
  ctx.font = '600 12px monospace';
  const codeLines = getWrappedLines(ctx, `CODE: ${lastResult.restoreCode || '-'}`, 560);
  const hashTop = summaryTop + summaryHeight + 24;
  const codeBlockH = Math.max(108, codeLines.length * 18 + 20);
  const cardHeight = hashTop + codeBlockH + 42;

  canvas.height = cardHeight + 60;

  ctx.fillStyle = '#f4f5f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 30, 30, 760, cardHeight, 26);
  ctx.fill();

  // 헤더
  ctx.fillStyle = '#1c2434';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('결정사 모의 판정 리포트', 64, 84);

  ctx.fillStyle = '#5f6673';
  ctx.font = '600 15px sans-serif';
  ctx.fillText(
    `${lastResult.zodiac.emoji} ${lastResult.displayName} · 만 ${lastResult.manAge}세(연 ${lastResult.yearAge}) · ${lastResult.genderLabel} · ${lastResult.region}`,
    64,
    114
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#8b92a0';
  ctx.font = '700 14px sans-serif';
  ctx.fillText(`SCORE ${lastResult.totalScore} / 100`, 756, 84);
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#e3e6ec';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(64, 134);
  ctx.lineTo(756, 134);
  ctx.stroke();

  // 상단 1줄: 좌측 등급 배지 + 우측 피드백/조언
  const tierColors = { S: '#7c3aed', A: '#2563eb', B: '#059669', C: '#d97706', D: '#dc2626' };
  ctx.fillStyle = tierColors[lastResult.baseTier];
  roundRect(ctx, 64, 156, 180, verdictHeight, 18);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('판정 등급', 154, 156 + verdictHeight * 0.25);
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText(lastResult.actualTier, 154, 156 + verdictHeight * 0.62);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(profile.label, 154, 156 + verdictHeight * 0.83);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8f9fb';
  roundRect(ctx, 260, 156, 496, verdictHeight, 18);
  ctx.fill();

  let vy = 188;
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 19px sans-serif';
  headlineLines.forEach((ln) => {
    ctx.fillText(ln, 280, vy);
    vy += 26;
  });

  vy += 6;
  ctx.fillStyle = '#5f6673';
  ctx.font = '500 15px sans-serif';
  commentLines.forEach((ln) => {
    ctx.fillText(ln, 280, vy);
    vy += 22;
  });

  vy += 8;
  ctx.fillStyle = '#1c2434';
  ctx.font = '600 14.5px sans-serif';
  adviceLines.forEach((ln) => {
    ctx.fillText(ln, 280, vy);
    vy += 22;
  });

  // 항목별 등급 · 점수 (원형 게이지 카드)
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('항목별 등급 · 점수', 64, metricsTop - 16);

  const mGap = 10;
  const mCount = lastResult.metrics.length || 5;
  const mCardW = (692 - mGap * (mCount - 1)) / mCount;
  const mCardH = 148;
  lastResult.metrics.forEach((m, idx) => {
    const t = m.tier && m.baseTier ? { tier: m.tier, base: m.baseTier } : resolveSubTier(m.score);
    const mx = 64 + idx * (mCardW + mGap);
    const my = metricsTop;
    const cx = mx + mCardW / 2;
    const cy = my + 48;
    const r = 28;

    ctx.fillStyle = '#f8f9fb';
    roundRect(ctx, mx, my, mCardW, mCardH, 14);
    ctx.fill();
    ctx.strokeStyle = '#e3e6ec';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#e3e7ef';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * m.score) / 100);
    ctx.strokeStyle = tierColors[t.base] || '#1c2434';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = tierColors[t.base] || '#1c2434';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(t.tier, cx, cy + 3);
    ctx.fillStyle = '#5f6673';
    ctx.font = '700 10.5px sans-serif';
    ctx.fillText(`${m.score}점`, cx, cy + 16);

    const mTitle = m.name || m.label.split(' (')[0];
    const mSub = m.sub || (m.label.includes('(') ? m.label.split('(')[1].replace(')', '') : '');
    ctx.fillStyle = '#181c23';
    ctx.font = 'bold 12.5px sans-serif';
    ctx.fillText(mTitle, cx, my + 104);
    ctx.fillStyle = '#5f6673';
    ctx.font = '500 10px sans-serif';
    ctx.fillText(mSub.slice(0, 14), cx, my + 122);
    ctx.textAlign = 'left';
  });

  // 입력 정보 종합 프로필 (다중 열 · 체크박스 · 배지형 이력서)
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('입력 정보 종합 프로필', 64, summaryTop);

  let ry = summaryTop + 18;
  const tableW = 692;
  const rowH = 54;
  resumeSections.forEach((sec) => {
    ctx.strokeStyle = '#1c2434';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, ry);
    ctx.lineTo(64 + tableW, ry);
    ctx.stroke();

    ctx.fillStyle = '#eef1f6';
    ctx.fillRect(64, ry + 1, tableW, 30);
    ctx.fillStyle = '#1c2434';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(sec.title, 76, ry + 20);
    ry += 31;

    (sec.rows || []).forEach((row) => {
      const colW = tableW / row.cols;
      row.cells.forEach((cell, cIdx) => {
        const cx = 64 + cIdx * colW;
        if (cell.highlight) {
          ctx.fillStyle = '#f5f7fc';
          ctx.fillRect(cx, ry, colW, rowH);
        }
        ctx.strokeStyle = '#e3e6ec';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, ry, colW, rowH);

        ctx.fillStyle = '#5f6673';
        ctx.font = '700 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(cell.key, cx + 12, ry + 19);

        let curX = cx + 12;
        const valY = ry + 40;
        if (cell.checks) {
          cell.checks.forEach((chk) => {
            ctx.strokeStyle = chk.checked ? '#1c2434' : '#9aa1ae';
            ctx.lineWidth = 1.5;
            roundRect(ctx, curX, valY - 11, 13, 13, 3);
            if (chk.checked) {
              ctx.fillStyle = '#1c2434';
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('✓', curX + 6.5, valY - 1);
            } else {
              ctx.stroke();
            }
            ctx.textAlign = 'left';
            ctx.fillStyle = chk.checked ? '#181c23' : '#6c7382';
            ctx.font = chk.checked ? '700 12.5px sans-serif' : '500 12.5px sans-serif';
            ctx.fillText(chk.label, curX + 18, valY);
            curX += 18 + ctx.measureText(chk.label).width + 12;
          });
        }
        if (cell.val) {
          ctx.fillStyle = '#181c23';
          ctx.font = '700 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(cell.val, curX, valY);
          curX += ctx.measureText(cell.val).width + 8;
        }
        if (cell.badge) {
          const badgeBg = cell.badgeTone === 'good' ? '#e8f7ef' : cell.badgeTone === 'warn' ? '#fef3c7' : '#fee2e2';
          const badgeFg = cell.badgeTone === 'good' ? '#059669' : cell.badgeTone === 'warn' ? '#b45309' : '#dc2626';
          ctx.font = 'bold 11px sans-serif';
          const bw = ctx.measureText(cell.badge).width + 14;
          ctx.fillStyle = badgeBg;
          roundRect(ctx, curX, valY - 13, bw, 18, 9);
          ctx.fill();
          ctx.fillStyle = badgeFg;
          ctx.fillText(cell.badge, curX + 7, valY);
        }
      });
      ry += rowH;
    });

    ry += 14;
  });

  const qrDrawn = drawQrToCanvas(ctx, getQrPayload(lastResult.restoreCode || '-'), 64, hashTop - 12, 104);
  const codeStartX = qrDrawn ? 186 : 64;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1c2434';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('결과코드 (QR 스캔 복원 가능)', codeStartX, hashTop + 4);
  ctx.fillStyle = '#5f6673';
  ctx.font = '600 12px monospace';
  codeLines.forEach((ln, idx) => {
    ctx.fillText(ln, codeStartX, hashTop + 26 + idx * 18);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8b92a0';
  ctx.font = '500 14px sans-serif';
  ctx.fillText('나도 측정해보기 · 연애등급측정기', 410, cardHeight + 6);

  const link = document.createElement('a');
  link.download = `연애등급측정기_결과_${lastResult.actualTier}등급.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('결과 카드 전체 이미지를 저장했습니다!');
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

// 결과코드 복사 & 공유 & QR 모달
const qrModal = document.getElementById('qr-modal');
const qrModalCanvas = document.getElementById('qr-modal-canvas');
const btnOpenQrModal = document.getElementById('btn-open-qr-modal');
const btnCloseQrModal = document.getElementById('btn-close-qr-modal');
const qrModalBackdrop = document.getElementById('qr-modal-backdrop');
const btnSaveQrImg = document.getElementById('btn-save-qr-img');

function openQrModal() {
  if (!lastResult || !lastResult.restoreCode || !qrModal || !qrModalCanvas) return;
  const ctx = qrModalCanvas.getContext('2d');
  drawQrToCanvas(ctx, getQrPayload(lastResult.restoreCode), 0, 0, qrModalCanvas.width);
  qrModal.classList.add('open');
  qrModal.setAttribute('aria-hidden', 'false');
}

function closeQrModal() {
  if (!qrModal) return;
  qrModal.classList.remove('open');
  qrModal.setAttribute('aria-hidden', 'true');
}

if (btnOpenQrModal) btnOpenQrModal.addEventListener('click', openQrModal);
if (btnCloseQrModal) btnCloseQrModal.addEventListener('click', closeQrModal);
if (qrModalBackdrop) qrModalBackdrop.addEventListener('click', closeQrModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && qrModal && qrModal.classList.contains('open')) {
    closeQrModal();
  }
});

if (btnSaveQrImg) {
  btnSaveQrImg.addEventListener('click', () => {
    if (!lastResult || !lastResult.restoreCode) return;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 440;
    outCanvas.height = 490;
    const oCtx = outCanvas.getContext('2d');
    oCtx.fillStyle = '#ffffff';
    oCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    drawQrToCanvas(oCtx, getQrPayload(lastResult.restoreCode), 40, 32, 360);

    oCtx.textAlign = 'center';
    oCtx.fillStyle = '#1c2434';
    oCtx.font = 'bold 16px sans-serif';
    oCtx.fillText(`연애등급측정기 · ${lastResult.displayName} (${lastResult.actualTier}등급)`, 220, 424);
    oCtx.fillStyle = '#5f6673';
    oCtx.font = '500 13px sans-serif';
    oCtx.fillText('QR 스캔으로 결과 화면 바로 복원', 220, 450);

    const link = document.createElement('a');
    link.download = `연애등급측정기_QR_${lastResult.actualTier}등급.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
    showToast('QR 코드 이미지를 저장했습니다!');
  });
}

document.getElementById('btn-copy-restore').addEventListener('click', async () => {
  if (!lastResult || !lastResult.restoreCode) return;
  try {
    await navigator.clipboard.writeText(lastResult.restoreCode);
    showToast('결과코드가 복사되었습니다!');
  } catch {
    showToast('복사에 실패했습니다. 브라우저 권한을 확인해 주세요.');
  }
});

document.getElementById('btn-share-kakao').addEventListener('click', async () => {
  if (!lastResult || !lastResult.restoreCode) return;
  const shareText = `[연애등급측정기 - ${lastResult.displayName}]\n판정 결과: ${lastResult.actualTier}등급 (${lastResult.totalScore}점)\n\n결과코드:\n${lastResult.restoreCode}\n\n${window.location.href}`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: '연애등급측정기 결과코드',
        text: shareText
      });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(shareText);
    showToast('공유할 수 있도록 결과코드가 복사되었습니다!');
  } catch {
    showToast('공유에 실패했습니다. 복사 버튼을 이용해 주세요.');
  }
});

// 인트로 화면 복원 코드 불러오기
const btnToggleRestore = document.getElementById('btn-toggle-restore');
const restorePanel = document.getElementById('restore-code-panel');
const inputRestoreCode = document.getElementById('input-restore-code');
const btnApplyRestore = document.getElementById('btn-apply-restore');
const restoreError = document.getElementById('restore-error');

if (btnToggleRestore && restorePanel) {
  btnToggleRestore.addEventListener('click', () => {
    const isHidden = restorePanel.style.display === 'none';
    restorePanel.style.display = isHidden ? 'block' : 'none';
    if (isHidden && inputRestoreCode) inputRestoreCode.focus();
  });
}

if (btnApplyRestore && inputRestoreCode) {
  btnApplyRestore.addEventListener('click', () => {
    const decoded = decodeResultCode(inputRestoreCode.value);
    if (!decoded) {
      restoreError.textContent = '유효하지 않은 복원 코드입니다. (LTM1.으로 시작하는 전체 코드를 확인해 주세요)';
      return;
    }
    restoreError.textContent = '';
    state.answers = decoded;
    state.currentStep = QUESTIONS.length - 1;
    const result = evaluateResult();
    renderResult(result);
    showScreen('result', true);
    showToast('복원 코드로 결과를 불러왔습니다!');
  });
}

// 결과 텍스트 + URL 복사
document.getElementById('btn-copy-link').addEventListener('click', async () => {
  if (!lastResult) return;
  const text = `[연애등급측정기 - ${lastResult.displayName}]\n판정 결과: ${lastResult.actualTier}등급 · ${TIER_PROFILES[lastResult.baseTier].label} (${lastResult.totalScore}점)\n${TIER_PROFILES[lastResult.baseTier].headline}\n결과코드: ${lastResult.restoreCode || '-'}\n${window.location.href}`;
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

// 전체 초기화 및 복원
function resetAllData() {
  clearLifeTimer();
  state.currentStep = 0;
  state.answers = createDefaultAnswers();
  lastResult = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
  showScreen('intro');
  showToast('모든 입력 데이터가 초기화되었습니다.');
}

document.getElementById('btn-reset-all').addEventListener('click', resetAllData);
document.getElementById('btn-retry').addEventListener('click', resetAllData);

function restoreAppState() {
  try {
    const urlCode = new URLSearchParams(window.location.search).get('code');
    if (urlCode) {
      const decodedFromUrl = decodeResultCode(urlCode);
      if (decodedFromUrl) {
        state.answers = decodedFromUrl;
        state.currentStep = QUESTIONS.length - 1;
        const result = evaluateResult();
        renderResult(result);
        showScreen('result', false);
        history.replaceState({ screen: 'result', step: state.currentStep }, '');
        showToast('QR 결과코드로 결과를 불러왔습니다!');
        return;
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return;

    const defaults = createDefaultAnswers();
    const mergedAnswers = { ...defaults, ...(saved.answers || {}) };
    mergedAnswers.mbti = { ...defaults.mbti, ...((saved.answers && saved.answers.mbti) || {}) };
    state.answers = mergedAnswers;

    const step = Number(saved.currentStep);
    state.currentStep = Number.isFinite(step) ? Math.max(0, Math.min(QUESTIONS.length - 1, step)) : 0;

    if (saved.screen === 'result' && saved.lastResult) {
      renderResult(saved.lastResult);
      showScreen('result', false);
      history.replaceState({ screen: 'result', step: state.currentStep }, '');
    } else if (saved.screen === 'quiz') {
      showScreen('quiz', false);
      renderQuestion();
      history.replaceState({ screen: 'quiz', step: state.currentStep }, '');
    }
  } catch {
    // 손상된 로컬 데이터 무시
  }
}

restoreAppState();

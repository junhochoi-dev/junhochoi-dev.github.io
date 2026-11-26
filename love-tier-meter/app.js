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
  if (name !== 'quiz') clearLifeTimer();
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
  const q = QUESTIONS[state.currentStep];
  const total = QUESTIONS.length;
  const percent = Math.round(((state.currentStep + 1) / total) * 100);
  progressText.textContent = `${state.currentStep + 1} / ${total} (${percent}%)`;
  progressFill.style.width = `${percent}%`;
  saveAppState();

  if (q.type === 'profile') return renderProfileStep(q);
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
    unknownTime,
    bloodType,
    mbti,
    region
  } = state.answers;

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 18;
  const mbtiStr = getMbtiString(mbti);

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

      <div>
        <span class="field-label">현재 거주 지역</span>
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

  const nameEl = document.getElementById('input-name');
  const chkPrivateEl = document.getElementById('chk-private-name');
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

  quizBody.querySelectorAll('[data-blood]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.answers.bloodType = btn.dataset.blood;
      quizBody.querySelectorAll('[data-blood]').forEach((b) => {
        const active = b.dataset.blood === state.answers.bloodType;
        b.classList.toggle('selected', active);
        b.querySelector('.option-check').textContent = active ? '✓' : '';
      });
      errorEl.textContent = '';
      saveAppState();
    });
  });

  quizBody.querySelectorAll('[data-mbti-axis]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const axis = btn.dataset.mbtiAxis;
      const code = btn.dataset.mbtiCode;
      state.answers.mbti[axis] = code;
      saveAppState();
      renderProfileStep(q);
    });
  });

  chkUnknownEl.addEventListener('change', () => {
    state.answers.unknownTime = chkUnknownEl.checked;
    timeWrapEl.style.display = state.answers.unknownTime ? 'none' : 'grid';
    updateLifeCounter();
  });

  regionEl.addEventListener('change', () => {
    state.answers.region = regionEl.value;
    saveAppState();
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

function computeResultHash(payload) {
  const str = JSON.stringify(payload);
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  return seeds
    .map((seed, sIdx) => {
      let h = seed >>> 0;
      for (let i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i) + sIdx * 31;
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      return h.toString(16).padStart(8, '0').toUpperCase();
    })
    .join('');
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

  // 지표 1: 자산 · 스펙
  const rawAssetSpec =
    heightSpec + bmiSpec + eduSpec + empOpt.spec + salarySpec + (houseOpt.spec - costPenalty) + savingsSpec + carOpt.spec + ageScore;
  const assetSpecPercent = Math.max(10, Math.min(100, Math.round((rawAssetSpec / 119) * 100)));

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
      Math.round(assetSpecPercent * 0.48 + selfcarePercent * 0.24 + lovePercent * 0.16 + metaPercent * 0.12 - hurdlePenalty * 0.4)
    )
  );

  const tierObj = resolveSubTier(totalScore);
  const mbtiStr = getMbtiString(a.mbti) || '-';

  const summaryItems = [
    { key: '이름', val: `${displayName}${a.isNamePrivate ? ' (비공개)' : ''}` },
    { key: '혈액형 · MBTI', val: `${a.bloodType || '-'} · ${mbtiStr}` },
    { key: '거주지', val: a.region },
    { key: '신체 · BMI', val: `${h}cm · ${w}kg (${bmi.toFixed(1)} · ${getBmiCategory(bmi)})` },
    { key: '최종 학력', val: tierOpt ? `${degOpt.label} (${tierOpt.label.split(' ')[0]})` : degOpt.label },
    { key: '고용 형태', val: empOpt.label },
    { key: '소득 (세전 / 월 실수령)', val: `${formatManwonKorean(grossSalary)} / 월 ${formatManwonKorean(monthlyNet)}` },
    { key: '부동산 · 주거비', val: `${houseOpt.label} (월 ${houseCost}만원)` },
    { key: '순 금융자산', val: formatManwonKorean(netFinancial) },
    { key: '자차 소유', val: hasCar ? carOpt.label : '없음', checkbox: true, checked: hasCar },
    { key: '운동 습관', val: isNoExercise ? freqOpt.label : `${freqOpt.label} · ${durOpt.label} (${yrsOpt.label})` },
    { key: '흡연 · 음주', val: `${smkOpt.label} · ${drkOpt.label}` },
    { key: '식단 · 종교', val: `${dietOpt.label.split(' ')[0]} · ${relOpt.label.split(' ')[0]}` },
    { key: '연애 이력', val: isNoDating ? dcOpt.label : `${dcOpt.label} (최장 ${dlOpt.label})` }
  ];

  const metrics = [
    { label: '자산 · 스펙 (부동산·저축·소득·피지컬)', score: assetSpecPercent },
    { label: '자기관리 · 생활 (운동·흡연·음주·식단)', score: selfcarePercent },
    { label: '연애 이력 (경험·최장기간)', score: lovePercent },
    { label: '메타인지 (눈높이 균형)', score: metaPercent }
  ];

  const resultHash = computeResultHash({
    answers: a,
    totalScore,
    actualTier: tierObj.tier,
    metrics
  });

  return {
    displayName,
    genderLabel: a.gender === 'male' ? '👨 남성' : '👩 여성',
    manAge,
    yearAge,
    zodiac,
    region: a.region,
    actualTier: tierObj.tier,
    baseTier: tierObj.base,
    totalScore,
    hurdleTags,
    eyePenalty,
    summaryItems,
    metrics,
    resultHash
  };
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

  const summarySheetEl = document.getElementById('res-summary-sheet');
  summarySheetEl.innerHTML = res.summaryItems
    .map((item) => {
      const valHtml = item.checkbox
        ? `<span class="resume-check ${item.checked ? 'checked' : ''}">${item.checked ? '✓' : ''}</span><span>${item.val}</span>`
        : item.val;
      return `
      <div class="summary-item">
        <span class="summary-key">${item.key}</span>
        <span class="summary-val">${valHtml}</span>
      </div>
    `;
    })
    .join('');

  const hashEl = document.getElementById('res-hash-value');
  if (hashEl) {
    const hash = res.resultHash || computeResultHash({ totalScore: res.totalScore, actualTier: res.actualTier, metrics: res.metrics, summaryItems: res.summaryItems });
    res.resultHash = hash;
    hashEl.textContent = hash;
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
  const metricsHeight = lastResult.metrics.length * 56;
  const summaryRows = Math.ceil(lastResult.summaryItems.length / 2);
  const summaryTop = metricsTop + metricsHeight + 38;
  const summaryHeight = summaryRows * 42 + 44;
  const hashTop = summaryTop + summaryHeight + 24;
  const cardHeight = hashTop + 72;

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

  // 항목별 평가 점수
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('항목별 평가 점수', 64, metricsTop - 16);

  let my = metricsTop + 8;
  lastResult.metrics.forEach((m) => {
    ctx.fillStyle = '#181c23';
    ctx.font = '600 14.5px sans-serif';
    ctx.fillText(m.label, 64, my);
    ctx.textAlign = 'right';
    ctx.fillText(`${m.score}점`, 756, my);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#ebeef3';
    roundRect(ctx, 64, my + 10, 692, 10, 5);
    ctx.fill();

    ctx.fillStyle = '#1c2434';
    roundRect(ctx, 64, my + 10, (692 * m.score) / 100, 10, 5);
    ctx.fill();
    my += 54;
  });

  // 입력 정보 종합 프로필 (이력서 스타일)
  ctx.fillStyle = '#181c23';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('입력 정보 종합 프로필', 64, summaryTop);

  ctx.strokeStyle = '#1c2434';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, summaryTop + 14);
  ctx.lineTo(756, summaryTop + 14);
  ctx.stroke();

  const colW = 334;
  const colGap = 24;
  lastResult.summaryItems.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 64 + col * (colW + colGap);
    const y = summaryTop + 44 + row * 42;

    ctx.fillStyle = '#5f6673';
    ctx.font = '600 13.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.key, x, y);

    ctx.fillStyle = '#181c23';
    ctx.font = '700 13.5px sans-serif';
    ctx.textAlign = 'right';
    if (item.checkbox) {
      const textW = ctx.measureText(item.val).width;
      const boxX = x + colW - textW - 22;
      const boxY = y - 12;
      ctx.strokeStyle = item.checked ? '#1c2434' : '#9aa1ae';
      ctx.lineWidth = 1.5;
      roundRect(ctx, boxX, boxY, 15, 15, 3);
      if (item.checked) {
        ctx.fillStyle = '#1c2434';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', boxX + 7.5, boxY + 12);
        ctx.fillStyle = '#181c23';
        ctx.font = '700 13.5px sans-serif';
        ctx.textAlign = 'right';
      } else {
        ctx.stroke();
      }
      ctx.fillText(item.val, x + colW, y);
    } else {
      ctx.fillText(item.val, x + colW, y);
    }

    ctx.strokeStyle = '#e3e6ec';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + colW, y + 12);
    ctx.stroke();
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#5f6673';
  ctx.font = '600 12.5px monospace';
  ctx.fillText(`HASH: ${lastResult.resultHash || '-'}`, 64, hashTop);

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

// 결과 해시 복사
document.getElementById('btn-copy-hash').addEventListener('click', async () => {
  if (!lastResult || !lastResult.resultHash) return;
  try {
    await navigator.clipboard.writeText(lastResult.resultHash);
    showToast('결과 해시값이 복사되었습니다!');
  } catch {
    showToast('복사에 실패했습니다. 브라우저 권한을 확인해 주세요.');
  }
});

// 결과 텍스트 + URL 복사
document.getElementById('btn-copy-link').addEventListener('click', async () => {
  if (!lastResult) return;
  const text = `[연애등급측정기 - ${lastResult.displayName}]\n판정 결과: ${lastResult.actualTier}등급 · ${TIER_PROFILES[lastResult.baseTier].label} (${lastResult.totalScore}점)\n${TIER_PROFILES[lastResult.baseTier].headline}\nHASH: ${lastResult.resultHash || '-'}\n${window.location.href}`;
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
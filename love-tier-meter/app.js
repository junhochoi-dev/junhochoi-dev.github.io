// 연애등급측정기 앱 상태 및 판정 엔진

const state = {
  currentStep: 0,
  answers: {
    gender: null,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    heightCm: '',
    weightKg: '',
    educationDegree: null,
    educationTier: null,
    employmentType: null,
    salaryManwon: '',
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
  const percent = Math.round(((state.currentStep + 1) / total) * 100);
  progressText.textContent = `${state.currentStep + 1} / ${total} (${percent}%)`;
  progressFill.style.width = `${percent}%`;

  if (q.type === 'profile') {
    renderProfileStep(q);
    return;
  }

  if (q.type === 'body') {
    renderBodyStep(q);
    return;
  }

  if (q.type === 'education') {
    renderEducationStep(q);
    return;
  }

  if (q.type === 'job') {
    renderJobStep(q);
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

function getBmiCategory(bmi) {
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '표준';
  if (bmi < 25) return '과체중 전단계';
  if (bmi < 30) return '과체중';
  return '고도비만';
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
            <input id="input-height" class="salary-input" type="number" inputmode="decimal" placeholder="175" value="${heightCm}" />
            <span class="salary-unit">cm</span>
          </div>
        </div>
        <div>
          <span class="field-label">몸무게</span>
          <div class="salary-input-wrap">
            <input id="input-weight" class="salary-input" type="number" inputmode="decimal" placeholder="68" value="${weightKg}" />
            <span class="salary-unit">kg</span>
          </div>
        </div>
      </div>

      <div id="body-preview" class="age-preview" style="display:none;"></div>
      <div id="body-error" class="error-msg"></div>

      <button type="button" id="btn-body-next" class="btn-primary">다음 문항으로</button>
    </div>
  `;

  const heightEl = document.getElementById('input-height');
  const weightEl = document.getElementById('input-weight');
  const previewEl = document.getElementById('body-preview');
  const errorEl = document.getElementById('body-error');

  function updateBodyPreview() {
    state.answers.heightCm = heightEl.value.trim();
    state.answers.weightKg = weightEl.value.trim();
    const h = Number(state.answers.heightCm);
    const w = Number(state.answers.weightKg);
    if (h >= 120 && h <= 230 && w >= 30 && w <= 220) {
      const bmi = w / ((h / 100) * (h / 100));
      previewEl.style.display = 'block';
      previewEl.textContent = `${h}cm · ${w}kg (BMI ${bmi.toFixed(1)} · ${getBmiCategory(bmi)})`;
      errorEl.textContent = '';
    } else {
      previewEl.style.display = 'none';
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
}

function renderEducationStep(q) {
  const { educationDegree, educationTier } = state.answers;
  const selectedDegreeObj = educationDegree !== null ? q.degreeOptions[educationDegree] : null;
  const showTier = Boolean(selectedDegreeObj && selectedDegreeObj.needsTier);
  const canProceed =
    educationDegree !== null && (!showTier || educationTier !== null);

  quizBody.innerHTML = `
    <span class="q-step-badge">${q.stepTitle}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-desc">${q.desc}</p>
    <div class="profile-form">
      <div>
        <span class="field-label">최종 학력</span>
        <div class="employment-grid">
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
        <span class="field-label">출신 대학 구간 (학부 기준)</span>
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
      <button type="button" id="btn-edu-next" class="btn-primary" ${canProceed ? '' : 'disabled'}>다음 문항으로</button>
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
      document.getElementById('edu-error').textContent = '출신 대학 구간을 선택해 주세요.';
      return;
    }
    goNextStep();
  });
}

function formatSalaryKorean(manwon) {
  if (manwon === 0) return '연 소득 0원 (무소득)';
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `세전 연 ${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `세전 연 ${eok}억원`;
  return `세전 연 ${manwon.toLocaleString()}만원`;
}

function renderJobStep(q) {
  const { employmentType, salaryManwon } = state.answers;
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
          <input id="input-salary" class="salary-input" type="number" inputmode="numeric" min="0" placeholder="예: 4500" value="${salaryManwon}" />
          <span class="salary-unit">만원</span>
        </div>
        <p class="field-memo">※ 성과금·인센티브·각종 수당 등을 제외한 <strong>순 계약 연봉(기본급)</strong>만 입력해 주세요. (소득이 없으면 0 입력)</p>
      </div>

      <div id="salary-preview" class="age-preview" style="display:none;"></div>
      <div id="job-error" class="error-msg"></div>

      <button type="button" id="btn-job-next" class="btn-primary">다음 문항으로</button>
    </div>
  `;

  const salaryEl = document.getElementById('input-salary');
  const previewEl = document.getElementById('salary-preview');
  const errorEl = document.getElementById('job-error');

  function updateSalaryPreview() {
    const raw = salaryEl.value.trim();
    state.answers.salaryManwon = raw;
    if (raw === '' || Number.isNaN(Number(raw)) || Number(raw) < 0) {
      previewEl.style.display = 'none';
      return;
    }
    const val = Math.floor(Number(raw));
    previewEl.style.display = 'block';
    previewEl.textContent = `${formatSalaryKorean(val)} 기준으로 반영됩니다.`;
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
      if (q.employmentOptions[idx].zeroSalaryDefault && salaryEl.value.trim() === '') {
        salaryEl.value = '0';
        updateSalaryPreview();
      }
      errorEl.textContent = '';
    });
  });

  salaryEl.addEventListener('input', updateSalaryPreview);
  updateSalaryPreview();

  document.getElementById('btn-job-next').addEventListener('click', () => {
    if (state.answers.employmentType === null) {
      errorEl.textContent = '고용 형태를 선택해 주세요.';
      return;
    }
    const raw = salaryEl.value.trim();
    const num = Number(raw);
    if (raw === '' || Number.isNaN(num) || num < 0 || num > 1000000) {
      errorEl.textContent = '순 계약 연봉을 만원 단위 숫자로 입력해 주세요. (0 이상)';
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
function getQuestionById(id) {
  return QUESTIONS.find((q) => q.id === id);
}

function evaluateResult() {
  const {
    gender,
    birthYear,
    birthMonth,
    birthDay,
    heightCm,
    weightKg,
    educationDegree,
    educationTier,
    employmentType,
    salaryManwon,
    housing,
    appearance,
    lifestyle,
    spending,
    communication,
    standard
  } = state.answers;
  const { age, zodiac } = calculateAgeAndZodiac(Number(birthYear), Number(birthMonth), Number(birthDay));

  const h = Number(heightCm);
  const w = Number(weightKg);
  const bmi = w / ((h / 100) * (h / 100));

  let heightSpec = 4;
  let heightAppeal = 3;
  if (gender === 'male') {
    if (h >= 178) { heightSpec = 8; heightAppeal = 6; }
    else if (h >= 174) { heightSpec = 6; heightAppeal = 5; }
    else if (h >= 170) { heightSpec = 4; heightAppeal = 3; }
    else { heightSpec = 1; heightAppeal = 1; }
  } else {
    if (h >= 160 && h <= 168) { heightSpec = 8; heightAppeal = 6; }
    else if ((h >= 155 && h < 160) || (h > 168 && h <= 173)) { heightSpec = 6; heightAppeal = 4; }
    else { heightSpec = 4; heightAppeal = 3; }
  }

  let bmiSpec = 2;
  let bmiAppeal = 1;
  if (bmi >= 18.5 && bmi <= 23.9) { bmiSpec = 6; bmiAppeal = 5; }
  else if ((bmi >= 24.0 && bmi <= 25.9) || (bmi >= 17.5 && bmi < 18.5)) { bmiSpec = 4; bmiAppeal = 3; }
  else if (bmi >= 29.0) { bmiSpec = 0; bmiAppeal = -1; }

  const bodySpec = heightSpec + bmiSpec;
  const bodyAppeal = heightAppeal + bmiAppeal;

  const eduQ = getQuestionById('education');
  const degOpt = eduQ.degreeOptions[educationDegree];
  const tierOpt = degOpt.needsTier && educationTier !== null ? eduQ.tierOptions[educationTier] : { spec: 0, appeal: 0 };
  const eduSpec = degOpt.spec + tierOpt.spec;
  const eduAppeal = degOpt.appeal + tierOpt.appeal;
  const empOpt = getQuestionById('job').employmentOptions[employmentType];
  const salary = Number(salaryManwon) || 0;
  let salarySpec = 2;
  let salaryAppeal = 1;
  if (salary >= 10000) {
    salarySpec = 18;
    salaryAppeal = 7;
  } else if (salary >= 7000) {
    salarySpec = 15;
    salaryAppeal = 6;
  } else if (salary >= 5000) {
    salarySpec = 12;
    salaryAppeal = 5;
  } else if (salary >= 3500) {
    salarySpec = 8;
    salaryAppeal = 3;
  } else if (salary >= 2000) {
    salarySpec = 5;
    salaryAppeal = 2;
  }

  const housingOpt = getQuestionById('housing').options[housing];
  const appOpt = getQuestionById('appearance').options[appearance];
  const spendOpt = getQuestionById('spending').options[spending];
  const commOpt = getQuestionById('communication').options[communication];
  const stdOpt = getQuestionById('standard').options[standard];

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

  // 2) 현실 스펙 (피지컬 + 학력 + 고용형태 + 연봉 + 주거 + 외모일부 + 나이) -> 100점 환산
  const rawSpec = bodySpec + eduSpec + empOpt.spec + salarySpec + housingOpt.spec + appOpt.spec + ageScore; // max ~110
  const specPercent = Math.min(100, Math.round((rawSpec / 110) * 100));

  // 3) 연애 성향 (소비관 + 소통) -> 100점 환산
  const rawLove = spendOpt.love + commOpt.love; // max 34
  const lovePercent = Math.max(10, Math.min(100, Math.round((rawLove / 34) * 100)));

  // 4) 생활 허들 페널티
  const lifestyleOpts = getQuestionById('lifestyle').options;
  let hurdlePenalty = 0;
  const hurdleTags = [];
  lifestyle.forEach((idx) => {
    const opt = lifestyleOpts[idx];
    hurdlePenalty += opt.penalty || 0;
    if (opt.tag) hurdleTags.push(opt.tag);
  });

  // 5) 시장 호감도 -> 100점 환산
  const rawAppeal = bodyAppeal + eduAppeal + empOpt.appeal + salaryAppeal + housingOpt.appeal + appOpt.appeal + spendOpt.appeal + commOpt.appeal - hurdlePenalty * 0.8;
  const appealPercent = Math.max(10, Math.min(100, Math.round(((rawAppeal + 6) / 75) * 100)));

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
    actualTier,
    totalScore,
    hurdleTags,
    eyePenalty,
    metrics: [
      { label: '현실 스펙 (피지컬·학력·직업·자산)', score: specPercent },
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

  // 판정 등급 히어로 박스
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
  const text = `[연애등급측정기]\n판정 결과: ${lastResult.actualTier}등급 · ${TIER_PROFILES[lastResult.actualTier].label} (${lastResult.totalScore}점)\n${TIER_PROFILES[lastResult.actualTier].headline}\n${window.location.href}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast('결과가 클립보드에 복사되었습니다!');
  } catch {
    showToast('복사에 실패했습니다. 브라우저 권한을 확인해 주세요.');
  }
});

// 다시 하기
document.getElementById('btn-retry').addEventListener('click', () => {
  state.currentStep = 0;
  state.answers = {
    gender: null,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    heightCm: '',
    weightKg: '',
    educationDegree: null,
    educationTier: null,
    employmentType: null,
    salaryManwon: '',
    housing: null,
    appearance: null,
    lifestyle: [],
    spending: null,
    communication: null,
    standard: null
  };
  showScreen('intro');
});

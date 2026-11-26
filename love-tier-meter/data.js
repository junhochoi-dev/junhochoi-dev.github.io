// 문항 및 등급 판정 데이터

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D'];

const TIER_PROFILES = {
  S: {
    minScore: 90,
    label: '상위 5% 유니콘 매물',
    headline: '“매니저가 먼저 모시러 가는 1순위 프로필입니다.”',
    comment: '현실적인 스펙과 연애 성향, 시장 내 호감도가 모두 최상위권입니다. 까다로운 조건을 걸어도 매칭 대기열이 길게 늘어서는 타입입니다.',
    advice: '이미 경쟁력이 충분합니다. 단, 완벽한 조건만 찾다가 타이밍을 놓치지 않도록 ‘대화가 통하는 사람’에 가중치를 두어 보세요.'
  },
  A: {
    minScore: 76,
    label: '1군 인기 매물',
    headline: '“결정사 등록 즉시 소개 요청이 쏟아질 타입입니다.”',
    comment: '안정적인 기반과 균형 잡힌 연애관을 갖추고 있어 호불호 없이 폭넓게 사랑받는 스펙입니다. 현실 감각도 좋은 편입니다.',
    advice: '현재 강점을 유지하면서, 첫 만남에서 유연하고 여유 있는 태도를 보여주면 S등급 못지않은 매칭 결과를 얻을 수 있습니다.'
  },
  B: {
    minScore: 60,
    label: '무난한 호감형',
    headline: '“조건은 나쁘지 않은데, 한 끗 포인트가 아쉽네요.”',
    comment: '대체로 무난하고 성실한 인상을 주지만, 경쟁이 치열한 결정사 시장에서는 뚜렷한 매력 포인트나 조건 조율이 필요할 수 있습니다.',
    advice: '자기관리나 소통 스타일 중 한 가지만 확실히 끌어올려도 A등급 매칭 풀에 충분히 진입할 수 있습니다.'
  },
  C: {
    minScore: 44,
    label: '조건 조율 필요',
    headline: '“내 스펙 대비 눈높이나 허들을 점검해 볼 시점입니다.”',
    comment: '본인의 장점은 있지만, 생활 습관 허들이나 상대에게 바라는 기준 때문에 실제 매칭 가능한 풀(Pool)이 좁아진 상태입니다.',
    advice: '‘절대 포기 못 하는 조건’을 딱 2가지만 남기고 나머지는 열어두면 소개 성공률이 크게 올라갑니다.'
  },
  D: {
    minScore: 0,
    label: '매니저 비상 호출',
    headline: '“솔직히 말씀드리면, 이 조건으론 매칭이 어렵습니다.”',
    comment: '결정사 시스템은 냉정합니다. 현재 스펙 대비 요구 조건이 높거나, 상대방 입장에서 부담스러워할 만한 생활·연애 허들이 겹쳐 있습니다.',
    advice: '당장 눈높이를 낮추기보다, 통제 가능한 요소(자기관리·소비습관·소통 태도)부터 하나씩 리셋해 보시는 걸 추천합니다.'
  }
};

const QUESTIONS = [
  {
    id: 'profile',
    stepTitle: '기본 프로필',
    title: '성별과 생년월일을 알려주세요',
    desc: '만 나이를 자동 계산해 결정사 시장 연령 가중치에 반영합니다.',
    type: 'profile'
  },
  {
    id: 'body',
    stepTitle: '신체 조건',
    title: '키와 몸무게를 알려주세요',
    desc: '성별 기준 키와 BMI 균형도를 피지컬 지표에 반영합니다.',
    type: 'body'
  },
  {
    id: 'education',
    stepTitle: '학력',
    title: '최종 학력을 알려주세요',
    desc: '4년제 대졸 이상인 경우 출신 대학 구간도 함께 선택합니다.',
    type: 'education',
    degreeOptions: [
      { label: '중졸 이하', spec: 1, appeal: 0, needsTier: false },
      { label: '고졸', spec: 2, appeal: 1, needsTier: false },
      { label: '전문대졸', spec: 4, appeal: 2, needsTier: false },
      { label: '4년제 대졸', spec: 6, appeal: 3, needsTier: true },
      { label: '석사', spec: 8, appeal: 4, needsTier: true },
      { label: '박사', spec: 9, appeal: 4, needsTier: true }
    ],
    tierOptions: [
      { label: '최상위권 (SKY · 카포 · 의약학 · 해외 명문)', spec: 6, appeal: 3 },
      { label: '인서울 주요대 · 상위 거점국립대', spec: 4, appeal: 2 },
      { label: '일반 4년제 대학 (수도권 · 지방)', spec: 2, appeal: 1 },
      { label: '방통대 · 사이버대 · 학점은행 등', spec: 1, appeal: 0 }
    ]
  },
  {
    id: 'job',
    stepTitle: '직업 · 소득',
    title: '고용 형태와 순 계약 연봉을 알려주세요',
    desc: '고용 안정성과 순수 기본급 기준으로 현실 스펙을 평가합니다.',
    type: 'job',
    employmentOptions: [
      { label: '정규직 (일반 기업)', spec: 10, appeal: 6 },
      { label: '공무원 · 공기업 · 교직원', spec: 12, appeal: 7 },
      { label: '전문직 (의·약·법조·회계 등)', spec: 14, appeal: 8 },
      { label: '계약직 · 파견직 · 프리랜서', spec: 5, appeal: 3 },
      { label: '개인사업 · 자영업', spec: 7, appeal: 4 },
      { label: '취준생 · 학생 · 무직', spec: 2, appeal: 1, zeroSalaryDefault: true }
    ]
  },
  {
    id: 'housing',
    stepTitle: '현실 스펙',
    title: '현재 주거 및 자산 상태는 어느 쪽에 가깝나요?',
    desc: '실제 결혼 준비 가능성을 가늠하는 항목입니다.',
    type: 'single',
    options: [
      { label: '자가 보유 또는 넉넉한 자산 기반 있음', spec: 22, appeal: 6 },
      { label: '안정적인 전세 / 대출 부담 적은 독립 거주', spec: 17, appeal: 5 },
      { label: '월세 자취 중 (모아둔 자산은 보통)', spec: 11, appeal: 4 },
      { label: '부모님 댁 거주 / 아직 모아둔 자산이 적음', spec: 6, appeal: 2 }
    ]
  },
  {
    id: 'appearance',
    stepTitle: '첫인상',
    title: '외모 및 평소 자기관리 수준은 어떤가요?',
    desc: '객관적으로 주변에서 듣는 평가를 떠올려 보세요.',
    type: 'single',
    options: [
      { label: '어딜 가든 외모·피지컬 칭찬을 자주 듣는다', spec: 12, appeal: 16 },
      { label: '깔끔한 호감형이고 꾸준히 운동·관리를 한다', spec: 9, appeal: 13 },
      { label: '평범하고 무난한 인상이다', spec: 6, appeal: 8 },
      { label: '외모나 패션 관리에 크게 신경 쓰지 않는다', spec: 2, appeal: 3 }
    ]
  },
  {
    id: 'lifestyle',
    stepTitle: '매칭 난이도',
    title: '본인에게 해당하는 생활·가치관 요소를 모두 골라주세요',
    desc: '특정 조건이 겹칠수록 실제 매칭 가능한 상대 풀(Pool)이 줄어듭니다.',
    type: 'multi',
    options: [
      { label: '엄격한 식단 고집 (채식 · 비건 · 심한 편식 등)', penalty: 9, tag: '식단 허들' },
      { label: '흡연', penalty: 8, tag: '흡연' },
      { label: '상대도 맞춰야 하는 강한 종교적 신념', penalty: 8, tag: '종교 허들' },
      { label: '잦은 음주·유흥 또는 게임·취미 올인', penalty: 7, tag: '생활 패턴' },
      { label: '특별한 제한 없음 (무난하게 맞추는 편)', penalty: 0, exclusive: true }
    ]
  },
  {
    id: 'spending',
    stepTitle: '연애 성향',
    title: '데이트 비용과 경제관에 대한 생각은?',
    desc: '실제 소개팅 애프터 확률을 가르는 중요한 기준입니다.',
    type: 'single',
    options: [
      { label: '상황과 여유에 따라 유연하게 번갈아 낸다', love: 16, appeal: 8 },
      { label: '내가 조금 더 내는 편이 마음 편하다', love: 15, appeal: 7 },
      { label: '1원 단위까지 칼같은 5:5 더치페이를 선호한다', love: 9, appeal: 2 },
      { label: '상대방이 대부분 부담해 주길 바란다', love: 4, appeal: -3 }
    ]
  },
  {
    id: 'communication',
    stepTitle: '연애 성향',
    title: '연락 빈도와 갈등 해결 스타일은 어떤가요?',
    desc: '장기 연애와 결혼 생활 유지력을 평가합니다.',
    type: 'single',
    options: [
      { label: '감정이 상해도 대화로 차분히 바로 푸는 편', love: 18, appeal: 6 },
      { label: '혼자 생각 정리할 시간이 조금 필요하다', love: 12, appeal: 4 },
      { label: '연락 빈도와 답장 속도에 꽤 예민한 편이다', love: 8, appeal: 1 },
      { label: '갈등이 생기면 일단 피하거나 잠수를 타는 편', love: 3, appeal: -3 }
    ]
  },
  {
    id: 'standard',
    stepTitle: '눈높이 측정',
    title: '상대방에게 바라는 최소 조건은 어느 정도인가요?',
    desc: '마지막으로 본인의 현실 스펙과 눈높이 균형을 확인합니다.',
    type: 'single',
    options: [
      { label: '가치관과 대화가 맞으면 스펙은 크게 상관없다', demandLevel: 1, metaBonus: 12 },
      { label: '최소 나랑 비슷한 수준의 스펙·외모면 충분하다', demandLevel: 2, metaBonus: 8 },
      { label: '나보다 경제력·외모 중 하나 이상은 확실히 나아야 한다', demandLevel: 3, metaBonus: 2 },
      { label: '외모·능력·성격·집안 모두 빠지지 않는 육각형이어야 한다', demandLevel: 4, metaBonus: -6 }
    ]
  }
];

// 문항 및 등급 판정 데이터

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D'];

const SUB_TIER_THRESHOLDS = [
  { tier: 'S+', base: 'S', minScore: 95 },
  { tier: 'S', base: 'S', minScore: 92 },
  { tier: 'S-', base: 'S', minScore: 89 },
  { tier: 'A+', base: 'A', minScore: 84 },
  { tier: 'A', base: 'A', minScore: 80 },
  { tier: 'A-', base: 'A', minScore: 76 },
  { tier: 'B+', base: 'B', minScore: 70 },
  { tier: 'B', base: 'B', minScore: 65 },
  { tier: 'B-', base: 'B', minScore: 60 },
  { tier: 'C+', base: 'C', minScore: 54 },
  { tier: 'C', base: 'C', minScore: 49 },
  { tier: 'C-', base: 'C', minScore: 44 },
  { tier: 'D+', base: 'D', minScore: 36 },
  { tier: 'D', base: 'D', minScore: 26 },
  { tier: 'D-', base: 'D', minScore: 0 }
];

const RANDOM_NICKNAMES = [
  '수줍은 판다', '새벽의 고양이', '진지한 알파카', '용감한 수달',
  '따뜻한 라떼', '낭만적인 여우', '산책하는 시바', '조용한 부엉이',
  '반짝이는 고래', '부지런한 다람쥐'
];

const TIER_PROFILES = {
  S: {
    minScore: 90,
    label: '상위 5% 유니콘 매물',
    headline: '“매니저가 먼저 모시러 가는 1순위 프로필입니다.”',
    comment: '자산·소득 기반, 자기관리, 연애 내공이 모두 최상위권입니다. 까다로운 조건을 걸어도 매칭 대기열이 길게 늘어서는 타입입니다.',
    advice: '이미 경쟁력이 충분합니다. 단, 완벽한 조건만 찾다가 타이밍을 놓치지 않도록 ‘대화가 통하는 사람’에 가중치를 두어 보세요.'
  },
  A: {
    minScore: 76,
    label: '1군 인기 매물',
    headline: '“결정사 등록 즉시 소개 요청이 쏟아질 타입입니다.”',
    comment: '안정적인 자산·직업 기반과 꾸준한 자기관리, 균형 잡힌 연애관을 갖추고 있어 폭넓게 사랑받는 프로필입니다.',
    advice: '현재 강점을 유지하면서, 첫 만남에서 유연하고 여유 있는 태도를 보여주면 S등급 못지않은 매칭 결과를 얻을 수 있습니다.'
  },
  B: {
    minScore: 60,
    label: '무난한 호감형',
    headline: '“전체적으로 무난한데, 한 끗 포인트가 아쉽네요.”',
    comment: '성실한 인상을 주지만, 경쟁이 치열한 결정사 시장에서는 자산·자기관리·연애 성향 중 한 가지 강점을 더 부각할 필요가 있습니다.',
    advice: '꾸준한 운동 습관이나 소비·소통 스타일 중 한 가지만 확실히 끌어올려도 A등급 매칭 풀에 진입할 수 있습니다.'
  },
  C: {
    minScore: 44,
    label: '조건 조율 필요',
    headline: '“내 조건 대비 눈높이나 생활 허들을 점검해 볼 시점입니다.”',
    comment: '장점은 있지만 생활 습관(흡연·음주·식단·종교) 허들이나 눈높이 때문에 실제 매칭 가능한 풀(Pool)이 좁아진 상태입니다.',
    advice: '‘절대 포기 못 하는 조건’을 딱 2가지만 남기고 나머지는 열어두면 소개 성공률이 크게 올라갑니다.'
  },
  D: {
    minScore: 0,
    label: '매니저 비상 호출',
    headline: '“솔직히 말씀드리면, 이 조건으론 매칭이 어렵습니다.”',
    comment: '결정사 시스템은 냉정합니다. 현재 자산·소득 기반 대비 요구 조건이 높거나, 상대방 입장에서 부담스러워할 허들이 겹쳐 있습니다.',
    advice: '당장 눈높이를 낮추기보다, 통제 가능한 요소(저축·운동·생활습관·소통 태도)부터 하나씩 리셋해 보시는 걸 추천합니다.'
  }
};

const REGIONS = [
  '서울', '경기 · 인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충청', '전라', '경상', '제주', '해외'
];

const QUESTIONS = [
  {
    id: 'profile',
    stepTitle: '기본 프로필',
    askTopic: '기본 프로필',
    title: '성별과 출생 정보, 거주지를 알려주세요',
    desc: '만 나이·연 나이와 12지신, 실시간 인생 카운터를 계산합니다.',
    type: 'profile'
  },
  {
    id: 'body',
    stepTitle: '신체 조건',
    askTopic: '신체 조건',
    title: '키와 몸무게를 알려주세요',
    desc: '입력을 마치면 아래 BMI 게이지 화살표가 내 위치로 이동합니다.',
    type: 'body'
  },
  {
    id: 'education',
    stepTitle: '학력',
    askTopic: '학력',
    title: '최종 학력을 알려주세요',
    desc: '대졸 이상인 경우 수도권·지방 대학 구간을 함께 선택합니다.',
    type: 'education',
    degreeOptions: [
      { label: '중졸 이하', spec: 1, appeal: 0, needsTier: false },
      { label: '고졸', spec: 2, appeal: 1, needsTier: false },
      { label: '전문대졸', spec: 4, appeal: 2, needsTier: false },
      { label: '대졸', spec: 6, appeal: 3, needsTier: true },
      { label: '석사', spec: 8, appeal: 4, needsTier: true },
      { label: '박사', spec: 9, appeal: 4, needsTier: true }
    ],
    tierOptions: [
      { label: '최상위권 (SKY · 카포 · 의약학 · 해외 명문)', spec: 6, appeal: 3 },
      { label: '수도권 주요 대학 (인서울 · 주요 공대 등)', spec: 4, appeal: 2 },
      { label: '지방 거점국립대', spec: 4, appeal: 2 },
      { label: '수도권 일반 대학', spec: 3, appeal: 1 },
      { label: '지방 일반 대학', spec: 2, appeal: 1 },
      { label: '방통대 · 사이버대 · 학점은행 등', spec: 1, appeal: 0 }
    ]
  },
  {
    id: 'job',
    stepTitle: '직업 · 소득',
    title: '고용 형태와 연봉·인센티브를 알려주세요',
    desc: '순 계약 연봉과 인센티브를 합산해 세전·세후 총합을 계산합니다.',
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
    stepTitle: '자산 · 부동산',
    title: '현재 주거 형태와 월 주거 비용을 알려주세요',
    desc: '자가·전세·월세·본가 구분과 매월 나가는 비용을 함께 반영합니다.',
    type: 'housing',
    options: [
      { label: '자가', costLabel: '월 대출이자 · 관리비 (만원)', spec: 22, appeal: 6 },
      { label: '전세', costLabel: '월 전세대출이자 · 관리비 (만원)', spec: 17, appeal: 5 },
      { label: '월세', costLabel: '월세 · 관리비 합계 (만원)', spec: 11, appeal: 4 },
      { label: '본가 거주', costLabel: '월 생활비 보탬 (만원, 없으면 0)', spec: 6, appeal: 2 }
    ]
  },
  {
    id: 'savings',
    stepTitle: '자산 · 저축',
    title: '보유 중인 금융 자산과 대출을 알려주세요',
    desc: '현금·예적금·연금·코인 합산에서 부동산 외 대출을 차감해 순자산을 계산합니다.',
    type: 'savings'
  },
  {
    id: 'car',
    stepTitle: '자산 · 차량',
    title: '현재 본인 명의 차량을 보유하고 있나요?',
    desc: '유지비 부담과 이동 편의성을 함께 고려합니다.',
    type: 'single',
    options: [
      { label: '자차 보유 (할부 없음)', spec: 6, appeal: 4 },
      { label: '자차 보유 (할부 상환 중)', spec: 3, appeal: 3 },
      { label: '차량 없음 (대중교통 · 필요 시 렌트)', spec: 2, appeal: 2 }
    ]
  },
  {
    id: 'selfcare',
    stepTitle: '자기관리 · 운동',
    title: '평소 운동 습관과 꾸준함을 알려주세요',
    desc: '자기관리의 척도인 주간 운동 빈도·시간과 누적 경력을 반영합니다.',
    type: 'selfcare',
    freqOptions: [
      { label: '거의 안 함 (주 0회)', score: 2 },
      { label: '주 1~2회', score: 8 },
      { label: '주 3~4회', score: 14 },
      { label: '주 5회 이상', score: 16 }
    ],
    durationOptions: [
      { label: '30분 미만', score: 2 },
      { label: '30분 ~ 1시간', score: 5 },
      { label: '1시간 ~ 1시간 30분', score: 8 },
      { label: '1시간 30분 이상', score: 9 }
    ],
    yearsOptions: [
      { label: '6개월 미만 / 입문', score: 1 },
      { label: '6개월 ~ 1년', score: 4 },
      { label: '1년 ~ 3년', score: 7 },
      { label: '3년 이상 꾸준히', score: 10 }
    ]
  },
  {
    id: 'lifestyle',
    stepTitle: '자기관리 · 생활습관',
    title: '흡연·음주·종교·식단 성향을 선택해 주세요',
    desc: '매칭 시 상대방과의 생활 궁합 및 타협 난이도를 평가합니다.',
    type: 'lifestyle',
    smokingOptions: [
      { label: '비흡연', penalty: 0, tag: null },
      { label: '전자담배', penalty: 4, tag: '전자담배' },
      { label: '연초 흡연', penalty: 8, tag: '흡연' }
    ],
    drinkingOptions: [
      { label: '안 마심 / 월 1~2회', penalty: 0, tag: null },
      { label: '주 1~2회', penalty: 1, tag: null },
      { label: '주 3~4회', penalty: 5, tag: '잦은 음주' },
      { label: '주 5회 이상', penalty: 9, tag: '과음' }
    ],
    religionOptions: [
      { label: '무교', penalty: 0, tag: null },
      { label: '종교 있음 (상대에게 강요 안 함)', penalty: 2, tag: null },
      { label: '종교 있음 (같은 종교·신념 중요)', penalty: 8, tag: '종교 허들' }
    ],
    dietOptions: [
      { label: '일반식 (가리는 것 없이 잘 먹음)', penalty: 0, tag: null },
      { label: '유연한 식단 (페스코 · 다이어트 식단 등)', penalty: 3, tag: null },
      { label: '엄격한 채식 (비건 · 락토 · 오보 등)', penalty: 9, tag: '엄격한 채식' },
      { label: '극단적 편식 · 특정 식재료 강한 거부', penalty: 6, tag: '까다로운 식성' }
    ]
  },
  {
    id: 'dating',
    stepTitle: '연애 이력',
    title: '지금까지의 연애 횟수와 최장기간은?',
    desc: '연애 경험치와 관계 유지력을 참고 지표로 반영합니다.',
    type: 'dating',
    countOptions: [
      { label: '0회 (연애 경험 없음)', score: 3 },
      { label: '1 ~ 2회', score: 8 },
      { label: '3 ~ 5회', score: 12 },
      { label: '6회 이상', score: 10 }
    ],
    longestOptions: [
      { label: '해당 없음', score: 2 },
      { label: '6개월 미만', score: 5 },
      { label: '6개월 ~ 1년', score: 8 },
      { label: '1년 ~ 3년', score: 12 },
      { label: '3년 이상', score: 13 }
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

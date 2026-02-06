const fs = require('fs');

function createRng(seed = 20260207) {
  let s = seed >>> 0;
  return function rng() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rng = createRng();
const pick = (arr) => arr[Math.floor(rng() * arr.length)];


const common = {
  emo: ['', '!', '!!', '!?', 'ㅋㅋ', 'ㄷㄷ', '와', '헐', '진짜', '리얼루'],
  end: ['', '!', '!!', 'ㅋㅋ', 'ㄷㄷ'],
  light: ['오늘 빡세다', '기류 쎄다', '분위기 미쳤다', '폼 미쳤다', '긴장 확 온다', '소름 온다', '이거 세다', '몰입 터진다', '레전드각', '재밌다 이거'],
};

const defs = {
  greeting: {
    a: ['유하', '하이', '왔냐', '입장완', '출첵', '본방왔다', '나 왔다', '합류함', '채팅 켰다', '들어옴', '유하!!!', '출석', '도착'],
    b: ['바로 시작하네', '초반부터 쎄다', '분위기 좋다', '기류 이상함', '각 나왔다', '긴장감 좋다', '공기 무겁다', '첫컷 좋네', '오늘 판 세네', '도입부터 강함'],
    patterns: [
      (v) => `${v.a}${v.end}`,
      (v) => `${v.a} ${v.b}${v.end}`,
      (v) => `${v.emo} ${v.b}${v.end}`,
      (v) => `${v.a} ${pick(common.light)}${v.end}`,
    ],
  },
  question: {
    a: ['어디 감', '뭐 하는 중', '지금 맞아', '이대로 감', '멈출까', '더 볼까', '가도 돼', '후퇴할까', '진행 맞냐', '지금 뭐함', '지금 어디냐', '어디로 가냐', '다음 뭐함', '지금 대기함', '계속 가냐'],
    b: ['이 타이밍 맞지', '지금 판단 괜찮지', '리스크 큰가', '지금 밀어도 돼', '한 템포 늦출까', '다음 뭐할까', '지금 경로 맞냐', '지금 흐름 맞냐', '이거 페이크냐', '트리거냐', '지금 멈춤 맞냐', '진행 각 맞냐', '지금 보류할까', '이동 계속하냐', '리셋할까'],
    patterns: [
      (v) => `${v.a}?`,
      (v) => `${v.a} ${v.end}`,
      (v) => `${v.b}?`,
      (v) => `${v.emo} ${v.a}?`,
      (v) => `${v.emo} ${v.b}?`,
      (v) => `${v.a} or ${v.b}?`,
    ],
  },
  horror: {
    a: ['리얼루 무섭다', '소름 돋는다', '등골 서늘', '기류 미쳤다', '공포 쎄다', '숨 막힌다', '심장 쿵한다', '정적 무섭다', '압박감 크다', '눈 못 떼겠다'],
    b: ['이거 진짜 세다', '분위기 살벌함', '공기 차갑다', '긴장 풀리질 않네', '진심 무섭네', '체감 난이도 높다', '계속 쫄린다', '멘탈 깎인다', '손에 땀난다', '이 장면 미쳤다'],
    patterns: [
      (v) => `${v.a}${v.end}`,
      (v) => `${v.b}${v.end}`,
      (v) => `${v.emo} ${v.a}${v.end}`,
      (v) => `${v.a}, ${v.b}${v.end}`,
    ],
  },
  warning: {
    a: ['멈춰', '가지 마', '뒤 봐', '천천히 가', '후퇴해', '속도 줄여', '다시 봐', '확인 먼저', '지금 위험', '지금 보류'],
    b: ['무리하지 마', '지금 타이밍 아냐', '리스크 크다', '안전 우선', '한걸음 빼', '판단 다시', '지금은 대기', '욕심 금지', '진입 금지', '잠깐 멈춰'],
    patterns: [
      (v) => `${v.a}${v.end}`,
      (v) => `${v.a}, ${v.b}${v.end}`,
      (v) => `${v.emo} ${v.b}${v.end}`,
      (v) => `${v.b}${v.end}`,
    ],
  },
  troll: {
    a: ['클립각', '유령도 본다', '예능각', '드립각', '폼 미쳤다', '리액션 맛집', '썸네일 확정', '조회수각', '밈 탄생', '개웃기네'],
    b: ['레전드다', '이거 터진다', '채팅 폭발', '진짜 웃김', '오늘 폼 좋다', '장면 미쳤다', '편집자 행복', '다시보기 각', '유하각', '이거 된다'],
    patterns: [
      (v) => `${v.a}${v.end}`,
      (v) => `${v.a} ${v.b}${v.end}`,
      (v) => `${v.emo} ${v.a}${v.end}`,
      (v) => `${v.b}${v.end}`,
    ],
  },
  support: {
    a: ['잘한다', '잘하고 있다', '천천히 가', '호흡해', '침착해', '지금 좋다', '판단 좋다', '끝까지 가자', '리듬 좋다', '유지해'],
    b: ['지금처럼 가', '안전하게 가', '실수 없다', '완주 가능', '이 페이스 좋아', '충분히 가능', '멘탈 좋다', '계속 가자', '응원한다', '잘 버틴다'],
    patterns: [
      (v) => `${v.a}${v.end}`,
      (v) => `${v.a}, ${v.b}${v.end}`,
      (v) => `${v.emo} ${v.b}${v.end}`,
      (v) => `${v.b}${v.end}`,
    ],
  },
  analysis: {
    a: ['패턴 이상함', '값 튄다', '노이즈 뜀', '신호 이상', '로그 이상', '수치 흔들림', '간격 이상', '변동 크다', '재확인 필요', '정상 아님'],
    b: ['이건 우연 아님', '반복 신호임', '복합 원인 같음', '재측정 각', '분석값 깨짐', '근거 남는다', '패턴 잡힘', '값 불안정', '지표 흔들림', '이상치 맞다'],
    patterns: [
      (v) => `${v.a}${v.end}`,
      (v) => `${v.a}, ${v.b}${v.end}`,
      (v) => `${v.emo} ${v.a}${v.end}`,
      (v) => `${v.b}${v.end}`,
    ],
  },
  jumpscare_react: {
    a: ['뭐야', '깜짝이야', '와씨 놀람', '심장 떨어짐', '비명 나올 뻔', '개놀랐다', '아 깜놀', '심장 쿵', '와 미쳤다', '손 떨림'],
    b: ['반칙이네', '타이밍 뭐냐', '너무 세다', '진짜 당했다', '후유증 온다', '맥박 안 내려감', '다시 못 보겠다', '와 이거 세네', '완전 사각', '진심 놀람'],
    patterns: [
      (v) => `${v.a}${v.end}`,
      (v) => `${v.a}, ${v.b}${v.end}`,
      (v) => `${v.emo} ${v.a}${v.end}`,
      (v) => `${v.b}${v.end}`,
    ],
  },
};

  const data = JSON.parse(fs.readFileSync('chat.json', 'utf8'));

for (const [cat, arr] of Object.entries(data.chat)) {
  const def = defs[cat];
  if (!def) continue;

  const baseTexts = arr.map((x) => x.text);
  const used = new Set(baseTexts);

  let added = 0;
  let guard = 0;
  while (added < 200 && guard < 2000000) {
    guard += 1;
    const vars = {
      a: pick(def.a),
      b: pick(def.b),
      emo: pick(common.emo),
      end: pick(common.end),
    };
    let line = pick(def.patterns)(vars).replace(/\s+/g, ' ').trim();
    line = line.replace(/^\s+|\s+$/g, '');
    if (!line) continue;
    if (used.has(line)) continue;

    used.add(line);
    arr.push({ text: line });
    added += 1;
  }

  if (added !== 200) {
    throw new Error(`${cat}: added ${added}/200`);
  }
}

fs.writeFileSync('chat.json', JSON.stringify(data, null, 2) + '\n');
for (const [k, v] of Object.entries(data.chat)) console.log(k, v.length);

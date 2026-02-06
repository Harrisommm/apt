const fs = require('fs');

function createRng(seed = 20260206) {
  let s = seed >>> 0;
  return function rng() {
    s = (s * 1664525  + 213904223) >>> 0;
    return s / 4294967296;
  };
}

const rng = createRng();
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[0-9]/g, '#')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trigrams(text) {
  const s = normalize(text).replace(/\s/g, '');
  if (s.length < 3) return new Set([s]);
  const out = new Set();
  for (let i = 0; i <= s.length - 3; i += 1) out.add(s.slice(i, i + 3));
  return out;
}

function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

function makeCategory({ target, pools, patterns, simThreshold = 1.1 }) {
  const out = [];
  const seen = new Set();
  const grams = [];
  const pUse = Array(patterns.length).fill(0);
  const pCap = Math.ceil(target / patterns.length) + 2;

  let tries = 0;
  const maxTries = 2000000;

  while (out.length < target && tries < maxTries) {
    tries += 1;
    const pi = Math.floor(rng() * patterns.length);
    if (pUse[pi] >= pCap) continue;

    const vars = {};
    for (const [k, arr] of Object.entries(pools)) vars[k] = pick(arr);
    const line = patterns[pi](vars).replace(/\s+/g, ' ').trim();

    if (line.length < 8) continue;
    if (seen.has(line)) continue;

    const g = trigrams(line);
    let near = false;
    for (const prev of grams) {
      if (jaccard(g, prev) >= simThreshold) {
        near = true;
        break;
      }
    }
    if (near) continue;

    seen.add(line);
    grams.push(g);
    out.push({ text: line });
    pUse[pi] += 1;
  }

  if (out.length !== target) {
    throw new Error(`generation failed: ${out.length}/${target}`);
  }
  return out;
}

const core = {
  spot: ['문틈', '복도 끝', '천장 모서리', '창문 옆', '계단 입구', '욕실 문앞', '주방 코너', '거실 안쪽', '현관 앞', '베란다 문'],
  sign: ['발소리', '긁는 소리', '숨소리', '금속음', '물방울 소리', '저주파 웅웅거림', '전자음', '마찰음', '탁 치는 소리', '한숨 같은 소리'],
  tone: ['진짜', '솔직히', '이거', '방금', '지금', '확실히', '개인적으로', '체감상', '냉정하게'],
};

function greeting() {
  const pools = {
    hello: ['입장 완료', '출석 체크', '채팅 합류', '라이브 확인', '본방 사수', '방금 도착'],
    spot: core.spot,
    sign: core.sign,
    mood: ['쎄하네요', '불길하네요', '서늘하네요', '이상하네요', '정적이 무겁네요', '공기가 눌리네요'],
    tail: ['오늘 판 길게 보겠습니다', '초반부터 텐션 강하네요', '시작부터 몰입감 큽니다', '첫 장면인데 긴장 올라요', '안전 루트 먼저 봐야겠어요'],
  };

  const patterns = [
    (v) => `${v.hello}. 시작 화면부터 ${v.mood}.`,
    (v) => `${v.hello}, ${v.spot} 쪽이 제일 먼저 거슬립니다.`,
    (v) => `막 들어왔는데 ${v.sign}가 배경음이랑 분리돼 들려요.`,
    (v) => `오프닝인데도 ${v.spot} 라인 그림자가 너무 진합니다.`,
    (v) => `첫 프레임부터 ${v.mood} ${v.tail}.`,
    (v) => `${v.hello}. 도입치고 공포 밀도 높네요.`,
    (v) => `지금 합류했는데 ${v.spot}만 밝기 톤이 다릅니다.`,
    (v) => `시작 10초인데 이미 ${v.tail}.`,
    (v) => `프롤로그가 아니라 본게임 느낌이 바로 옵니다.`,
    (v) => `${v.sign}가 끊기지 않아서 초반부터 신경 쓰입니다.`,
    (v) => `${v.hello}. 오늘 맵은 도입부터 압박이 크네요.`,
    (v) => `${v.spot} 쪽 노이즈가 살아 있어서 더 불안합니다.`,
    (v) => `처음 장면인데 시야보다 청각이 더 위협적이네요.`,
    (v) => `방송 시작 구간인데도 공기 밀도가 다르게 느껴집니다.`,
    (v) => `${v.hello}. 카메라 가장자리 떨림이 눈에 걸립니다.`,
    (v) => `첫 컷에서 ${v.spot}이 제일 위험해 보입니다.`,
    (v) => `지금 들어왔는데 ${v.mood} 초반치고 강하네요.`,
    (v) => `도입 멘트 듣는 동안 ${v.sign}가 계속 남아 있습니다.`,
    (v) => `${v.hello}. 시작부터 후퇴 루트를 보게 되네요.`,
    (v) => `오프닝 연출 같지 않고 실제 이상 신호처럼 느껴집니다.`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

function question() {
  const pools = {
    spot: core.spot,
    sign: core.sign,
    qend: ['맞나요?', '어때요?', '보이세요?', '들리세요?', '아닌가요?', '판단 가능해요?'],
    action: ['후퇴', '정지', '재확인', '우회', '진입 보류', '조명 재세팅'],
  };

  const patterns = [
    (v) => `방금 ${v.sign} 들은 사람 저뿐인가요?`,
    (v) => `${v.spot} 쪽 움직임 본 사람 있나요?`,
    (v) => `지금은 ${v.action}가 맞는 선택일까요?`,
    (v) => `문턱 넘기 전에 ${v.spot} 먼저 체크해야 하지 않나요?`,
    (v) => `화면 가장자리 흔들림이 장비 문제인지 궁금합니다.`,
    (v) => `${v.sign} 거리감이 갑자기 가까워진 거 맞죠?`,
    (v) => `이 정적 길이면 이벤트 직전 신호로 봐야 하나요?`,
    (v) => `${v.spot} 문 각도 원래 저랬나요?`,
    (v) => `지금 페이스면 점프스케어 대응 가능할까요?`,
    (v) => `채팅 기준 위험도 몇 점쯤으로 봅니까?`,
    (v) => `다음 한 걸음은 ${v.action} 쪽이 나아 보이는데 동의해요?`,
    (v) => `${v.spot} 먼저 보고 가는 판단, 지금도 유효한가요?`,
    (v) => `저 저주파랑 심박 비슷한 소리 겹친 거 ${v.qend}`,
    (v) => `진입 전에 오디오 체크 한 번 더 해야 하지 않을까요?`,
    (v) => `프레임 드랍인지 실제 흔들림인지 구분 가능하세요?`,
    (v) => `채팅 다수 의견 기준으로는 ${v.action} 쪽입니까?`,
    (v) => `지금 바로 들어가면 리스크 큰 편인가요?`,
    (v) => `${v.sign}가 계속 같은 위치에서 나는 게 이상하지 않나요?`,
    (v) => `${v.spot} 라인부터 보는 게 맞죠?`,
    (v) => `이 패턴이 트리거인지 페이크인지 판단 가능해요?`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

function horror() {
  const pools = {
    spot: core.spot,
    sign: core.sign,
    react: ['등골이 식습니다', '손끝이 차가워집니다', '심장이 내려앉네요', '호흡이 짧아집니다', '목덜미가 굳습니다', '소름이 계속 남아요'],
    mood: ['압박감이 큽니다', '불안이 길게 갑니다', '정적이 위협적입니다', '시선이 묶이는 느낌입니다', '공간이 사람을 밀어냅니다'],
  };

  const patterns = [
    (v) => `${v.spot} 쪽은 보고만 있어도 ${v.react}.`,
    (v) => `정적이 길어질수록 ${v.mood}.`,
    (v) => `${v.sign}가 가까워지는 느낌 때문에 ${v.react}.`,
    (v) => `점프스케어 없이도 공포 밀도가 높습니다.`,
    (v) => `카메라 밖 시선이 걸려서 더 무섭습니다.`,
    (v) => `불 켜져 있어도 안전하다는 느낌이 없습니다.`,
    (v) => `${v.spot} 초점 잡힐 때마다 몸이 먼저 반응하네요.`,
    (v) => `여긴 시각보다 청각이 먼저 멘탈을 깎습니다.`,
    (v) => `${v.mood} 그래서 한 걸음이 더 무겁습니다.`,
    (v) => `발소리보다 침묵이 크게 들리는 구간입니다.`,
    (v) => `문턱 넘기 전인데 벌써 퇴로부터 찾게 됩니다.`,
    (v) => `${v.sign} 끊김이 없어서 더 불길합니다.`,
    (v) => `잔향이 길게 남아 현실감이 깨집니다.`,
    (v) => `${v.spot} 라인만 보면 체감 온도가 떨어집니다.`,
    (v) => `설명 안 되는 불안이 같은 속도로 따라옵니다.`,
    (v) => `${v.react}, 이 장면은 압박형 공포네요.`,
    (v) => `밝기 정상인데도 화면이 계속 어둡게 느껴집니다.`,
    (v) => `뒤돌아보는 순간이 가장 무서운 타입입니다.`,
    (v) => `이번 구간은 놀람보다 지속 공포가 강합니다.`,
    (v) => `${v.spot} 쪽 공기감이 특히 차갑게 느껴집니다.`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

function warning() {
  const pools = {
    spot: core.spot,
    sign: core.sign,
    action: ['멈추세요', '후퇴하세요', '속도 줄이세요', '시야부터 확보하세요', '손전등 먼저 넣으세요', '진입 보류하세요'],
    reason: ['사각이 큽니다', '소리 방향이 바뀝니다', '반사광이 이상합니다', '프레임 밖 반응 있습니다', '진입 타이밍이 나쁩니다', '장비 확인이 먼저입니다'],
  };

  const patterns = [
    (v) => `${v.spot} 먼저 확인하고 이동하세요.`,
    (v) => `지금은 ${v.action} ${v.reason}.`,
    (v) => `${v.sign} 가까워졌습니다. ${v.action}`,
    (v) => `문 바로 열지 말고 조명 각도부터 재설정하세요.`,
    (v) => `현재 위치 위험도 높습니다. 후퇴 2걸음 권장.`,
    (v) => `${v.spot} 진입은 잠시 보류가 맞습니다.`,
    (v) => `${v.reason} 지금은 탐색보다 확인 단계입니다.`,
    (v) => `${v.sign} 패턴이 비정상입니다. 추적 금지.`,
    (v) => `정적 길어진 뒤가 가장 위험합니다.`,
    (v) => `급하게 돌지 말고 뒤쪽 먼저 체크하세요.`,
    (v) => `한 번에 깊게 들어가지 말고 절반 접근만 하세요.`,
    (v) => `${v.spot}는 각도 없이 들어가면 리스크 큽니다.`,
    (v) => `채팅 다수 경고 중입니다. ${v.action}`,
    (v) => `장비 이상 가능성 있습니다. 진입 전에 점검하세요.`,
    (v) => `바닥 상태 불명입니다. 짧게 이동하세요.`,
    (v) => `${v.reason} 안전 동선으로 갈아타세요.`,
    (v) => `${v.spot} 앞 기류가 흔들립니다. 즉시 정지 권장.`,
    (v) => `진입보다 생존 우선입니다. 후퇴가 정답입니다.`,
    (v) => `${v.sign}가 가까울 때는 멈추고 재판단하세요.`,
    (v) => `지금 판단 미스 나기 쉬운 구간입니다.`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

function troll() {
  const pools = {
    sub: ['귀신', '악령', '집주인 영혼', '벽 뒤 관객', '폐허 주민', '배회자'],
    act: ['후원 버튼 누를 듯', '구독 유지할 듯', '알림 켜고 대기할 듯', '클립 따고 있을 듯', '채팅창 참여할 듯', '썸네일 저장할 듯'],
    extra: ['오늘 리액션 폼 좋다', '이 장면은 밈 확정', '점프스케어보다 채팅이 빠르다', '공포보다 드립 밀도가 높다', '예능 텐션이 공포를 이긴다', '심박이 배경음보다 크다'],
  };

  const patterns = [
    (v) => `${v.sub}도 ${v.act}.`,
    (v) => `방금 표정 저장 완료, ${v.extra}.`,
    (v) => `점프스케어 나오면 인사부터 하고 시작합시다.`,
    (v) => `퇴마보다 멘트가 먼저 나오는 방송이네요.`,
    (v) => `이 집은 벽지가 주연이고 사람은 게스트 느낌입니다.`,
    (v) => `${v.extra}.`,
    (v) => `${v.sub} 입장에서도 오늘은 이벤트 방송이겠네요.`,
    (v) => `문 열기 전에 광고 멘트 한 줄 읽고 가죠.`,
    (v) => `합방 제안 오면 바로 수락각입니다.`,
    (v) => `겁먹은 표정 정확해서 연출 같아요.`,
    (v) => `${v.sub}도 이 타이밍에 박수 칠 것 같습니다.`,
    (v) => `지금은 인간 vs 공포가 아니라 인간 vs 심박입니다.`,
    (v) => `무서운 건 맞는데 리액션이 더 재밌네요.`,
    (v) => `오늘 채팅창이 제일 시끄러운 오브젝트입니다.`,
    (v) => `${v.sub} 팬카페 열릴 것 같은 전개네요.`,
    (v) => `소리보다 채팅 반응 속도가 더 무섭습니다.`,
    (v) => `이 텐션이면 폐허도 예능 세트장 됩니다.`,
    (v) => `${v.extra}, 진짜 클립각입니다.`,
    (v) => `귀신이 놀랄까 봐 제가 대신 웃고 있습니다.`,
    (v) => `${v.sub}도 오늘은 관전 모드 확정입니다.`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

function support() {
  const pools = {
    pr: ['천천히', '차분하게', '신중하게', '호흡 맞춰서', '한 걸음씩', '기준 지키면서'],
    good: ['페이스 좋습니다', '판단 정확합니다', '컨트롤 안정적입니다', '관찰력 살아있습니다', '멘탈 유지 잘합니다', '속도 조절 훌륭합니다'],
    care: ['무리하지 마세요', '안전 우선으로 가요', '불안하면 후퇴해도 됩니다', '휴식 템포 가져도 괜찮아요', '생존 중심으로 판단해요', '급해지지 않아도 됩니다'],
  };

  const patterns = [
    (v) => `${v.pr} 가면 됩니다. ${v.good}.`,
    (v) => `${v.care} 지금 플레이 방향 맞아요.`,
    (v) => `긴장 구간인데도 ${v.good}.`,
    (v) => `확인 후 이동 방식이 안정적이라 좋습니다.`,
    (v) => `채팅 다수 응원 중입니다. 끝까지 같이 가요.`,
    (v) => `${v.pr} 정보 모으는 플레이가 정답에 가깝습니다.`,
    (v) => `위험 구간에서도 중심 안 잃는 게 최고입니다.`,
    (v) => `${v.good} 이 페이스면 완주 가능합니다.`,
    (v) => `${v.care} 우리는 계속 지켜보고 있습니다.`,
    (v) => `불빛 운용 좋아서 상황 파악이 쉽습니다.`,
    (v) => `판단 우선순위가 명확해서 든든합니다.`,
    (v) => `${v.pr} 가는 게 진짜 실력입니다.`,
    (v) => `공격적이지 않은 선택이 지금은 더 정확합니다.`,
    (v) => `${v.good} 흔들리지 않는 게 강점이에요.`,
    (v) => `한 걸음씩 확인하는 방식 계속 유지합시다.`,
    (v) => `${v.care} 지금 선택 충분히 좋습니다.`,
    (v) => `무서운 장면 지나도 멘탈 관리가 탁월하네요.`,
    (v) => `안전하게 가는 플레이가 결국 가장 강합니다.`,
    (v) => `${v.pr} 끝까지 가면 됩니다.`,
    (v) => `여기까지 온 것만으로도 이미 잘하고 있습니다.`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

function analysis() {
  const pools = {
    metric: ['소리 간격', '잔향 길이', '노이즈 분포', '노출 변화', '초점 이동량', '저주파 세기', '온도 추정치', '그림자 길이', '프레임 흔들림', '신호 지연값'],
    note: ['정상 범위를 벗어났습니다', '변동폭이 과합니다', '동선과 맞지 않습니다', '우연 잡음으로 보기 어렵습니다', '반복 패턴이 관찰됩니다', '복합 원인 가능성이 큽니다'],
  };

  const patterns = [
    (v) => `${v.metric} 기준으로 ${v.note}.`,
    (v) => `직전 구간 대비 ${v.metric} 변화량이 큽니다.`,
    (v) => `${v.metric} 패턴이 자연 노이즈와 다르게 반복됩니다.`,
    (v) => `오디오 이벤트와 영상 이벤트 시점이 어긋납니다.`,
    (v) => `단순 흔들림으로 설명하기 어려운 신호가 남습니다.`,
    (v) => `정적 구간에서만 ${v.metric}이 커지는 점이 핵심입니다.`,
    (v) => `${v.metric} 추세선이 이동 방향과 반대로 갑니다.`,
    (v) => `프레임 단위로 이상 신호가 재현됩니다.`,
    (v) => `환경 반사음으로 보기 힘든 ${v.metric} 값입니다.`,
    (v) => `문턱 통과 직후 ${v.metric} 급상승이 반복됩니다.`,
    (v) => `현재 데이터는 단일 원인보다 복합 원인에 가깝습니다.`,
    (v) => `소스 없는 잡음이 특정 구간에 집중됩니다.`,
    (v) => `${v.metric} 변화만 보면 고정 물체 반응이 아닙니다.`,
    (v) => `신호 세기와 거리감이 물리적으로 맞지 않습니다.`,
    (v) => `잔향 특성상 현재 수치 설명이 어렵습니다.`,
    (v) => `우연 패턴보다 의도 신호 가능성이 높아 보입니다.`,
    (v) => `${v.metric} 재측정 필요합니다. 값이 튑니다.`,
    (v) => `초점 이동 없이 ${v.metric}만 흔들리는 점이 이상합니다.`,
    (v) => `같은 위치 재진입 시 값이 달라지는 건 비정상입니다.`,
    (v) => `요약하면 현재 구간은 위험 신호 누적 상태입니다.`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

function jump() {
  const pools = {
    react: ['심장 떨어질 뻔', '의자에서 튀어오름', '이어폰 벗어던질 뻔', '폰 놓칠 뻔', '숨 멎는 줄 알았음', '등이 먼저 굳음'],
    why: ['타이밍이 악랄함', '경고 없이 들어옴', '정적 뒤에 바로 터짐', '사운드가 너무 셈', '예상 각도를 피해 들어옴', '반응할 틈을 안 줌'],
    after: ['맥박이 안 내려감', '여운이 길게 남음', '소름이 계속 남음', '다시 보기 힘듦', '볼륨 높인 사람 다 당함', '후유증 강함'],
  };

  const patterns = [
    (v) => `${v.react}. ${v.why}.`,
    (v) => `방금 건 반칙입니다. ${v.why}.`,
    (v) => `${v.react}, 진짜 ${v.after}.`,
    (v) => `화면 멈춘 줄 알았는데 바로 튀어나와 당했습니다.`,
    (v) => `소리 먼저 치고 그림자 따라와서 더 무서웠습니다.`,
    (v) => `이번 점프스케어는 다시 보기 금지급이네요.`,
    (v) => `정적 유지하다가 한 번에 터뜨리는 방식이 셉니다.`,
    (v) => `${v.after}. 체감 공포가 두 배입니다.`,
    (v) => `${v.why}, 그래서 ${v.after}.`,
    (v) => `컷 길이 대비 놀람 강도가 과도하게 높습니다.`,
    (v) => `이번 건 리액션이 아니라 생존 본능이었습니다.`,
    (v) => `${v.react}, 아직 손에 힘이 안 풀립니다.`,
    (v) => `타이밍 읽었다고 생각했는데 완전히 빗나갔네요.`,
    (v) => `짧은 컷인데 여운이 길게 이어집니다.`,
    (v) => `이건 공포라기보다 심장 테스트에 가깝습니다.`,
    (v) => `${v.why}. 진짜 ${v.react}.`,
    (v) => `갑툭튀 진입 각이 완전히 사각이었습니다.`,
    (v) => `눈 깜빡이는 순간 들어와서 그대로 맞았습니다.`,
    (v) => `${v.react}. ${v.after}.`,
    (v) => `심리전으로 끌어올린 뒤 마지막 한 방이 셉니다.`,
  ];
  return makeCategory({ target: 300, pools, patterns, simThreshold: 0.92 });
}

const data = {
  chat: {
    greeting: greeting(),
    question: question(),
    horror: horror(),
    warning: warning(),
    troll: troll(),
    support: support(),
    analysis: analysis(),
    jumpscare_react: jump(),
  },
};

fs.writeFileSync('chat.json', JSON.stringify(data, null, 2) + '\n', 'utf8');

for (const [k, v] of Object.entries(data.chat)) {
  console.log(k, v.length);
}

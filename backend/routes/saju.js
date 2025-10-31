// backend/routes/saju.js

const express = require('express');
const router = express.Router();
const { ping, getByDate } = require('../utils/redis'); // 👈 redis.js 사용

// 1. Redis 헬스 체크 API (기존과 동일)
router.get('/saju/healthz', async (_req, res) => {
  const p = await ping();
  return (p === 'PONG') ? res.send('ok') : res.status(500).send('ng');
});

// 2. 🌟 [수정] 사주 분석 API
//    - 'GET /saju' -> 'POST /analyze'로 변경
//    - req.query (GET) -> req.body (POST)로 변경
router.post('/analyze', async (req, res) => {
  try {
    // 1. frontend가 POST로 보낸 year, month, day를 req.body에서 추출
    const { year, month, day, hour } = req.body; // hour는 현재 미사용

    // 2. 날짜 형식 검사 및 생성
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!year || !month || !day || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
      return res.status(400).json({ ok: false, error: 'year, month, day를 올바르게 보내세요' });

    // 3. utils/redis.js의 getByDate 함수로 Redis 조회
    const r = await getByDate(dateStr);
    if (!r.data) return res.status(404).json({ ok: false, error: `데이터 없음 (${r.key})` });

    // 4. (중요) Redis 데이터(r.data)로 '간지' 계산 (이전 sajuRouter.js의 로직)
    //    'utils/redis.js'는 데이터를 가져오기만 하므로, 간지 계산은 여기서 해야 함
    const ganjiResult = calculateSajuGanji(r.data, parseInt(hour));

    // 5. frontend로 최종 결과 반환
    return res.json({
      ok: true,
      ganji: ganjiResult, // 👈 'frontend/app.js'가 기대하는 'ganji' 객체
      // --- (참고용) ---
      key: r.key,
      date: dateStr,
      type: r.type,
      length: r.length,
      rawData: r.data
    });

  } catch (e) {
    console.error('[saju-analyze] route error:', e);
    return res.status(500).json({ ok: false, error: e.message || 'server error' });
  }
});

// --- 🌟 [추가] 간지 계산 함수 (이전에 사용한 함수) ---
// 이 함수가 있어야 'calculateSajuGanji'를 찾을 수 있습니다.
function calculateHourGanji(dayMasterHan, hour) {
    const hourInt = parseInt(hour);
    const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const ji = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    if (!dayMasterHan || dayMasterHan === '?' || hour === undefined) return '??';
    
    let hourIndex = Math.floor((hourInt + 1) / 2) % 12;
    let ganIndex = (hourIndex + (gan.indexOf(dayMasterHan) * 2)) % 10;
    return gan[ganIndex] + ji[hourIndex];
}

function calculateSajuGanji(manseryukData, hour) {
    // 'utils/redis.js'는 'hash' 데이터를 가져오므로 필드 이름이 맞는지 확인
    const yearGanji = manseryukData.cd_hyganjee || manseryukData.hyganjee || '??';
    const monthGanji = manseryukData.cd_hmganjee || manseryukData.hmganjee || '??';
    const dayGanji = manseryukData.cd_hdganjee || manseryukData.hdganjee || '??';
    const hourGanji = calculateHourGanji(dayGanji.substring(0, 1), hour) || '??';
    return { year: yearGanji, month: monthGanji, day: dayGanji, hour: hourGanji };
}

module.exports = router;

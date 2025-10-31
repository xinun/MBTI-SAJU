// backend/routes/sajuRouter.js
const express = require('express');
const router = express.Router();
const Redis = require('ioredis'); // Redis 라이브러리

// --- ⏳ 사주 간지 계산 함수 (!! 실제 명리학 로직 구현 필요 !!) ---
// 이 함수들은 사주 분석에만 필요하므로 여기에 두거나 별도 모듈로 분리 가능
function calculateHourGanji(dayMasterHan, hour) {
    const hourInt = parseInt(hour);
    const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const ji = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    let hourIndex = Math.floor((hourInt + 1) / 2) % 12;
    let ganIndex = (hourIndex + (gan.indexOf(dayMasterHan) * 2)) % 10; // 매우 단순화된 계산
    return gan[ganIndex] + ji[hourIndex];
}
function calculateSajuGanji(manseryukData, hour) {
    // 🌟 [수정] 필드 이름을 'cd_'가 붙은 이름으로 변경
    const yearGanji = manseryukData.cd_hyganjee || '??'; // 절입시간 비교 로직 필요
    const monthGanji = manseryukData.cd_hmganjee || '??'; // 절입시간 비교 로직 필요
    const dayGanji = manseryukData.cd_hdganjee || '??';
    
    // 🌟 [수정] dayGanji가 올바르게 설정되어야 이 함수가 동작합니다.
    const hourGanji = calculateHourGanji(dayGanji.substring(0, 1), hour) || '??';
    
    return { year: yearGanji, month: monthGanji, day: dayGanji, hour: hourGanji };
}

// --- API 엔드포인트 ---

// POST /api/analyze : 사주 분석 요청 처리 (Redis 연결 포함)
router.post('/analyze', async (req, res) => {
    const { year, month, day, hour } = req.body;
    let redisClient = null; // 핸들러 내에서 사용할 Redis 클라이언트 변수

    if (!year || !month || !day || hour === undefined || hour === null) {
        return res.status(400).json({ error: '생년월일시를 모두 입력해야 합니다.' });
    }

    try {
        // --- ✨ 핸들러 내부에서 Redis 연결 ✨ ---
        const redisHost = process.env.REDIS_HOST || '10.178.0.7'; // GCP Redis IP
        const redisPort = process.env.REDIS_PORT || 6379;
        redisClient = new Redis({
            host: redisHost,
            port: redisPort,
            connectTimeout: 5000,
            maxRetriesPerRequest: 1
        });
        redisClient.on('error', (err) => {
            // 연결 오류는 아래 catch 블록에서 처리됨
            console.error('[Saju Analyze Redis] Connection Error during operation:', err.message);
        });
        // 연결 확인 PING (선택 사항)
        await redisClient.ping();
        console.log(`[Saju Analyze Redis] Connected to ${redisHost}:${redisPort} for request`);
        // --- ✨ Redis 연결 완료 ✨ ---

        // 1. Redis 키 생성
        const redisKey = `date:${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        console.log(`[Saju Analyze] Fetching data from Redis for key: ${redisKey}`);

        // 2. Redis에서 데이터 조회
        const manseryukData = await redisClient.hgetall(redisKey);

        if (!manseryukData || Object.keys(manseryukData).length === 0) {
            console.warn(`[Saju Analyze] No data found in Redis for key: ${redisKey}`);
            return res.status(404).json({ error: '해당 날짜의 만세력 데이터를 찾을 수 없습니다.' });
        }
        console.log(`[Saju Analyze] Found data:`, manseryukData);

        // 3. 사주 간지 계산
        const ganjiResult = calculateSajuGanji(manseryukData, parseInt(hour));

        // 4. 결과 반환
        res.status(200).json({
            status: "success",
            input: req.body,
            ganji: ganjiResult,
            message: "Redis 만세력 데이터를 기반으로 간지를 조회/계산했습니다."
        });

    } catch (error) {
        console.error('[Saju Analyze] Error processing request:', error);
        res.status(500).json({ error: '사주 분석 중 오류가 발생했습니다.', details: error.message });
    } finally {
        // --- ✨ 작업 완료 후 Redis 연결 종료 ✨ ---
        if (redisClient) {
            redisClient.quit();
            console.log('[Saju Analyze Redis] Connection closed for request.');
        }
    }
});

module.exports = router;
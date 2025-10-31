// frontend/app.js
const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');

const GUESTBOOK_API_ADDR = process.env.GUESTBOOK_API_ADDR;
const BACKEND_URI = `http://${GUESTBOOK_API_ADDR}/api/messages`;
const SAJU_API_URI = `http://${GUESTBOOK_API_ADDR}/api/analyze`; // 사주 API URI


const questions = require('./questions'); // './questions.js'를 require
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// --- MBTI 홈 페이지 렌더링 ---
app.get("/", (req, res) => {
    axios.get(BACKEND_URI)
        .then(response => {
            // 'questions' 변수를 템플릿에 전달 (이제 questions.js에서 가져온 데이터)
            res.render("home", {
                messages: response.data || [],
                questions: questions // 👈 questions.js에서 가져온 객체 사용
            });
        }).catch(error => {
            console.error('Error fetching messages:', error.message);
            res.render("home", {
                messages: [],
                questions: questions // 👈 questions.js에서 가져온 객체 사용
            });
        });
});

// --- 사주 페이지 렌더링 ---
app.get("/saju", (req, res) => {
    res.render("saju", { sajuResult: null, error: null });
});

// --- 사주 분석 요청 처리 ---
app.post('/saju-analyze', (req, res) => {
    // ... (이전 코드와 동일)
    const { name, year, month, day, hour } = req.body;
    axios.post(SAJU_API_URI, { year, month, day, hour })
        .then(response => {
            const sajuResultWithContext = { ...response.data, name: name };
            res.render("saju", { sajuResult: sajuResultWithContext, error: null });
        }).catch(error => {
            console.error('Saju API Error:', error.message);
            res.render("saju", { sajuResult: null, error: '사주 데이터를 가져오는 데 실패했습니다.' });
        });
});

// --- MBTI 방명록 작성 처리 ---
app.post('/post', (req, res) => {
    // --- 1. Pug 폼에서 전송된 데이터 추출 ---
    const userAgent = req.headers['user-agent'];
    // 쉼표로 구분된 태그 문자열을 배열로 변환 (없으면 빈 배열)
    const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
    // MBTI 점수 객체 생성
    const scores = { 
        E: req.body.scoreE, // home.pug의 <input type="hidden" name="scoreE"> 값
        S: req.body.scoreS, 
        T: req.body.scoreT, 
        J: req.body.scoreJ 
    };
    
    // --- 2. 🚨 백엔드로 전송할 데이터 객체 구성 확인 (가장 중요) 🚨 ---
    const dataToSend = {
        name: req.body.name,     // Pug 폼의 <input name="name"> 값
        date: req.body.date,     // Pug 폼의 <input name="date"> 값
        mbti: req.body.mbti,     // Pug 폼의 <input type="hidden" name="mbti"> 값
        memo: req.body.memo,     // Pug 폼의 <input name="memo"> 값
        tags: tags,              // 위에서 처리한 tags 배열
        scores: scores,          // 위에서 처리한 scores 객체
        userAgent: userAgent     // 요청 헤더에서 가져온 userAgent
    };

    // --- 3. 백엔드 API 호출 ---
    axios.post(BACKEND_URI, dataToSend) // 👈 dataToSend 객체를 요청 본문으로 전달
        .then(response => {
            // 성공 시 홈으로 리다이렉트
            res.redirect('/'); 
        })
        .catch(error => {
            console.error('Error creating message via backend:', error.message);
            // 실패 시에도 홈으로 리다이렉트 (오류 메시지 표시 등 추가 가능)
            res.redirect('/'); 
        });
});

// --- 좋아요 처리 ---
app.post('/like/:id', (req, res) => {
    // ... (이전 코드와 동일)
    const messageId = req.params.id;
    axios.patch(`${BACKEND_URI}/${messageId}/like`)
        .then(response => res.status(200).json(response.data))
        .catch(error => {
            console.error('Error proxying like request:', error.message);
            res.status(500).json({ error: 'Proxy Error' });
        });
});

const PORT = process.env.PORT || 80; // frontend 컨테이너 내부 포트 (docker-compose.yml과 일치)
app.listen(PORT, () => {
    console.log(`Frontend Server listening on port ${PORT}`);
});
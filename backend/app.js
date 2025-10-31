const express = require('express');
const path = require('path');
const cors = require('cors'); // <-- cors 불러오기
const app = express();
const routes = require('./routes');
const PORT = process.env.PORT || 8000;
const messages = require('./routes/messages');
const sajuRouter = require('./routes/saju'); // 파일 경로가 saju.js라고 가정

// ⚠️ Pug 템플릿 렌더링을 위해 주석 해제가 필요합니다.
 app.set("view engine", "pug"); 
 app.set("views", path.join(__dirname, "views")); 

app.use(cors()); // <-- 모든 도메인의 요청을 허용하는 미들웨어 추가
app.use(express.json()); // <-- JSON 요청을 파싱하기 위해 추가
app.use(express.urlencoded({ extended: false }));

// 라우팅: sajuRouter는 /api/saju/healthz 및 /api/saju를 처리합니다.
app.use('/api', sajuRouter); 
app.use('/api', routes); // <-- /api/messages 등의 API를 처리할 것으로 가정

// --- 환경 변수 확인 및 DB 연결 (기존과 동일) ---
if (!process.env.PORT) {
    const errMsg = "PORT environment variable is not defined";
    console.error(errMsg);
    throw new Error(errMsg);
}

if (!process.env.GUESTBOOK_DB_ADDR) {
    const errMsg = "GUESTBOOK_DB_ADDR environment variable is not defined";
    console.error(errMsg);
    throw new Error(errMsg);
}
messages.connectToMongoDB();

app.listen(PORT, () => {
    console.log(`Backend API Server listening on port ${PORT}`);
});

module.exports = app;

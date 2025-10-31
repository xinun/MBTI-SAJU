# --- 1단계: 빌드 스테이지 (주방) ---
# 'builder'라는 별명을 가진 빌드 환경을 시작합니다.
# 최신 LTS 버전인 node:20을 사용합니다.
FROM node:20 AS builder

WORKDIR /frontend

# package.json 파일을 먼저 복사하여 모든 의존성을 설치합니다.
COPY package*.json ./
RUN npm install

# 소스 코드 전체를 복사합니다.
COPY . .


# --- 2단계: 최종 스테이지 (작은 포장 상자) ---
# 'alpine'은 매우 가벼운 리눅스 배포판입니다.
FROM node:20-alpine

WORKDIR /frontend

# 빌드 스테이지에서 만들어진 node_modules와 소스 코드만 복사해옵니다.
# 개발 도구나 불필요한 파일은 모두 이 단계에서 버려집니다.
COPY --from=builder /frontend/node_modules ./node_modules
COPY --from=builder /frontend .

# 컨테이너 시작 시 실행할 명령어
ENTRYPOINT ["node", "--inspect=9229", "app.js"]

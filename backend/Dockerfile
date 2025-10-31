# --- 1단계: 빌드 스테이지 ---
# 'builder'라는 별명을 가진 빌드 환경을 시작합니다.
FROM node:20 AS builder

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# package.json 파일을 먼저 복사하여 의존성을 설치합니다.
COPY package*.json ./
RUN npm install

# 소스 코드 전체를 복사합니다.
COPY . .


# --- 2단계: 최종 스테이지 ---
# 'alpine' 버전은 매우 가벼운 리눅스입니다.
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 빌드 스테이지에서 만들어진 node_modules와 소스 코드만 복사해옵니다.
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# 서버가 사용할 포트 지정
EXPOSE 8000

# 컨테이너 시작 시 실행할 명령어
CMD [ "npm", "start" ]

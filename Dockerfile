# builder 스테이지: 애플리케이션 빌드
FROM node:20-alpine as builder
# Line 2
# 작업 디렉토리 설정
WORKDIR /api
# Line 3
# package.json과 package-lock.json 복사
COPY package*.json ./
# Line 4
# 모든 의존성 설치 (devDependencies 포함)
RUN npm install
# Line 5
# 소스 코드 전체 복사
COPY . .
# Line 6
# 애플리케이션 빌드 및 프로덕션용 의존성만 남기기
RUN npm run build \
    && npm prune --production

# Line 7
# production 스테이지: 빌드된 애플리케이션 실행
FROM node:20-alpine
# Line 8
# 프로덕션 환경 변수 설정
ENV NODE_ENV production
# Line 9
# 작업 디렉토리 설정
WORKDIR /api
# Line 10
# builder 스테이지에서 필요한 파일들만 복사
COPY --from=builder /api/package*.json ./
COPY --from=builder /api/node_modules/ ./node_modules/
COPY --from=builder /api/dist/ ./dist/
# Line 11
# 애플리케이션 실행 (CMD 경로 수정)
CMD ["node", "dist/main.js"]
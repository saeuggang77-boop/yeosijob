# 여시알바 E2E 테스트

Playwright를 사용한 End-to-End 테스트 스위트입니다.

## 설정

### 사전 요구사항

```bash
npm install
npx playwright install
```

### 환경 변수

테스트 대상 URL을 환경변수로 지정할 수 있습니다:

```bash
# 로컬 개발 서버 (기본값)
E2E_BASE_URL=http://localhost:3001 npm run test:e2e

# 프로덕션 환경
E2E_BASE_URL=https://yeosijob.com npm run test:e2e
```

## 테스트 실행

### 기본 실행 (헤드리스)

```bash
npm run test:e2e
```

### UI 모드로 실행

```bash
npm run test:e2e:ui
```

### 브라우저를 띄워서 실행

```bash
npm run test:e2e:headed
```

### 디버그 모드

```bash
npm run test:e2e:debug
```

### 특정 파일만 실행

```bash
npx playwright test public-pages.spec.ts
```

### 특정 테스트만 실행

```bash
npx playwright test -g "로그인 페이지"
```

## 테스트 파일 구조

### `public-pages.spec.ts`
공개 페이지 접속 및 기본 요소 확인
- 메인, 커뮤니티, 구인구직, 로그인, 회원가입, 약관 등
- 500 에러 없는지 확인

### `auth-flow.spec.ts`
인증 관련 흐름 테스트
- 로그인/회원가입 폼 확인
- 비밀번호 찾기
- 필수 필드 확인
- 사업자번호 필드 없음 확인
- 보호된 페이지 접근 시 리다이렉트

### `community.spec.ts`
커뮤니티 기능 테스트
- 게시글 목록/상세 페이지
- 카테고리 탭
- 검색 기능
- 페이지네이션

### `navigation.spec.ts`
네비게이션 및 링크 유효성
- 헤더/푸터 링크 확인
- 내부 링크 유효성 검사
- 404 페이지 테스트
- 모바일 메뉴 토글

### `business-flow.spec.ts`
사장 회원 전용 기능
- 사장 회원가입 (사업자번호 없이)
- 구인광고 등록 페이지 접근 제어
- 대시보드/프로필 접근 제어

## 주의사항

- **읽기 전용 테스트**: 실제 데이터를 생성/변경하지 않습니다
- **폼 검증 위주**: 폼 요소 존재 및 유효성 검사 중심
- **한글 텍스트**: 한국어로 assertion 작성
- **자동 스크린샷**: 실패 시 자동으로 스크린샷 저장

## 결과 확인

테스트 실행 후 리포트 확인:

```bash
npx playwright show-report
```

## CI/CD 통합

```yaml
# .github/workflows/e2e.yml 예시
- name: Run E2E tests
  run: |
    npm run build
    npm start &
    npx wait-on http://localhost:3001
    npm run test:e2e
```

## 트러블슈팅

### 포트 충돌
기본 포트 3001이 사용 중이면 다른 포트 지정:

```bash
E2E_BASE_URL=http://localhost:3002 npm run test:e2e
```

### 브라우저 설치 필요
```bash
npx playwright install chromium
```

### 타임아웃 에러
느린 네트워크 환경에서는 `playwright.config.ts`의 `timeout` 값을 늘리세요.

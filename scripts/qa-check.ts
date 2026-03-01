#!/usr/bin/env tsx
/**
 * QA 자동 검사 스크립트
 * - Dead Link 검사
 * - API 경로 일치 검사
 * - 환경변수 검사
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const APP_DIR = path.join(SRC_DIR, 'app');
const API_DIR = path.join(APP_DIR, 'api');

interface LinkReference {
  file: string;
  line: number;
  link: string;
}

interface ApiReference {
  file: string;
  line: number;
  endpoint: string;
}

interface QAResults {
  deadLinks: LinkReference[];
  validLinks: number;
  missingApis: ApiReference[];
  validApis: number;
  missingEnvVars: string[];
  emptyEnvVars: string[];
  validEnvVars: number;
}

/**
 * 디렉토리 재귀 탐색하여 파일 목록 반환
 */
function getAllFiles(dir: string, exts: string[]): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // node_modules, .next 등 제외
      if (!item.startsWith('.') && item !== 'node_modules') {
        files.push(...getAllFiles(fullPath, exts));
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (exts.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * 파일에서 내부 링크 추출
 */
function extractLinks(filePath: string): LinkReference[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const links: LinkReference[] = [];

  // href="/...", Link href="/...", router.push("/..."), redirect("/...") 등
  const patterns = [
    /href=["']([^"']+)["']/g,
    /router\.push\(["']([^"']+)["']/g,
    /redirect\(["']([^"']+)["']/g,
    /navigate\(["']([^"']+)["']/g,
  ];

  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const link = match[1];

        // 외부 URL, 앵커, 상대경로 제외
        if (
          !link.startsWith('http://') &&
          !link.startsWith('https://') &&
          !link.startsWith('#') &&
          !link.startsWith('mailto:') &&
          !link.startsWith('tel:') &&
          link.startsWith('/')
        ) {
          // 쿼리 파라미터 제거
          const cleanLink = link.split('?')[0].split('#')[0];
          links.push({
            file: path.relative(PROJECT_ROOT, filePath),
            line: index + 1,
            link: cleanLink,
          });
        }
      }
    });
  });

  return links;
}

/**
 * 파일에서 API 호출 추출
 */
function extractApiCalls(filePath: string): ApiReference[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const apis: ApiReference[] = [];

  // fetch("/api/..."), axios.get("/api/...") 등
  const patterns = [
    /fetch\(["']([^"']+)["']/g,
    /axios\.(get|post|put|patch|delete)\(["']([^"']+)["']/g,
    /\$fetch\(["']([^"']+)["']/g,
  ];

  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        // axios의 경우 match[2], 나머지는 match[1]
        const endpoint = match[2] || match[1];

        // /api/로 시작하는 것만
        if (endpoint && endpoint.startsWith('/api/')) {
          // 쿼리 파라미터 제거
          const cleanEndpoint = endpoint.split('?')[0];
          apis.push({
            file: path.relative(PROJECT_ROOT, filePath),
            line: index + 1,
            endpoint: cleanEndpoint,
          });
        }
      }
    });
  });

  return apis;
}

/**
 * app 디렉토리에서 유효한 라우트 추출
 */
function getValidRoutes(appDir: string): Set<string> {
  const routes = new Set<string>();

  function scanDir(dir: string, urlPath: string) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // 라우트 그룹 (group)은 URL에서 제외
        if (item.startsWith('(') && item.endsWith(')')) {
          scanDir(fullPath, urlPath);
        } else {
          const newPath = urlPath + '/' + item;
          scanDir(fullPath, newPath);
        }
      } else if (item === 'page.tsx' || item === 'page.ts') {
        // 이 디렉토리가 유효한 라우트
        routes.add(urlPath || '/');
      }
    }
  }

  scanDir(appDir, '');
  return routes;
}

/**
 * 동적 라우트 패턴 매칭 ([id], [slug] 등)
 */
function matchesDynamicRoute(link: string, routes: Set<string>): boolean {
  // 정확히 일치하는 라우트가 있으면 true
  if (routes.has(link)) {
    return true;
  }

  // 동적 라우트 패턴으로 매칭
  const linkParts = link.split('/').filter(Boolean);

  for (const route of routes) {
    const routeParts = route.split('/').filter(Boolean);

    if (linkParts.length !== routeParts.length) {
      continue;
    }

    let matches = true;
    for (let i = 0; i < linkParts.length; i++) {
      const routePart = routeParts[i];
      const linkPart = linkParts[i];

      // [param] 형태는 와일드카드
      if (routePart.startsWith('[') && routePart.endsWith(']')) {
        continue;
      }

      if (routePart !== linkPart) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return true;
    }
  }

  return false;
}

/**
 * API 라우트 목록 추출
 */
function getValidApiRoutes(apiDir: string): Set<string> {
  const routes = new Set<string>();

  function scanDir(dir: string, urlPath: string) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const newPath = urlPath + '/' + item;
        scanDir(fullPath, newPath);
      } else if (item === 'route.ts') {
        // 이 디렉토리가 유효한 API 라우트
        routes.add(urlPath);
      }
    }
  }

  scanDir(apiDir, '/api');
  return routes;
}

/**
 * 환경변수 검사
 */
function checkEnvVars(): {
  missing: string[];
  empty: string[];
  valid: number;
} {
  const examplePath = path.join(PROJECT_ROOT, '.env.example');
  const envPath = path.join(PROJECT_ROOT, '.env');

  if (!fs.existsSync(examplePath)) {
    console.warn('⚠️ .env.example 파일이 없습니다.');
    return { missing: [], empty: [], valid: 0 };
  }

  const exampleContent = fs.readFileSync(examplePath, 'utf-8');
  const exampleVars = exampleContent
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => line.split('=')[0].trim());

  if (!fs.existsSync(envPath)) {
    return {
      missing: exampleVars,
      empty: [],
      valid: 0,
    };
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envMap = new Map<string, string>();

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
      envMap.set(key.trim(), value);
    }
  });

  const missing: string[] = [];
  const empty: string[] = [];
  let valid = 0;

  for (const varName of exampleVars) {
    if (!envMap.has(varName)) {
      missing.push(varName);
    } else {
      const value = envMap.get(varName)!;
      if (!value) {
        empty.push(varName);
      } else {
        valid++;
      }
    }
  }

  return { missing, empty, valid };
}

/**
 * 메인 검사 실행
 */
async function runQA(): Promise<QAResults> {
  console.log('🔍 QA 자동 검사 시작...\n');

  // 1. Dead Link 검사
  console.log('=== Dead Link 검사 ===');
  const sourceFiles = getAllFiles(SRC_DIR, ['.tsx', '.ts']);
  const allLinks: LinkReference[] = [];

  sourceFiles.forEach(file => {
    const links = extractLinks(file);
    allLinks.push(...links);
  });

  const validRoutes = getValidRoutes(APP_DIR);
  const deadLinks: LinkReference[] = [];
  let validLinkCount = 0;

  allLinks.forEach(linkRef => {
    if (!matchesDynamicRoute(linkRef.link, validRoutes)) {
      deadLinks.push(linkRef);
    } else {
      validLinkCount++;
    }
  });

  console.log(`✅ 유효한 링크: ${validLinkCount}개`);
  if (deadLinks.length > 0) {
    console.log(`❌ Dead Link: ${deadLinks.length}개`);
    deadLinks.forEach(ref => {
      console.log(`  - ${ref.link} (참조: ${ref.file}:${ref.line})`);
    });
  } else {
    console.log('✅ Dead Link 없음');
  }
  console.log();

  // 2. API 경로 검사
  console.log('=== API 경로 검사 ===');
  const allApiCalls: ApiReference[] = [];

  sourceFiles.forEach(file => {
    const apis = extractApiCalls(file);
    allApiCalls.push(...apis);
  });

  const validApiRoutes = getValidApiRoutes(API_DIR);
  const missingApis: ApiReference[] = [];
  let validApiCount = 0;

  allApiCalls.forEach(apiRef => {
    if (!matchesDynamicRoute(apiRef.endpoint, validApiRoutes)) {
      missingApis.push(apiRef);
    } else {
      validApiCount++;
    }
  });

  console.log(`✅ 유효한 API: ${validApiCount}개`);
  if (missingApis.length > 0) {
    console.log(`❌ 불일치 API: ${missingApis.length}개`);
    missingApis.forEach(ref => {
      console.log(`  - ${ref.endpoint} (참조: ${ref.file}:${ref.line})`);
    });
  } else {
    console.log('✅ API 경로 불일치 없음');
  }
  console.log();

  // 3. 환경변수 검사
  console.log('=== 환경변수 검사 ===');
  const { missing, empty, valid } = checkEnvVars();

  console.log(`✅ 설정됨: ${valid}개`);

  if (missing.length > 0) {
    console.log(`❌ 누락됨: ${missing.length}개`);
    missing.forEach(varName => {
      console.log(`  - ${varName}`);
    });
  }

  if (empty.length > 0) {
    console.log(`⚠️ 비어있음: ${empty.length}개`);
    empty.forEach(varName => {
      console.log(`  - ${varName}`);
    });
  }

  if (missing.length === 0 && empty.length === 0) {
    console.log('✅ 환경변수 모두 정상');
  }
  console.log();

  return {
    deadLinks,
    validLinks: validLinkCount,
    missingApis,
    validApis: validApiCount,
    missingEnvVars: missing,
    emptyEnvVars: empty,
    validEnvVars: valid,
  };
}

/**
 * 실행 및 결과 반환
 */
runQA()
  .then(results => {
    console.log('=== 검사 완료 ===');

    const hasErrors =
      results.deadLinks.length > 0 ||
      results.missingApis.length > 0 ||
      results.missingEnvVars.length > 0;

    if (hasErrors) {
      console.log('❌ 문제가 발견되었습니다.');
      process.exit(1);
    } else {
      console.log('✅ 모든 검사 통과');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ 검사 실패:', error);
    process.exit(1);
  });

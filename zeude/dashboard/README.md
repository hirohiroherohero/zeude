# Zeude Dashboard

Next.js App Router 기반 AI 코딩 도구 모니터링 대시보드.

## 주요 기능

- **Overview** — 오늘의 세션, 비용, 토큰 사용량 요약
- **Daily** — 일별 사용 추이 차트
- **Sessions** — 세션별 상세 이벤트 조회
- **Leaderboard** — 팀원 간 사용량 랭킹
- **Skills** — 스킬 관리 및 배포
- **Admin** — 에이전트, MCP 서버, 훅, 팀 관리

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Database**: ClickHouse Cloud (텔레메트리), Supabase (유저/설정)
- **Deployment**: Vercel
- **UI**: shadcn/ui + Tailwind CSS + Recharts

## 시작하기

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env.local
# CLICKHOUSE_URL, SUPABASE_URL 등 설정

# 개발 서버
pnpm dev
```

## 데이터 파이프라인

```
Claude Code / Codex (OTEL HTTP/protobuf)
  → /api/otel/logs (Vercel Function)
  → ClickHouse Cloud (claude_code_logs 테이블)
  → 대시보드 페이지에서 쿼리
```

## 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `CLICKHOUSE_URL` | ClickHouse Cloud endpoint | Production |
| `CLICKHOUSE_USER` | ClickHouse 사용자 | Production |
| `CLICKHOUSE_PASSWORD` | ClickHouse 비밀번호 | Production |
| `CLICKHOUSE_DATABASE` | 데이터베이스 이름 | No (default: `default`) |
| `SUPABASE_URL` | Supabase 프로젝트 URL | Production |
| `SUPABASE_ANON_KEY` | Supabase anon key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Production |
| `SKIP_AUTH` | 개발 모드 인증 스킵 | No |
| `MOCK_EMAIL` | 개발 모드 테스트 이메일 | No |

## 로컬 ClickHouse (Docker)

```bash
docker compose -f docker-compose.dev.yaml up -d
# 스키마는 clickhouse/init.sql에서 자동 적용
```

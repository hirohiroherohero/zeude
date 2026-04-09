# Zeude 도입 프로젝트 — 작업 진행 체크리스트

> 이 문서는 Claude가 다음 대화에서 읽고 현재 상태를 파악하기 위한 문서입니다.

---

## 현재 상태 요약

- **대시보드 배포 완료**: https://zeude-vwuo.vercel.app
- **GitHub Fork**: https://github.com/hirohiroherohero/zeude
- **Supabase 프로젝트**: `jccrfdkprilwmkklklef` (클라우드, 마이그레이션 완료)
- **로컬 CLI 설치 완료**: `~/.zeude/bin/claude`, `~/.zeude/bin/zeude`
- **Admin 유저 생성 완료**: agent_key = `zd_e97367830819ce334160a7a28d2b395a0b26f9021593ac86420004aaa1dbace1`
- **GitHub Releases 배포 완료**: https://github.com/hirohiroherohero/zeude/releases/tag/v0.1.0
- **dashboard_url 변경 완료**: `~/.zeude/config` → Vercel URL로 업데이트

---

## 완료된 작업

- [x] Git clone 및 로컬 환경 구성
- [x] Supabase DB 마이그레이션
- [x] .env 파일 설정 (루트 + dashboard)
- [x] Admin 유저 생성 (SQL) 및 role 설정
- [x] Go 빌드 (build-release.sh)
- [x] CLI 수동 설치 (~/.zeude/bin)
- [x] 로컬 대시보드 실행 및 OTT 인증 테스트
- [x] GitHub Fork (hirohiroherohero/zeude)
- [x] Git remote 변경 (origin → Fork, upstream → 원본)
- [x] 코드 수정사항 3개 커밋으로 push
- [x] Vercel 배포 (환경변수 설정, Deployment Protection 해제)
- [x] Vercel 대시보드 OTT 로그인 성공
- [x] 문서 작성 (발표자료, 기능가이드, 시행착오, 코드분석, DB스펙)
- [x] `~/.zeude/config`의 `dashboard_url`을 Vercel URL로 업데이트
- [x] GitHub Releases v0.1.0 배포 (CLI 바이너리 12개 업로드)
- [x] 팀원용 CLI 설치 가이드 작성 (`docs/06-팀원-온보딩-가이드.md`)
- [x] gh CLI 설치 및 GitHub 인증

---

## 남은 작업

### 즉시 필요

- [x] 대시보드 기능 테스트 (Skills, Hooks, MCP, Agents 생성해보기)
- [x] `NEXT_PUBLIC_APP_URL` 환경변수 Vercel에 추가
  - 값: `https://zeude-vwuo.vercel.app`
  - 추가 후 Redeploy 필요
  - **이거 안 하면 초대 링크 URL이 `zeude.zep.work`(원본 기본값)으로 생성됨**

### PoC 준비 (승인 후)

- [ ] 팀원 4~5명 초대 (Team → Invite)
- [ ] 공용 스킬 2~3개 생성 (code-review, test-writer 등)
- [ ] 공용 훅 1~2개 생성 (프롬프트 로깅 등)

### ClickHouse 연동 (선택)

- [ ] ClickHouse Cloud 가입 (30일 무료, $300 크레딧)
- [ ] Vercel 환경변수에 ClickHouse 연결 정보 추가
- [ ] OTel Collector 설정 및 배포
- [ ] Overview/Sessions/Analytics 기능 테스트

### 발표 전

- [ ] 대시보드에 데이터가 있는 상태로 시연 준비
- [ ] 발표자료 최종 검토 (docs/01-발표자료.md)

---

## 주요 설정 정보

### Vercel 환경변수 (현재 설정됨)

| Key | 상태 |
|-----|------|
| `SUPABASE_URL` | ✅ 설정됨 |
| `SUPABASE_ANON_KEY` | ✅ 설정됨 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 설정됨 |
| `CLICKHOUSE_URL` | ✅ 더미값 |
| `CLICKHOUSE_USER` | ✅ 더미값 |
| `CLICKHOUSE_PASSWORD` | ✅ 더미값 |
| `CLICKHOUSE_DATABASE` | ✅ 더미값 |
| `NEXT_PUBLIC_APP_URL` | ✅ 설정됨 |

### 로컬 설정 파일 경로

| 파일 | 용도 |
|------|------|
| `~/.zeude/credentials` | agent_key 저장 |
| `~/.zeude/config` | endpoint, dashboard_url |
| `~/.zeude/bin/claude` | zeude shim 바이너리 |
| `~/.zeude/bin/zeude` | zeude doctor 바이너리 |
| `~/.zeude/real_binary_path` | 원본 claude 경로 |
| `~/.claude/commands/zeude.md` | /zeude 스킬 |

### Git 리모트 구성

```
origin   → https://github.com/hirohiroherohero/zeude.git (내 Fork)
upstream → https://github.com/zep-us/zeude.git (원본)
```

---

## 문서 목록

| 파일 | 내용 |
|------|------|
| `docs/01-발표자료.md` | 전사 발표용 문서 |
| `docs/02-기능-사용-가이드.md` | Skills, Hooks, MCP, Agents 사용법 |
| `docs/03-설치-시행착오.md` | 설치 과정에서 겪은 문제와 해결 |
| `docs/04-코드분석-개선점.md` | 코드 품질/아키텍처 개선 포인트 |
| `docs/05-DB-스펙.md` | Supabase/ClickHouse 테이블 상세 |
| `docs/06-팀원-온보딩-가이드.md` | 팀원용 설치/가입 가이드 |
| `docs/PROGRESS.md` | 이 문서 (작업 체크리스트) |

---

## 리브랜딩 가이드 (로고/이름 변경)

Apache 2.0 라이선스 하에서 Fork한 프로젝트의 로고/이름을 우리 것으로 교체하는 것은 **법적으로 허용되며, 커뮤니티 관례상 권장**된다.

### 할 수 있는 것
- 로고, 이름을 우리 회사 브랜딩으로 완전 교체
- UI 텍스트, 색상 등 자유롭게 수정

### 반드시 지켜야 할 것
- LICENSE 파일의 원본 저작권 표시 유지 (삭제 금지)
- 코드 헤더의 Copyright 표시 유지
- NOTICE 파일에 원본 출처 명시 (예: `Based on Zeude by ZEP (https://github.com/zep-us/zeude)`)
- 수정사항이 있음을 명시

### 참고 사례
- OpenOffice → LibreOffice (이름+로고 완전 교체)
- MySQL → MariaDB (이름+로고 완전 교체)

### 주의
- 원본 로고를 그대로 쓰면서 우리 서비스인 것처럼 보이게 하면 오히려 **상표권 문제** 가능
- Fork했으면 **리브랜딩하는 게 올바른 방법**

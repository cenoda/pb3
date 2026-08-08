# 3D PC Builder

설명 가능한 성능 예측과 실제 치수 기반 3D 물리 검증을 연결하는 프로젝트입니다.

현재 저장소는 방향 문서, **0단계 수직 슬라이스 계약**, 그리고 **fixture 데이터**까지 준비된 단계입니다. 구현 언어·프레임워크·런타임 스캐폴드가 다음 작업입니다.

## 문서

- [프로젝트 헌장](PROJECT_CHARTER.md)
- [현재 상태](STATUS.md)
- [에이전트 규칙 (AGENTS.md)](AGENTS.md) ← Aria / Lira / Nox 공통 브리프
- [Phase 0 홈](docs/phases/phase-0/) ← TODO · fixes · specs
- [Phase 0 범위](docs/phases/phase-0/specs/phase-0.md) ← 범위·금지·종료 조건
- [Phase 0 데이터 계약 (`vs0`)](docs/phases/phase-0/specs/vertical-slice-data-contract.md)
- [개발 단계](docs/roadmap/PHASES.md)
- [데이터 문서 안내](docs/data/README.md)
- [의사결정 기록 안내](docs/decisions/README.md)
- [부품 데이터 안내](parts/README.md)
- [벤치마크 데이터 안내](benchmarks/README.md)

## 현재 원칙

- 완성형 생산 `part.json`이나 전체 벤치 파이프라인을 지금 설계하지 않는다.
- 0단계 최소 계약(`vs0`) 밖으로 필드를 미리 넓히지 않는다.
- 스택 스캐폴드는 fixture로 계약 흐름이 증명된 뒤에 한다.
- 0단계 고정 범위 밖으로 부품·기능을 확장하지 않는다.

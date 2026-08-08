# 개발 단계

세부 원칙과 범위는 [프로젝트 헌장](../../PROJECT_CHARTER.md)을 기준으로 한다.

1. **0단계 — 수직 슬라이스**: 전체 흐름의 기술적 연결 검증  
   - 홈: [`../phases/phase-0/`](../phases/phase-0/)  
   - 범위: [`../phases/phase-0/specs/phase-0.md`](../phases/phase-0/specs/phase-0.md)  
   - 데이터 계약: [`../phases/phase-0/specs/vertical-slice-data-contract.md`](../phases/phase-0/specs/vertical-slice-data-contract.md)
2. **1단계 — 성능 예측 엔진**: 설명 가능한 기준 성능과 제한된 환경 보정
3. **2단계 — 기본 견적 서비스**: 일반 부품 선택과 논리 호환성, 저장·공유
4. **3단계 — 3D 조립 및 물리 검증**: 자동 장착, 충돌, 여유 공간, 냉각 연동

단계는 순서대로 진행한다. Phase 0과 Phase 1은 완료됐다. **Phase 2 M0 계획 게이트**는 통과했다 — 범위·계약·`implementation_plan.md` 세 문서가 [`docs/phases/phase-2/`](../phases/phase-2/)에서 소유자 승인 완료(2026-08-08)됐고, 미해결 결정도 모두 확정됐다. Phase 2 구현은 소유자의 별도 "start implementation" 지시가 있어야 시작한다 — 아직 시작하지 않았다.

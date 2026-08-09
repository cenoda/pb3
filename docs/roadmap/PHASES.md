# 개발 단계

세부 원칙과 범위는 [프로젝트 헌장](../../PROJECT_CHARTER.md)을 기준으로 한다.

1. **0단계 — 수직 슬라이스**: 전체 흐름의 기술적 연결 검증
   - 홈: [`../phases/phase-0/`](../phases/phase-0/)
   - 범위: [`../phases/phase-0/specs/phase-0.md`](../phases/phase-0/specs/phase-0.md)
   - 데이터 계약: [`../phases/phase-0/specs/vertical-slice-data-contract.md`](../phases/phase-0/specs/vertical-slice-data-contract.md)
2. **1단계 — 성능 예측 엔진**: 설명 가능한 기준 성능과 제한된 환경 보정
3. **2단계 — 기본 견적 서비스**: 일반 부품 선택과 논리 호환성, 저장·공유
4. **3단계 — 3D 조립 및 물리 검증**: 자동 장착, 충돌, 여유 공간, 냉각 연동

Phase 0–3은 모두 구현·검증·소유자 closeout까지 완료됐다 (2026-08-08).

5. **4단계 — Evidence-grade data and validation**: 단일 빌드 evidence pilot
   - 홈: [`../phases/phase-4/`](../phases/phase-4/)
   - 범위: [`../phases/phase-4/specs/phase-4.md`](../phases/phase-4/specs/phase-4.md)
   - provenance 계약 (`prov4`): [`../phases/phase-4/specs/provenance-data-contract.md`](../phases/phase-4/specs/provenance-data-contract.md)
   - 구현 계획: [`../phases/phase-4/implementation_plan.md`](../phases/phase-4/implementation_plan.md)

Phase 4 M0 계획 패키지(스코프·`prov4` 계약·`implementation_plan.md`·D1–D16/O1–O4)는
2026-08-09 소유자 수락됐고, 별도 승인 후 구현 Steps 1–8과 software gate까지
완료됐다. Step 9 evidence-quality closeout은 캡처 진위와 증거 품질에 대한
명시적 owner PASS 전까지 미완료로 남는다. 후속 phase는 아직 M0로 계획되지
않았으며, Phase 4 closeout 후 별도 스코프·계약·구현 계획 수락이 필요하다.

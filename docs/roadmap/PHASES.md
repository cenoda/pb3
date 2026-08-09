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
완료됐으나, 2026-08-09 검토에서 first-party 주장의 근거가 없는 것으로 판정됐다.
해당 측정 주장·source·파생 raw summary는 제거됐고 3개 성능 셀은 모두 명시적
synthetic stub으로 되돌렸다. **외부 벤치마크 교정 패키지
[`../corrections/phase4-external-evidence-1/`](../corrections/phase4-external-evidence-1/)
Steps 1–5 구현 완료 (2026-08-09)** — aggregation engine, source-rights record,
audit-only observation fixtures, UI disclosure; exact-match product FPS는 여전히
unavailable → perf1 synthetic fallback. Step 9은 소유자 PASS 전까지 blocked.

### Phase 4.1 sub-path (not Phase 5)

Exact-only 외부 집계만으로는 임의 조합 예측이 불가능하다는 제품 판정 하에,
**조합 성능 추정 함수** 논의를 위한 서브 경로를 연다 (2026-08-09).

- 홈: [`../phases/phase-4.1/`](../phases/phase-4.1/)
- 알고리즘: [`../phases/phase-4.1/ALGORITHM_DISCUSSION.md`](../phases/phase-4.1/ALGORITHM_DISCUSSION.md)
  §0 — **O1–O9 소유자 잠금 (2026-08-09)**
- M0 패키지 초안: [`specs/phase-4.1.md`](../phases/phase-4.1/specs/phase-4.1.md),
  [`est1` 계약](../phases/phase-4.1/specs/estimator-data-contract.md),
  [`implementation_plan.md`](../phases/phase-4.1/implementation_plan.md)
- **임시 초안 함수**: 메인보드·냉각·케이스 공랭·비기본 전력 한도는 미모델;
  후속 보정 예정. `est1` M0 software는 구현됨; **Path A 데이터 큐레이션**
  ([`DATA_CURATION_CHECKLIST.md`](../phases/phase-4.1/DATA_CURATION_CHECKLIST.md))
  이 다음 작업. Phase 5 아님.

### Corrective gate (not a charter phase)

Phase 0–4 앱 **제품 표면**에 대한 교정 게이트가 docs 패키지로 준비됐다
(baseline `e73602a`). Phase 5가 아니며, 로드맵 단계를 대체·삽입하지 않는다.

- 홈: [`../corrections/product-ux-1/`](../corrections/product-ux-1/)
- 인덱스: [`../corrections/README.md`](../corrections/README.md)
- 상태: 구현 software path + 소유자 UX walkthrough PASS, formal closeout 완료
  (2026-08-09); Phase 4 Step 9·Phase 5 변경 없음

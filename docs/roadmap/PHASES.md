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
unavailable → perf1 synthetic fallback.

### Freeze (owner, 2026-08-09)

**Phase 4 + 4.1 active product work is frozen.**  
Record: [`../phases/phase-4/FREEZE.md`](../phases/phase-4/FREEZE.md).

Shipped and agreed as baseline: evidence discipline (`prov4`), honest empty
external FPS, `est1` temporary draft estimator software, AMD manufacturer
**specs** catalog auto-harvest as multi-CPU **sim inputs** (not game FPS tables).
Full spec→FPS simulation and Step 9 owner evidence PASS are **not** claimed;
resume only with explicit unfreeze.

**Phase 5 may proceed in parallel** (separate M0 package). Phase 5 must not
silently break frozen `prov4`/`est1` contracts.

### Phase 4.1 sub-path (frozen with Phase 4)

- 홈: [`../phases/phase-4.1/`](../phases/phase-4.1/)
- Freeze: [`../phases/phase-4.1/FREEZE.md`](../phases/phase-4.1/FREEZE.md)
- `est1` M0 software + AMD vendor-catalog spine: shipped; further Path A / sim
  expansion **paused**

6. **5단계 — 제품 표면 (Product surface)**: Phase 0–4 엔진 위에 처음 보는 사람이
   쓸 수 있는 화면을 만든다
   - 홈: [`../phases/phase-5/`](../phases/phase-5/)
   - 범위: [`../phases/phase-5/specs/phase-5.md`](../phases/phase-5/specs/phase-5.md)
   - 구현 계획: [`../phases/phase-5/implementation_plan.md`](../phases/phase-5/implementation_plan.md)
   - 새 계약 없음. 표시 계층만 교체하고 엔진은 읽기 전용.
   - 종료 조건은 헌장 0단계와 같은 문법 — 계약 준수가 아니라 **사용자 동작 5개**,
     오너가 브라우저에서 직접 수행해 판정한다.
   - 상태: **구현 Steps 1–8 완료 (2026-08-09).** 기록: `docs/phases/phase-5/STEPS.md`.
     Step 9(오너 브라우저 walkthrough)는 열려 있고, 그것이 통과 판정 기준이다.

### Corrective gate (closed — Phase 5로 흡수)

제품 표면 작업은 더 이상 교정 게이트가 아니라 **Phase 5**다. 교정 트랙은 닫혔고,
두 패키지는 증거로만 보관한다. 새 제품 표면 교정 게이트를 열지 말 것 — Phase 5를
확장한다.

- [`../corrections/product-ux-1/`](../corrections/product-ux-1/) — 앱 셸 구현
  + 오너 walkthrough PASS, closeout 완료 (2026-08-09)
- [`../corrections/product-ux-2/`](../corrections/product-ux-2/) — `095f551`
  기준 제품 여정 감사, 판정 **FAIL**; Phase 5 범위의 근거
- 인덱스: [`../corrections/README.md`](../corrections/README.md)
- Phase 4 Step 9 변경 없음 (동결 유지)

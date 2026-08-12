# Baatmeedar — Stage-Wise Verification & Troubleshooting Workflow

## Objective

Verify the deployed Baatmeedar website and backend **stage by stage**.

The verification agent must:

1. Verify the current stage completely.
2. Identify and troubleshoot all errors.
3. Fix the errors where possible.
4. Re-run the stage after fixes.
5. Confirm the stage is working correctly.
6. Only then proceed to the next stage.

**Do not skip stages. Do not proceed if the current stage is failing.**

---

# Stage 1 — User Input & Information Extraction

## Supported Inputs

The user can provide information in three ways:

### 1. Direct Statement

Example:

> "India won the match yesterday."

The statement should be accepted directly as the initial information.

### 2. Article Link

If the user provides an article URL:

- Access the article through the **Tavily API**.
- Retrieve the relevant article content.
- Extract the readable text.
- Store the extracted article text as the initial information.

### 3. YouTube Link

If the user provides a YouTube URL:

- Detect that the input is a YouTube link.
- Retrieve the YouTube transcript using the configured YouTube transcript API/service.
- Store the transcript as the initial information.

## Stage 1 Verification

The verification agent must test:

- Direct text input.
- Valid article URL.
- Invalid article URL.
- Valid YouTube URL.
- YouTube video without transcript.
- Invalid/unsupported input.
- Empty input.
- API failures.
- Timeout/network failures.
- Malformed API responses.

### Stage 1 Completion Criteria

Stage 1 is complete only when:

- All supported input types work.
- Extracted information is correctly stored.
- Errors are handled gracefully.
- API failures do not crash the application.
- The website correctly displays the processing status/result.

**After fixing any issue, repeat the Stage 1 tests.**

Only proceed to Stage 2 when Stage 1 passes completely.

---

# Stage 2 — Claim Extraction & Domain Identification

The Stage 1 information is processed using the **Gemini API**.

Gemini must:

1. Remove opinions and subjective statements where appropriate.
2. Identify factual claims.
3. Extract individual claims separately.
4. Identify the domain/category relevant to each claim.
5. Store the extracted claims and domains as Stage 2 information.

## Example

Input:

> "The government launched a new program last month, and I think it will completely solve unemployment."

Expected extraction:

```text
Claim:
The government launched a new program last month.

Domain:
Government / Policy
```

The opinion:

```text
"I think it will completely solve unemployment."
```

should not be treated as a factual claim unless the system explicitly supports opinion analysis.

## Stage 2 Verification

Test:

- Single factual statement.
- Multiple claims.
- Mixed factual and opinion statements.
- Long articles.
- YouTube transcripts.
- Statements containing multiple domains.
- Ambiguous claims.
- Claims with dates/numbers.
- Empty Gemini response.
- Gemini API failure.
- Invalid Gemini response.
- Duplicate claims.

### Stage 2 Completion Criteria

Stage 2 is complete only when:

- Claims are correctly extracted.
- Opinions are appropriately removed.
- Each claim has a domain.
- Claims are stored correctly.
- Stage 2 data can be retrieved by Stage 3.
- Gemini failures are handled safely.

**Fix and re-test until Stage 2 passes completely.**

Only then proceed to Stage 3.

---

# Stage 3 — Claim-by-Claim Evidence Research

Each Stage 2 claim must be processed **individually**.

For every claim:

```text
Stage 2 Claim
      ↓
Domain Identification
      ↓
Hermes Agent Planning
      ↓
Tavily Web Search
      ↓
Groq API Processing
      ↓
Gemini API Processing
      ↓
Evidence Extraction
      ↓
Stage 3 Information
```

## Research Requirements

For every claim, the system should:

1. Pass the claim and domain to the research agents.
2. Use the **Hermes agent** for research/planning.
3. Use **Tavily** for web search.
4. Use **Groq API** for information processing.
5. Use **Gemini API** for information processing.
6. Extract relevant evidence from the research.
7. Store the resulting evidence as Stage 3 information.

Each claim must remain separately identifiable.

## Stage 3 Data

The stored information should maintain a relationship such as:

```text
Claim ID
├── Original Claim
├── Domain
├── Search Queries
├── Sources
├── Retrieved Information
├── Groq Analysis
└── Gemini Analysis
```

## Stage 3 Verification

The verification agent must test:

- One claim.
- Multiple claims.
- Claims from different domains.
- Claims requiring multiple searches.
- Claims with no reliable evidence.
- Conflicting sources.
- Tavily API failure.
- Groq API failure.
- Gemini API failure.
- Hermes agent failure.
- Search timeout.
- Empty search results.
- Duplicate search results.
- Incorrect domain assignment.
- Incorrect claim-to-evidence mapping.

### Stage 3 Completion Criteria

Stage 3 is complete only when:

- Every Stage 2 claim is processed.
- Research is performed independently for each claim.
- Evidence is correctly associated with the corresponding claim.
- Sources are stored.
- API failures are handled.
- Partial failures do not corrupt other claims.
- Stage 3 information is available for Stage 4.

**Fix every discovered problem and repeat the complete Stage 3 verification.**

Only proceed when Stage 3 passes.

---

# Stage 4 — Stage 2 vs Stage 3 Verification

Stage 3 evidence must now be compared against the original Stage 2 claims.

The comparison must be performed **individually by Groq and Gemini**.

```text
             Stage 2 Claim
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   Stage 3 Evidence    Stage 3 Evidence
        ↓                   ↓
     Groq API           Gemini API
        ↓                   ↓
   Groq Result         Gemini Result
```

Each model should independently determine whether the claim is supported by the available evidence.

## Required Result

For every claim, produce:

- Original claim.
- Domain.
- Evidence found.
- Relevant sources.
- Groq assessment.
- Gemini assessment.
- Final claim status.
- Explanation/reasoning summary.

Possible statuses may include:

```text
TRUE
FALSE
PARTIALLY TRUE
UNVERIFIED
CONFLICTING EVIDENCE
```

The system should not force a claim into TRUE/FALSE when the available evidence is insufficient.

---

# Stage 5 — Final Result Generation

After Groq and Gemini independently compare Stage 2 claims against Stage 3 evidence, generate the final result.

The final output must preserve **claim-level transparency**.

Example:

```text
Claim 1:
[Claim]

Domain:
[Domain]

Groq:
[Assessment]

Gemini:
[Assessment]

Final Result:
[TRUE / FALSE / PARTIALLY TRUE / UNVERIFIED / CONFLICTING EVIDENCE]

Evidence:
[Relevant information]

Sources:
[Sources]
```

The final result must not lose the connection between:

```text
User Input
   ↓
Stage 1 Information
   ↓
Stage 2 Claim
   ↓
Stage 3 Evidence
   ↓
Groq Verification
   ↓
Gemini Verification
   ↓
Final Result
```

---

# Mandatory Stage-Gate Verification

The verification agent must operate using strict stage gates.

```text
START
  │
  ▼
STAGE 1
Input & Information Extraction
  │
  ├── FAIL → Troubleshoot → Fix → Re-test
  │
  ▼ PASS
STAGE 2
Claim & Domain Extraction
  │
  ├── FAIL → Troubleshoot → Fix → Re-test
  │
  ▼ PASS
STAGE 3
Claim-by-Claim Research
  │
  ├── FAIL → Troubleshoot → Fix → Re-test
  │
  ▼ PASS
STAGE 4
Groq + Gemini Verification
  │
  ├── FAIL → Troubleshoot → Fix → Re-test
  │
  ▼ PASS
STAGE 5
Final Result
  │
  ├── FAIL → Troubleshoot → Fix → Re-test
  │
  ▼
COMPLETE
```

## Critical Rule

**The agent MUST NOT move to the next stage until the current stage has been successfully executed and verified.**

If an error is found:

1. Stop the workflow.
2. Identify the root cause.
3. Fix the issue.
4. Re-run the affected stage.
5. Verify that the fix works.
6. Check that the fix did not break previously working functionality.
7. Continue only after the stage passes.

---

# Deployed Website Verification

The agent must verify the **actual deployed Baatmeedar website**, not only the source code.

For every stage, verify both:

### Frontend

- UI loads correctly.
- User input works.
- Buttons/actions work.
- Loading states work.
- Error messages are understandable.
- Results are displayed correctly.
- No broken links or UI components.
- Browser console errors are investigated.

### Backend / APIs

- API endpoints respond correctly.
- Environment variables/API keys are configured correctly.
- Requests reach the correct service.
- Responses are correctly parsed.
- Errors are handled.
- Timeouts are handled.
- Data is stored correctly.
- Stage-to-stage data flow is preserved.

---

# Final End-to-End Verification

After all individual stages pass, perform one complete end-to-end test.

Test all three input paths:

```text
Direct Statement
      ↓
Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5
```

```text
Article URL
      ↓
Tavily → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5
```

```text
YouTube URL
      ↓
Transcript API → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5
```

The final verification should confirm that information flows correctly from the user's original input all the way to the final claim-verification result.

## Definition of Done

Baatmeedar is considered successfully verified only when:

- [ ] Direct statement workflow works.
- [ ] Article URL workflow works.
- [ ] YouTube URL workflow works.
- [ ] Stage 1 passes.
- [ ] Stage 2 passes.
- [ ] Stage 3 passes.
- [ ] Stage 4 passes.
- [ ] Stage 5 passes.
- [ ] All configured APIs work correctly.
- [ ] API failures are handled gracefully.
- [ ] Claims remain correctly mapped across every stage.
- [ ] Sources/evidence are preserved.
- [ ] Groq and Gemini produce independent assessments.
- [ ] Final results are displayed correctly.
- [ ] No critical frontend errors remain.
- [ ] No critical backend/API errors remain.
- [ ] A complete end-to-end test passes.

**The verification agent must continue troubleshooting and re-testing until the deployed Baatmeedar workflow is fully functional.**
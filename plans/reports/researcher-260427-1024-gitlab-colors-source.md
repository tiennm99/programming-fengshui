# GitLab Language Colors Source Investigation

**Date:** 2026-04-27  
**Investigator:** Researcher  
**Status:** Complete

---

## Executive Summary

GitLab **does maintain a separate Linguist fork** with its own divergent color palette. Unlike the assumption that they reuse GitHub's colors, **only 3 of 10 test languages match** GitHub Linguist. This represents a worthwhile second data source, though acquisition is non-trivial: GitLab's colors exist only in YAML format; no JSON equivalent exists.

**Recommendation:** Vendor GitLab colors. Requires one-time YAML-to-JSON conversion locally; no ongoing build step.

---

## Findings

### 1. GitLab's Language Color Source

**Primary Source:** [`gitlab-org/linguist`](https://gitlab.com/gitlab-org/linguist) on GitLab  
**File:** `lib/linguist/languages.yml` (master branch)  
**Fork Relationship:** GitLab maintains a fork of [`github-linguist/linguist`](https://github.com/github-linguist/linguist) (confirmed via GitHub API: `fork: true`, parent: `github-linguist/linguist`)

**Key Finding:** GitLab's fork **diverged meaningfully** from upstream. Colors are actively maintained in their own fork, not synced from GitHub.

### 2. Color Palette Divergence: 7/10 Languages Differ

Side-by-side comparison (test langs: Python, JavaScript, Ruby, Go, Rust, Java, C#, PHP, TypeScript, HTML):

| Language   | GitHub Linguist | GitLab Linguist | Match? |
|------------|-----------------|-----------------|--------|
| Python     | #3572A5         | #3581ba         | ❌     |
| JavaScript | #f1e05a         | #f15501         | ❌     |
| Ruby       | #701516         | #701516         | ✓      |
| Go         | #00ADD8         | #a89b4d         | ❌     |
| Rust       | #dea584         | #dea584         | ✓      |
| Java       | #b07219         | #b07219         | ✓      |
| C#         | #178600         | #5a25a2         | ❌     |
| PHP        | #4F5D95         | #6e03c1         | ❌     |
| TypeScript | #3178c6         | #31859c         | ❌     |
| HTML       | #e34c26         | (undefined)     | ❌     |

**Verdict:** 3/10 match → **Material difference.** GitLab users see distinctly different colors than GitHub users for 7/10 common languages.

### 3. Schema & Format

**Current Format:** YAML (`lib/linguist/languages.yml`)  
**Schema:** Standard Linguist structure:
```yaml
Python:
  type: programming
  tm_scope: source.python
  color: "#3581ba"
  # ... other metadata
```

**No JSON equivalent exists.** Unlike ozh/github-colors (which mirrors GitHub's data), there is no community project mirroring GitLab's data to JSON.

### 4. Raw URL for Vendoring

**Canonical URL:**
```
https://gitlab.com/gitlab-org/linguist/-/raw/master/lib/linguist/languages.yml
```

**File Size:** ~80 KB (YAML)  
**License:** [MIT](https://gitlab.com/gitlab-org/linguist/-/blob/master/LICENSE) (compatible)

### 5. Acquisition Strategy

**Option A: Direct YAML Vendoring**
- Fetch raw YAML, parse in browser with js-yaml library (adds ~10 KB)
- Minimal infrastructure, but requires browser-side parsing

**Option B: One-Time Local Conversion (Recommended)**
- Single `yq` or Python command to convert YAML → JSON locally
- Vendor the JSON file once
- Example command:
  ```bash
  curl https://gitlab.com/gitlab-org/linguist/-/raw/master/lib/linguist/languages.yml | \
  yq -o json '[.[] | select(.color) | {key: .name, value: {color: .color}}] | from_entries' \
  > data/gitlab-colors.json
  ```
- No runtime parsing needed

**Output schema (Option B):**
```json
{
  "Python": { "color": "#3581ba" },
  "JavaScript": { "color": "#f15501" },
  ...
}
```

---

## Implementation Recommendation

**RECOMMENDED:** Vendor GitLab colors as a separate data source.

**Why:**
1. **Material Difference:** 70% of test languages differ from GitHub — not a duplicate.
2. **Stable Source:** Maintained by GitLab org, with clear historical precedent (MR [!43111](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/43111)).
3. **Manageable:** YAML → JSON is a one-shot operation; no build step required.
4. **Correct Attribution:** GitLab users get their platform's official colors.

**How:**
1. Save raw YAML as temporary file: `curl ... > /tmp/gitlab-languages.yml`
2. Convert to JSON with one-liner (yq or Python script)
3. Commit `data/gitlab-colors.json` alongside `data/github-colors.json`
4. In browser JS, load both; allow user toggle between sources

**Schema for Browser Integration:**
```javascript
const githubColors = await fetch('data/github-colors.json').then(r => r.json());
const gitlabColors = await fetch('data/gitlab-colors.json').then(r => r.json());
// Both: { "LanguageName": { "color": "#hex" } }
```

**File Size Impact:** ~80 KB YAML → ~40–50 KB JSON (minified).

---

## Context: GitLab's Use of Linguist

GitLab uses Linguist for language detection and **color assignment in language graphs** (confirmed in MR [!6748](https://gitlab.com/gitlab-org/gitlab-foss/-/merge_requests/6748): "Use defined colour for a language when available").

Long-term note: GitLab has explored replacing Linguist with `go-enry` (Epic [#8526](https://gitlab.com/groups/gitlab-org/-/epics/8526)), but Linguist remains the active language source as of 2026.

---

## Unresolved Questions

- **Update frequency:** Does GitLab Linguist fork receive upstream patches? (Monitor required?)
- **Coverage:** How many total languages does GitLab define vs. GitHub? (Sample: GitHub ~500; GitLab likely similar)

---

## Sources

- [GitLab Linguist Repository](https://gitlab.com/gitlab-org/linguist)
- [GitLab Linguist languages.yml (master)](https://gitlab.com/gitlab-org/linguist/-/blob/master/lib/linguist/languages.yml)
- [GitLab Language Colors MR #43111](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/43111)
- [GitLab FOSS Language Color MR #6748](https://gitlab.com/gitlab-org/gitlab-foss/-/merge_requests/6748)
- [GitHub Linguist (upstream)](https://github.com/github-linguist/linguist)
- [ozh/github-colors (JSON mirror)](https://github.com/ozh/github-colors)

---

**Status:** DONE

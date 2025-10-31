# Monetization Events - MSD Broken Links Analyzer

This document describes the monetization events (usage counters) configured for the MSD Broken Links Analyzer Actor on the Apify platform.

## Actor Information

- **Actor ID:** `msd-brokenlinks`
- **Actor Name:** MSD Broken Links Analyzer
- **Description:** Comprehensive broken links analyzer that crawls websites and identifies broken internal and external links

## Monetization Events

### PAGE_ANALYZED

**Label:** Pages analyzed  
**Description:** Number of web pages analyzed for broken links detection

**When It's Triggered:**
- Every time a page is successfully analyzed for broken links
- Triggered for each page processed, including:
  - The start URL provided in input
  - Any additional pages discovered during crawling (if enabled)
- Only counts pages that are actually analyzed (not skipped duplicates)

**Implementation Location:**
- File: `src/main.js`
- Line: After each page analysis completes successfully
- Code: `await Actor.incrementUsageCounter('PAGE_ANALYZED');`

**Usage in Apify:**
```json
{
  "usageCounters": {
    "PAGE_ANALYZED": {
      "label": "Pages analyzed",
      "description": "Number of web pages analyzed for broken links detection"
    }
  }
}
```

## Implementation Details

### Code Pattern

The monetization event is incremented after successful page analysis:

```javascript
// After broken links analysis completes
results.push(pageResult);

// Track this page analysis as a billable event for monetization
await Actor.incrementUsageCounter('PAGE_ANALYZED');

console.log(`Completed analysis for: ${normalizedUrl} (Status: ${statusCode})`);
```

### Event Triggering Rules

1. **Success Only**: Events are only incremented on successful page analysis, not on errors
2. **No Duplicates**: URL normalization ensures pages aren't counted twice (duplicate URLs are skipped)
3. **Per Page**: Each page analyzed increments the counter by 1, regardless of:
   - Number of links found
   - Number of broken links detected
   - Link types (internal/external)

### Configuration

The usage counter is defined in `.actor/actor.json`:

```json
{
  "usageCounters": {
    "PAGE_ANALYZED": {
      "label": "Pages analyzed",
      "description": "Number of web pages analyzed for broken links detection"
    }
  }
}
```

## Adding to Apify Platform

To add this event to your Apify actor:

1. Navigate to your actor in Apify Console
2. Go to **Settings** → **Monetization**
3. Add usage counter:
   - **Counter Name:** `PAGE_ANALYZED`
   - **Label:** "Pages analyzed"
   - **Description:** "Number of web pages analyzed for broken links detection"
4. Set pricing per event as needed

## Monitoring Usage

Usage counters can be monitored via:

1. **Apify Console:** Actor → Runs → View usage statistics
2. **Apify API:** `GET /v2/actor-runs/{runId}` → `usage` property
3. **Actor Logs:** Console logs show billable event counts:
   ```
   Billable events (pages analyzed): 5
   ```

## Example Usage

If a user runs the actor with:
- `startUrl`: `"https://example.com"`
- `maxPages`: `20`

And the actor analyzes 15 pages, the `PAGE_ANALYZED` counter will be incremented 15 times.

---

**Last Updated:** 2025-01-XX


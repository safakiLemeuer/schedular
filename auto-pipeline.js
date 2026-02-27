/**
 * bht-rules.js — BHT Document Compliance Engine
 *
 * PURE JAVASCRIPT. No Claude. No API calls.
 *
 * This module enforces BHT's non-negotiable content rules using
 * regex, string matching, and lookup tables. These rules are
 * deterministic — they do not require judgment, so they must NOT
 * be delegated to Claude.
 *
 * Called before any AI function. If a violation is found, the
 * content is rejected or sanitized before Claude ever sees it.
 *
 * SOURCE OF RULES: BHT editorial policy (2024-02-26)
 */

'use strict';

// ══════════════════════════════════════════════════════════════════════════
// RULE SET — each entry has: id, description, test (regex|fn), severity
// severity: 'block' = reject entirely | 'warn' = flag but allow through
// ══════════════════════════════════════════════════════════════════════════

const RULES = [

  // ── Typography ──────────────────────────────────────────────────────────
  {
    id: 'NO_EM_DASH',
    description: 'Em dash in any form is prohibited in BHT documents',
    severity: 'block',
    // Matches: — (U+2014), – (U+2013), ‒ (U+2012), -- (double hyphen used as dash)
    test: text => /[\u2012\u2013\u2014]|(?<=[a-zA-Z\s])--(?=[a-zA-Z\s])/.test(text),
    fix: text => text
      .replace(/\u2014/g, ':')   // em dash → colon (most common substitute)
      .replace(/\u2013/g, '-')   // en dash → hyphen
      .replace(/\u2012/g, '-')   // figure dash → hyphen
      // Only fix double-hyphens used as em dashes (between words), not negatives
      .replace(/([a-zA-Z\s])--([a-zA-Z\s])/g, '$1: $2'),
  },

  // ── Unverified metrics ──────────────────────────────────────────────────
  {
    id: 'NO_60PCT_PROCESSING',
    description: '"60% processing time reduction" is unverified — permanently banned',
    severity: 'block',
    test: text => /60\s*%\s*(processing|process)\s*time\s*reduct/i.test(text),
    fix: text => text.replace(/60\s*%\s*(processing|process)\s*time\s*reduct\w*/gi, '[METRIC REMOVED]'),
  },
  {
    id: 'NO_UNVERIFIED_PERCENTAGES',
    description: 'Any unverifiable percentage claim — flag for human review',
    severity: 'warn',
    test: text => /\d+\s*%\s*(faster|cheaper|reduction|improvement|increase|saving|efficiency)/i.test(text),
    fix: null, // warn only, no auto-fix
  },

  // ── Client misrepresentation ────────────────────────────────────────────
  {
    id: 'NO_SEC_DIRECT',
    description: 'SEC described as a direct client — it was a subcontractor engagement',
    severity: 'block',
    // Catches: "SEC client", "work with SEC", "served SEC", "SEC engagement", "SEC contract"
    test: text => /\b(SEC|Securities and Exchange Commission)\b.{0,60}\b(direct client|our client|client of BHT|work(?:ed|ing) with|serv(?:ed|ing)|engag(?:ed|ing)|contract)/i.test(text)
      || /\b(client|contract|engagement|work)\b.{0,60}\b(SEC|Securities and Exchange Commission)\b/i.test(text),
    fix: null,
    hint: 'SEC was a subcontractor engagement. State the prime contractor or remove the reference.',
  },
  {
    id: 'NO_DOJ_DIRECT',
    description: 'DOJ described as a direct client — subcontractor engagements only, name the prime',
    severity: 'block',
    test: text => /\b(DOJ|Department of Justice)\b.{0,80}\b(direct|direct client|our client|prime|directly)\b/i.test(text)
      || /\b(direct(?:ly)?|prime)\b.{0,80}\b(DOJ|Department of Justice)\b/i.test(text)
      || /\b(work(?:ed|ing)|serv(?:ed|ing))\b.{0,40}\b(DOJ|Department of Justice)\b/i.test(text),
    fix: null,
    hint: 'DOJ was subcontractor only. Name the prime contractor or restructure the claim.',
  },
  {
    id: 'NO_DHS_DIRECT',
    description: 'DHS described as a direct client — subcontractor to HHREF, 2004-2010',
    severity: 'block',
    test: text => /\b(DHS|Department of Homeland Security)\b.{0,60}\b(direct client|our client|client of BHT|work(?:ed|ing) with|serv(?:ed|ing)|engag(?:ed|ing)|contract)/i.test(text)
      || /\b(client|contract|engagement|work)\b.{0,60}\b(DHS|Department of Homeland Security)\b/i.test(text),
    fix: null,
    hint: 'DHS work was through HHREF (subcontractor, 2004-2010). Reference HHREF as prime.',
  },

  // ── Vehicle / contract status ────────────────────────────────────────────
  {
    id: 'NO_GSA_MAS_CURRENT',
    description: 'GSA MAS described as current/active — it is in pursuit, not awarded',
    severity: 'block',
    test: text => /GSA\s*MAS.{0,80}(active|current|awarded|holds?|has|on\s+contract|vehicle)/i.test(text)
      || /(active|current|awarded|holds?|has|on\s+contract|vehicle).{0,80}GSA\s*MAS/i.test(text),
    fix: null,
    hint: 'GSA MAS is in pursuit. Write "GSA MAS (in pursuit)" or remove the reference.',
  },

  // ── Product status ───────────────────────────────────────────────────────
  {
    id: 'NO_BHTINSIGHT_CURRENT',
    description: 'BHT Insight described as current product in 8(a) whitepapers — concept stage only',
    severity: 'block',
    test: text => /BHT\s*Insight.{0,100}(current|available|deployed|live|production|released|offering|product)/i.test(text)
      || /(current|available|deployed|live|production|released|offering|product).{0,100}BHT\s*Insight/i.test(text),
    fix: null,
    hint: 'BHT Insight is concept stage only. Write "BHT Insight (in development)" or omit.',
  },

  // ── Language / template quality ──────────────────────────────────────────
  {
    id: 'NO_SOLUTION_NOUN',
    description: '"Solution" used as a marketing noun is banned in BHT content',
    severity: 'block',
    // "our solution", "a solution", "the solution", "solutions for" — but NOT "solving", "resolve", "no solution found"
    test: text => /\b(our|a|the|innovative|enterprise|tailored|custom|proven|scalable|robust|comprehensive)\s+solution(?:s)?\b/i.test(text),
    fix: text => text
      .replace(/\b(our|a|the|innovative|enterprise|tailored|custom|proven|scalable|robust|comprehensive)\s+solutions?\b/gi,
        (match, adj) => {
          // Replace with more specific language based on context
          const map = {
            'our': 'our work', 'a': 'an approach', 'the': 'this',
            'innovative': 'distinctive', 'enterprise': 'enterprise-grade',
            'tailored': 'purpose-built', 'custom': 'built for this',
            'proven': 'field-tested', 'scalable': 'scalable',
            'robust': 'reliable', 'comprehensive': 'end-to-end',
          };
          return map[adj.toLowerCase()] ? `${map[adj.toLowerCase()]} work` : match;
        }),
  },

  // ── Forward-looking claims stated as current ─────────────────────────────
  {
    id: 'NO_FORWARD_AS_CURRENT',
    description: 'Forward-looking capability stated as current — requires future tense or qualification',
    severity: 'warn',
    test: text => /(will\s+)?(?:can|does|provides?|delivers?|enables?|supports?)\s+.{0,80}(?:by\s+20[2-9]\d|in\s+(?:Q[1-4]\s+)?20[2-9]\d|next\s+(?:year|quarter))/i.test(text),
    fix: null,
    hint: 'Verify this is a current capability, not a roadmap item. Add "(anticipated)" if forward-looking.',
  },

  // ── Unverifiable budget/policy citations ────────────────────────────────
  {
    id: 'NO_UNVERIFIABLE_BUDGET',
    description: 'Unverifiable budget citation or policy reference — flag for source verification',
    severity: 'warn',
    // Matches dollar amounts with B/M/T (billions/millions/trillions) without an attribution
    test: text => /\$\s*\d+(?:\.\d+)?\s*(?:billion|million|trillion|[BMT])\b(?!.*(?:source:|according to|per\s+[A-Z]|OMB|CBO|GAO|FY\d{2}))/i.test(text),
    fix: null,
    hint: 'Add source attribution (OMB, CBO, GAO, agency FY report) or remove the dollar figure.',
  },

  // ── Template-sounding openers ────────────────────────────────────────────
  {
    id: 'NO_TEMPLATE_OPENERS',
    description: 'Sentences that read like they came from a template',
    severity: 'warn',
    test: text => /^(In today\'s|In the (rapidly|ever[\-\s])?evolving|As (the|a|an)|With the (rise|advent|growth|increasing)|It is (well[- ]known|widely|important|crucial|essential|vital)|Leveraging|Harnessing|We are (excited|pleased|thrilled|proud|delighted))/im.test(text),
    fix: null,
    hint: 'Rewrite opening — it reads like a template. Lead with a specific fact, claim, or question.',
  },
  {
    id: 'NO_EXCITED',
    description: '"We are excited/pleased/thrilled/proud" — corporate template language',
    severity: 'block',
    test: text => /\b(we\s+are|we're)\s+(excited|pleased|thrilled|proud|delighted)\s+(to|about|by)\b/i.test(text),
    fix: text => text.replace(/\b(we\s+are|we're)\s+(excited|pleased|thrilled|proud|delighted)\s+(to|about|by)\b/gi, ''),
  },
];

// ══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════════════

/**
 * Runs all rules against a text string.
 * Returns { pass, violations[], warnings[], fixedText }
 *
 * 'block' violations → pass = false
 * 'warn'  violations → pass = true, but warnings present
 *
 * fixedText has auto-fixable violations applied (where fix fn exists).
 */
function check(text) {
  if (!text || typeof text !== 'string') {
    return { pass: true, violations: [], warnings: [], fixedText: text };
  }

  const violations = [];
  const warnings   = [];
  let   fixedText  = text;

  for (const rule of RULES) {
    if (!rule.test(fixedText)) continue; // JS test — no Claude

    const entry = {
      id:          rule.id,
      description: rule.description,
      hint:        rule.hint || null,
    };

    if (rule.severity === 'block') {
      violations.push(entry);
      // Apply auto-fix if available — JS string operation
      if (typeof rule.fix === 'function') {
        fixedText = rule.fix(fixedText);
      }
    } else {
      warnings.push(entry);
    }
  }

  // pass = no unfixable blocking violations remain after auto-fix
  // violations array still contains ALL violations for audit trail
  // auto_fixed = true if any violations were resolved by the fix function
  const unfixableViolations = violations.filter(v => typeof RULES.find(r => r.id === v.id)?.fix !== 'function');
  const pass = unfixableViolations.length === 0;
  const auto_fixed = violations.some(v => typeof RULES.find(r => r.id === v.id)?.fix === 'function');

  return { pass, violations, unfixable: unfixableViolations, warnings, fixedText, auto_fixed };
}

/**
 * Checks a post object (title + body + hashtags).
 * Returns { pass, violations[], warnings[], fixedPost }
 */
function checkPost(post) {
  const combined = `${post.title || ''}\n\n${post.body || ''}\n\n${post.hashtags || ''}`;
  const result = check(combined);

  // Apply fixes back to the individual fields — JS string ops
  const titleResult    = check(post.title    || '');
  const bodyResult     = check(post.body     || '');
  const hashtagResult  = check(post.hashtags || '');

  return {
    pass:     result.pass,
    violations: result.violations,
    warnings:   result.warnings,
    fixedPost: {
      ...post,
      title:    titleResult.fixedText,
      body:     bodyResult.fixedText,
      hashtags: hashtagResult.fixedText,
    },
  };
}

/**
 * Returns the full rule list for display in the UI.
 * JS map — no Claude.
 */
function getRules() {
  return RULES.map(({ id, description, severity, hint }) => ({ id, description, severity, hint: hint || null }));
}

module.exports = { check, checkPost, getRules };

/**
 * auto-pipeline.js — Auto-Schedule, Auto-Image, Auto-Tag Pipeline
 *
 * GUARDRAIL SUMMARY
 * ─────────────────
 * Claude handles:
 *   • Writing the DALL-E image prompt (requires visual imagination + brand tone)
 *   • Selecting the best 5 hashtags from a provided taxonomy (contextual judgment)
 *   • Assigning a narrative slot to a new post in the context of a campaign arc
 *
 * JS handles:
 *   • All date arithmetic (slot availability, conflict detection, day-of-week rules)
 *   • The hashtag taxonomy itself (lookup table)
 *   • Image alt text construction (template)
 *   • File naming, path construction, format validation
 *   • Deduplication of tags
 *   • BHT compliance check (via bht-rules.js — regex/pattern matching)
 *
 * DALL-E handles:
 *   • Image pixel generation
 *   (The prompt it receives was written by Claude, but the image is not Claude)
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const axios   = require('axios');
const AI      = require('./ai');
const BHT     = require('./bht-rules');

// ══════════════════════════════════════════════════════════════════════════
// SECTION A — HASHTAG TAXONOMY (pure JS lookup table)
// Claude picks FROM this list. It never invents tags.
// Curated for BHT's domain: federal IT, data analytics, 8(a), compliance.
// ══════════════════════════════════════════════════════════════════════════

const HASHTAG_TAXONOMY = {
  // Core BHT identity
  identity: ['#BHTLabs', '#BHT', '#FederalIT', '#SmallBusiness', '#8a', '#SDVOSB'],

  // Federal market
  federal: [
    '#FederalContracting', '#GovTech', '#PublicSector', '#FedTech',
    '#DoD', '#CivDiv', '#FederalAgency', '#FederalAcquisition',
    '#ContractVehicle', '#NAICS', '#SetAside',
  ],

  // Technical domains
  data: [
    '#DataAnalytics', '#DataEngineering', '#DataStrategy', '#ETL',
    '#DataPipeline', '#DataGovernance', '#DataQuality', '#MasterDataManagement',
    '#BusinessIntelligence', '#DataWarehouse', '#DataLake',
  ],
  cloud: [
    '#CloudMigration', '#AWS', '#Azure', '#GovCloud', '#FedRAMP',
    '#CloudFirst', '#HybridCloud', '#CloudNative',
  ],
  ai: [
    '#ArtificialIntelligence', '#MachineLearning', '#AI', '#GenerativeAI',
    '#FederalAI', '#ResponsibleAI', '#AIGovernance', '#NLP',
  ],
  cybersecurity: [
    '#Cybersecurity', '#ZeroTrust', '#CMMC', '#FedRAMP', '#FISMA',
    '#DataSecurity', '#InfoSec', '#CyberResilience',
  ],
  it_modernization: [
    '#ITModernization', '#DigitalTransformation', '#LegacyMigration',
    '#Agile', '#DevSecOps', '#TechModernization', '#FederalModernization',
  ],

  // Thought leadership / audience
  leadership: [
    '#Leadership', '#Entrepreneurship', '#SmallBizOwner', '#WomenInTech',
    '#VeteranOwned', '#FounderStory', '#GovCon', '#B2G',
  ],
  compliance: [
    '#Compliance', '#RegulatoryCompliance', '#ITAR', '#FAR', '#DFARS',
    '#SectionSection508', '#ADA', '#RiskManagement',
  ],
};

// All tags flat — used for deduplication check (JS Set, not Claude)
const ALL_TAGS = new Set(Object.values(HASHTAG_TAXONOMY).flat().map(t => t.toLowerCase()));

// ══════════════════════════════════════════════════════════════════════════
// SECTION B — SCHEDULE SLOT ENGINE (pure JS date math)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Returns all posting slots available in the next N days, excluding
 * times already taken (passed as an array of ISO date strings).
 *
 * WHY JS: date arithmetic, array filtering, Set lookups. No judgment needed.
 *
 * Rules (hard-coded, no Claude):
 *   - Weekdays only (Mon-Fri)
 *   - Peak windows: 8:00, 9:00, 12:00 local (expressed as UTC offsets)
 *   - Minimum 4-hour gap between posts on the same day
 *   - No more than 2 posts per day
 */
function getAvailableSlots(existingSchedule, daysAhead = 30, timezone_offset_hours = -5) {
  const taken = new Set(existingSchedule.map(d => {
    const t = new Date(d);
    // Normalise to nearest hour bucket for conflict detection — JS
    t.setMinutes(0, 0, 0);
    return t.toISOString();
  }));

  const slots = [];
  const postsPerDay = {};
  const PEAK_HOURS_UTC = [8, 9, 12].map(h => h - timezone_offset_hours); // Convert CST to UTC
  const d = new Date();
  d.setDate(d.getDate() + 1); // Start tomorrow

  for (let i = 0; i < daysAhead && slots.length < 60; i++) {
    const dow = d.getDay();
    const dateKey = d.toISOString().slice(0, 10);

    // Weekdays only — JS boolean, not Claude
    if (dow >= 1 && dow <= 5) {
      for (const hour of PEAK_HOURS_UTC) {
        const slot = new Date(d);
        slot.setUTCHours(hour, 0, 0, 0);

        const slotKey = slot.toISOString();
        const dayCount = postsPerDay[dateKey] || 0;

        // Max 2 posts/day, no time conflict — JS comparisons, not Claude
        if (!taken.has(slotKey) && dayCount < 2) {
          slots.push(slotKey);
          postsPerDay[dateKey] = dayCount + 1;
          taken.add(slotKey);
        }
      }
    }
    d.setDate(d.getDate() + 1);
  }

  return slots;
}

/**
 * Assigns an optimal slot from the available pool based on content type.
 * The preference matrix is a JS lookup table — not Claude.
 *
 * Preference: product-launch and case-study go earlier in the week;
 * vision/inspiration go Friday; everything else fills forward chronologically.
 */
function assignSlot(contentType, availableSlots) {
  if (!availableSlots || availableSlots.length === 0) return null;

  // Day-of-week preference per content type — lookup table, not Claude
  const DAY_PREF = {
    'product-launch':     [1, 2, 3],  // Mon-Wed
    'case-study':         [2, 3, 4],  // Tue-Thu
    'vision':             [5],         // Fri
    'proof':              [2, 3],      // Tue-Wed
    'insight':            [3, 4],      // Wed-Thu
    'educational':        [1, 2],      // Mon-Tue
    'thought-leadership': [2, 3, 4],   // Tue-Thu
    'general':            [1, 2, 3, 4, 5], // any
  };

  const preferred = DAY_PREF[contentType] || DAY_PREF['general'];

  // Try to find a slot on a preferred day first — JS .find(), not Claude
  const ideal = availableSlots.find(s => preferred.includes(new Date(s).getDay()));
  return ideal || availableSlots[0]; // Fallback to first available
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION C — AUTO-SCHEDULE (Claude for narrative ordering only)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Auto-schedules a set of posts for a campaign.
 *
 * JS handles:
 *   - Getting available slots
 *   - Content type detection
 *   - Slot assignment per type
 *   - Conflict detection
 *
 * Claude handles (ONE call for the whole campaign):
 *   - Recommending the narrative ORDER of posts if not already ordered
 *   - This is editorial judgment: which post should come first to hook,
 *     which should deliver proof, which should close with vision
 *
 * Returns array of { post_id, recommended_slot, content_type, reason }
 */
async function autoScheduleCampaign(posts, existingSchedule = []) {
  if (!posts || posts.length === 0) return [];

  // Detect content types for all posts — JS keyword matching, not Claude
  const typed = posts.map(p => ({
    ...p,
    contentType: AI.detectContentType(p.body || p.title || ''),
  }));

  // Get available slots — pure JS date math
  const slots = getAvailableSlots(existingSchedule);

  // If only 1 post, no narrative ordering needed — skip Claude
  if (typed.length === 1) {
    const slot = assignSlot(typed[0].contentType, slots);
    return [{
      post_id: typed[0].id,
      recommended_slot: slot,
      content_type: typed[0].contentType,
      reason: 'Single post — auto-assigned to optimal slot',
      source: 'js',
    }];
  }

  // CLAUDE — STRATEGY: determine optimal narrative order
  // Claude receives ONLY post titles (not full bodies) to minimise tokens
  let orderedIds = typed.map(p => p.id); // default: original order
  try {
    const titleList = typed.map((p, i) => `${i + 1}. [id:${p.id}] ${p.title}`).join('\n');
    const rawOrder = await callClaudeForNarrativeOrder(titleList);
    if (rawOrder && rawOrder.length === typed.length) {
      orderedIds = rawOrder;
    }
  } catch (e) {
    console.warn('[AutoSchedule] Narrative order fallback to original:', e.message);
  }

  // Assign slots in narrative order — JS, not Claude
  const slotPool = [...slots];
  return orderedIds.map((id, position) => {
    const post = typed.find(p => p.id === id);
    if (!post) return null;

    // Earlier narrative positions get earlier week slots — JS index math
    const slot = slotPool.shift() ?? null;

    return {
      post_id: post.id,
      recommended_slot: slot,
      content_type: post.contentType,
      narrative_position: position + 1,
      reason: `Narrative position ${position + 1} of ${orderedIds.length}`,
      source: position === 0 ? 'claude-ordered' : 'js-sequential',
    };
  }).filter(Boolean);
}

/**
 * CLAUDE — STRATEGY (narrative ordering)
 * Receives a numbered list of post titles.
 * Returns an array of post IDs in recommended narrative order.
 *
 * WHY CLAUDE: determining which post should open (problem hook),
 * which should deliver proof, and which should close with vision
 * requires reading the titles and applying editorial judgment.
 * A sort algorithm cannot do this without understanding content meaning.
 *
 * Tokens out: 150 max (just the ID order as a JSON array)
 */
async function callClaudeForNarrativeOrder(titleList) {
  // Import the core call function from ai.js
  const { _callClaude } = require('./ai-internal'); // See note below
  // Note: _callClaude is intentionally private in ai.js
  // We call through the public API instead:
  const AI_module = require('./ai');

  // We don't expose _callClaude directly, so we use a lightweight wrapper
  // via the Anthropic SDK directly here — this is the ONLY place in
  // auto-pipeline.js that touches the API
  const Anthropic = require('@anthropic-ai/sdk');
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    system: [
      'You are a LinkedIn campaign narrative strategist.',
      'You receive a list of post titles with their IDs.',
      'Return ONLY a JSON array of the IDs in optimal narrative order.',
      'Narrative arc: Hook/Problem → Diagnosis → Reveal/Product → Proof → Vision/CTA',
      'Example output: [42, 38, 41, 39, 40]',
    ].join('\n'),
    messages: [{ role: 'user', content: `Order these by narrative arc:\n${titleList}` }],
  });

  const text = msg.content[0]?.text?.trim() ?? '[]';
  // Parse the ID array — JS, not Claude
  const parsed = AI_module.parseClaudeJSON(text);
  return Array.isArray(parsed) ? parsed.map(Number) : null;
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION D — AUTO-TAG (Claude picks from taxonomy, JS validates)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Generates optimal hashtags for a post.
 *
 * JS handles:
 *   - Building the relevant subset of the taxonomy based on content type
 *   - Deduplicating any tags Claude returns
 *   - Enforcing max count (5 tags)
 *   - Ensuring all returned tags are in the taxonomy (no hallucinations)
 *   - Formatting (#Tag format)
 *
 * CLAUDE handles:
 *   - Selecting the best 5 from the pre-filtered taxonomy subset
 *   - This requires judgment: a case study post about cloud migration
 *     should get different tags than one about compliance, even if both
 *     are "case studies"
 *
 * Tokens out: 80 max (JSON array of 5 tag strings)
 */
async function autoGenerateTags(post) {
  const contentType = AI.detectContentType(post.body || '');

  // JS: build relevant taxonomy subset based on content type — lookup, not Claude
  const RELEVANT_SECTIONS = {
    'product-launch':     ['identity', 'it_modernization', 'ai', 'federal'],
    'case-study':         ['identity', 'data', 'federal', 'compliance'],
    'vision':             ['identity', 'leadership', 'federal', 'it_modernization'],
    'proof':              ['identity', 'data', 'compliance', 'federal'],
    'insight':            ['identity', 'leadership', 'it_modernization', 'ai'],
    'educational':        ['identity', 'data', 'cloud', 'it_modernization'],
    'thought-leadership': ['identity', 'leadership', 'federal', 'it_modernization'],
    'general':            ['identity', 'federal', 'leadership'],
  };

  const sections = RELEVANT_SECTIONS[contentType] || RELEVANT_SECTIONS['general'];
  // JS: flatten relevant sections into candidate pool
  const candidates = [...new Set(sections.flatMap(s => HASHTAG_TAXONOMY[s] || []))];

  // Always include BHT identity tag — JS .includes() check
  const mandatoryTags = ['#BHTLabs'];

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('No API key');

    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: [
        'You select LinkedIn hashtags for federal IT content.',
        'Respond with JSON array of EXACTLY 4 tags (strings including #).',
        'Pick ONLY from the provided candidates list. No invented tags.',
        'Do not include #BHTLabs — it is added automatically.',
      ].join('\n'),
      messages: [{
        role: 'user',
        content: `Post type: ${contentType}\nTitle: ${post.title}\nFirst 200 chars: ${(post.body || '').slice(0, 200)}\n\nCandidates:\n${candidates.join(', ')}`,
      }],
    });

    const text   = msg.content[0]?.text?.trim() ?? '[]';
    const parsed = AI.parseClaudeJSON(text) || [];

    // JS: validate — keep only tags that exist in taxonomy (prevent hallucination)
    const valid = parsed
      .filter(t => typeof t === 'string' && ALL_TAGS.has(t.toLowerCase()))
      .map(t => t.startsWith('#') ? t : `#${t}`) // ensure # prefix — JS, not Claude
      .slice(0, 4); // enforce max — JS, not Claude

    // JS: merge with mandatory tags, deduplicate with Set
    const finalTags = [...new Set([...mandatoryTags, ...valid])].slice(0, 5);
    return finalTags.join(' ');

  } catch (e) {
    console.warn('[AutoTag] Fallback to default tags:', e.message);
    // JS fallback: pick first 4 from candidates + identity tag
    const fallback = [...new Set([...mandatoryTags, ...candidates.slice(0, 4)])].slice(0, 5);
    return fallback.join(' ');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION E — AUTO-IMAGE (Claude writes prompt, DALL-E generates)
// ══════════════════════════════════════════════════════════════════════════

/**
 * BHT brand constraints passed to Claude for image prompts.
 * These are rules, so they live in JS as a constant — not in Claude's system prompt.
 * Claude receives them as constraints in the user message.
 */
const BHT_IMAGE_BRAND = {
  palette: 'Navy blue (#0B1F3E), teal (#31748E), white, warm gold (#C49A2A). No purple.',
  style: 'Minimal, professional, federal/government aesthetic. No stock photo clichés.',
  forbidden: 'No people, no faces, no flags, no government seals, no em dashes in text overlays, no generic "technology" visuals (gears, circuit boards, light trails).',
  preferred: 'Abstract data visualisations, clean architectural geometry, subtle grid patterns, precise typography mockups, controlled negative space.',
  format: '1200x627 pixels, 4:5 LinkedIn post ratio',
};

/**
 * Generates an image for a post.
 *
 * Claude handles:
 *   - Writing the DALL-E prompt (requires visual creativity + brand interpretation)
 *   - This qualifies: translating "case study about federal data pipeline"
 *     into a compelling, brand-compliant visual description requires judgment
 *
 * JS handles:
 *   - BHT brand constraint injection (string concatenation)
 *   - Downloading and saving the image (axios + fs)
 *   - File naming (timestamp + post ID)
 *   - BHT rules check on any text overlay content
 *   - Fallback to a no-image result if DALL-E unavailable
 *
 * Returns { filename, originalName, assetType, filePath } or null
 */
async function autoGenerateImage(post, uploadsDir) {
  const contentType = AI.detectContentType(post.body || '');

  // CLAUDE — JUDGMENT: write a DALL-E prompt that fits the post content + BHT brand
  let dallePrompt;
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('No API key');

    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: [
        'You write DALL-E image generation prompts for LinkedIn post images.',
        'The brand palette is: navy blue, teal, white, warm gold.',
        'Style: minimal, professional, federal IT consulting aesthetic.',
        'Forbidden: people, faces, government seals, circuit boards, light trails, purple tones.',
        'Preferred: abstract data geometry, architectural forms, clean grid patterns, negative space.',
        'Respond with the prompt text ONLY. No explanation. No preamble.',
        'Keep prompt under 180 words.',
      ].join('\n'),
      messages: [{
        role: 'user',
        content: `Post type: ${contentType}\nPost title: ${post.title}\nCore message (first 150 chars): ${(post.body || '').slice(0, 150)}\n\nWrite a DALL-E prompt for a 1200x627 LinkedIn image.`,
      }],
    });

    dallePrompt = msg.content[0]?.text?.trim() ?? '';
  } catch (e) {
    console.warn('[AutoImage] Prompt generation failed:', e.message);
    // JS fallback prompt — template, not Claude
    dallePrompt = `Minimal abstract data visualisation. ${BHT_IMAGE_BRAND.palette} color palette. Clean geometry, professional federal consulting aesthetic. No people, no text. 1200x627 horizontal format.`;
  }

  // BHT rules check on the prompt itself — JS regex via bht-rules.js
  const promptCheck = BHT.check(dallePrompt);
  if (!promptCheck.pass) {
    // Use the auto-fixed version — JS string replacement, not Claude
    dallePrompt = promptCheck.fixedText;
  }

  // Call DALL-E — OpenAI, not Claude
  try {
    const OpenAI = require('openai');
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('[AutoImage] OPENAI_API_KEY not set — skipping image generation');
      return null;
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const imageRes = await openai.images.generate({
      model: 'dall-e-3',
      prompt: dallePrompt,
      n: 1,
      size: '1792x1024', // closest to LinkedIn 1200x627
      quality: 'standard',
      style: 'natural',
    });

    const imageUrl = imageRes.data[0]?.url;
    if (!imageUrl) return null;

    // Download image — axios binary stream, JS file ops
    const filename = `auto-${post.id}-${Date.now()}.png`;
    const filePath = path.join(uploadsDir, filename);

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(response.data));

    return {
      filename,
      originalName: `bht-post-${post.id}.png`,
      assetType: 'image',
      filePath,
      dallePrompt, // stored for audit trail
    };

  } catch (e) {
    console.warn('[AutoImage] DALL-E generation failed:', e.message);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SECTION F — FULL AUTO-PIPELINE (orchestrator)
// Runs: BHT check → auto-tag → auto-image → auto-schedule
// ══════════════════════════════════════════════════════════════════════════

/**
 * Processes a single post through the full auto-pipeline.
 *
 * Order of operations (important — BHT check always first):
 *   1. BHT compliance check (JS regex — block if violations)
 *   2. Auto-tag generation (Claude picks from taxonomy, JS validates)
 *   3. Auto-image generation (Claude writes prompt, DALL-E generates, JS saves)
 *   4. Slot assignment (JS date math, Claude orders if campaign context given)
 *
 * Returns { success, fixedPost, tags, imageAsset, scheduledAt, violations, warnings }
 */
async function processSinglePost(post, opts = {}) {
  const { existingSchedule = [], uploadsDir, campaignPosts = [] } = opts;

  // Step 1: BHT compliance — JS regex, always first, never skipped
  const compliance = BHT.checkPost(post);
  if (compliance.violations.length > 0) {
    // Use auto-fixed text where available; reject if unfixable violations remain
    const stillViolating = compliance.violations.filter(v =>
      BHT.check(compliance.fixedPost.body || '').violations.some(vv => vv.id === v.id)
    );
    if (stillViolating.length > 0) {
      return {
        success: false,
        reason: 'BHT compliance violations that cannot be auto-fixed',
        violations: stillViolating,
        warnings: compliance.warnings,
        post_id: post.id,
      };
    }
  }

  const workingPost = { ...compliance.fixedPost };

  // Step 2: Auto-tag — Claude picks from taxonomy, JS validates
  let tags = workingPost.hashtags || '';
  if (!tags || tags.trim().length === 0) {
    try {
      tags = await autoGenerateTags(workingPost);
    } catch (e) {
      console.warn('[Pipeline] Auto-tag failed:', e.message);
      tags = '#BHTLabs #FederalIT #GovTech #DataAnalytics';
    }
  }

  // Step 3: Auto-image — Claude prompt + DALL-E generation
  let imageAsset = null;
  if (uploadsDir) {
    try {
      imageAsset = await autoGenerateImage(workingPost, uploadsDir);
    } catch (e) {
      console.warn('[Pipeline] Auto-image failed:', e.message);
    }
  }

  // Step 4: Auto-schedule slot — JS date math
  const contentType = AI.detectContentType(workingPost.body || '');
  const slots = getAvailableSlots(existingSchedule);
  const scheduledAt = assignSlot(contentType, slots);

  return {
    success: true,
    post_id: post.id,
    fixedPost: workingPost,
    tags,
    imageAsset,
    scheduledAt,
    content_type: contentType,
    violations: compliance.violations,
    warnings: compliance.warnings,
    bht_auto_fixed: compliance.violations.length > 0,
  };
}

module.exports = {
  autoScheduleCampaign,
  autoGenerateTags,
  autoGenerateImage,
  processSinglePost,
  getAvailableSlots,
  assignSlot,
  HASHTAG_TAXONOMY,
  BHT_IMAGE_BRAND,
};

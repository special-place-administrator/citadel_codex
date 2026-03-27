'use strict';

/**
 * llm-classifier.js — Tier 3 LLM fallback for intent routing
 *
 * Uses an OpenAI-compatible chat completions API to classify user input
 * when Tiers 0-2 produce no match. Configuration is entirely via env vars.
 *
 * Environment variables:
 *   CITADEL_LLM_ENDPOINT  — required; API base URL
 *                           e.g. http://localhost:11434/v1/chat/completions (Ollama)
 *                                https://api.openai.com/v1/chat/completions
 *   CITADEL_LLM_MODEL     — model name (default: gpt-4o-mini)
 *   CITADEL_LLM_API_KEY   — optional Bearer token
 *
 * Returns { target: 'skill:<name>', description: string, confidence: 0.6 } or null.
 * Never throws — all errors are caught and return null.
 */

const TIMEOUT_MS = 5000;
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_CONFIDENCE = 0.6;

/**
 * Build the system prompt listing available skills.
 *
 * @param {Array<{dir: string, name: string, description: string}>} skills
 * @returns {string}
 */
function buildSystemPrompt(skills) {
  const skillLines = skills
    .map(s => `- ${s.dir}: ${s.description || s.name}`)
    .join('\n');

  return [
    'You are an intent classifier. Given a user message, pick the best matching skill or reply "none".',
    '',
    'Available skills:',
    skillLines,
    '',
    'Reply with ONLY the skill directory name (e.g., "archon") or "none". No explanation.',
  ].join('\n');
}

/**
 * Classify user input using an LLM fallback.
 *
 * @param {string} input  Raw user message
 * @param {Array<{dir: string, name: string, description: string}>} skills
 * @returns {Promise<{target: string, description: string, confidence: number}|null>}
 */
async function llmClassify(input, skills) {
  const endpoint = process.env.CITADEL_LLM_ENDPOINT;
  if (!endpoint) return null;

  const model = process.env.CITADEL_LLM_MODEL || DEFAULT_MODEL;
  const apiKey = process.env.CITADEL_LLM_API_KEY;

  // Build the valid skill dir set for fast lookup
  const skillDirs = new Set(skills.map(s => s.dir));

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(skills) },
      { role: 'user', content: input },
    ],
    max_tokens: 32,
    temperature: 0,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== 'string') return null;

    const matched = raw.trim().toLowerCase().replace(/^["']|["']$/g, '');

    if (matched === 'none' || !skillDirs.has(matched)) return null;

    const skill = skills.find(s => s.dir === matched);
    return {
      target: `skill:${matched}`,
      description: skill?.description || matched,
      confidence: DEFAULT_CONFIDENCE,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

module.exports = { llmClassify };

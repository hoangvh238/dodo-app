/**
 * Do It Analytics Tracker SDK
 *
 * Usage in the Electron app:
 *   import { initTracker, trackEvent, Events } from './tracker';
 *   initTracker();
 *   trackEvent(Events.APP_START);
 *
 * Data collected: session ID, event type, event payload, app version, OS.
 * IP-based geolocation happens server-side.
 * Data is used solely for product improvement. It is NEVER sold or shared
 * with third parties. Users can opt out by setting DOIT_NO_ANALYTICS=1.
 */

const ENDPOINT = process.env.ANALYTICS_URL ?? "https://your-dashboard.vercel.app";
const API_KEY  = process.env.ANALYTICS_API_KEY ?? "";

let sessionId: string | null = null;
let enabled = process.env.DOIT_NO_ANALYTICS !== "1";

export function initTracker(): void {
  if (!enabled) return;
  sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function disableTracking(): void {
  enabled = false;
}

export async function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  if (!enabled) return;
  if (!sessionId) initTracker();

  try {
    await fetch(`${ENDPOINT}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Analytics-Key": API_KEY,
      },
      body: JSON.stringify({
        sessionId,
        eventType,
        eventData: eventData ?? {},
        appVersion: process.env.npm_package_version ?? "0.0.0",
        osPlatform: process.platform,
      }),
    });
  } catch {
    // Analytics must never break the app
  }
}

/** Standard event names for the Do It app */
export const Events = {
  APP_START:          "app_start",
  APP_QUIT:           "app_quit",
  OVERLAY_OPEN:       "overlay_open",
  OVERLAY_CLOSE:      "overlay_close",
  QUICK_CHAT_OPEN:    "quick_chat_open",
  QUICK_CHAT_CLOSE:   "quick_chat_close",
  AI_QUERY:           "ai_query",
  AI_QUERY_SUCCESS:   "ai_query_success",
  AI_QUERY_ERROR:     "ai_query_error",
  PROFILE_SWITCH:     "profile_switch",
  SETTINGS_OPEN:      "settings_open",
  SETTINGS_SAVE:      "settings_save",
  MCP_TOOL_CALL:      "mcp_tool_call",
  FEATURE_USED:       "feature_used",
  ERROR:              "error",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

/**
 * Payload for AI_QUERY_SUCCESS — tracks token usage for cost estimation.
 * Call this after every successful Claude API response.
 *
 * Example:
 *   trackAiUsage({
 *     model: "claude-sonnet-4-6",
 *     inputTokens: response.usage.input_tokens,
 *     outputTokens: response.usage.output_tokens,
 *     durationMs: Date.now() - startTime,
 *   });
 */
export interface AiUsagePayload {
  model:        string;   // e.g. "claude-sonnet-4-6"
  inputTokens:  number;
  outputTokens: number;
  durationMs?:  number;
  errorCode?:   string;   // populated on AI_QUERY_ERROR
}

export async function trackAiUsage(payload: AiUsagePayload): Promise<void> {
  await trackEvent(Events.AI_QUERY_SUCCESS, {
    model:         payload.model,
    input_tokens:  payload.inputTokens,
    output_tokens: payload.outputTokens,
    duration_ms:   payload.durationMs ?? null,
  });
}

export async function trackAiError(payload: AiUsagePayload): Promise<void> {
  await trackEvent(Events.AI_QUERY_ERROR, {
    model:      payload.model,
    error_code: payload.errorCode ?? "unknown",
    duration_ms: payload.durationMs ?? null,
  });
}

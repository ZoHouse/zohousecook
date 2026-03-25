// supabase/functions/iot-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GO2RTC_BASE_URL = Deno.env.get('GO2RTC_BASE_URL'); // e.g., http://100.x.x.x:1984/
const WLED_BASE_URL = Deno.env.get('WLED_BASE_URL'); // e.g., http://100.x.x.x/

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Rate limiting: simple in-memory (resets on cold start — good enough for V1)
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 20; // messages per window
const RATE_WINDOW = 5 * 60 * 1000; // 5 minutes

// Snapshot cache: 30s TTL
const snapshotCache = new Map<string, { description: string; timestamp: number }>();
const SNAPSHOT_TTL = 30_000;

const SYSTEM_PROMPT = `You are the House AI for a sentient hacker house called BLRxZo (Zo House Bangalore, Koramangala, 12th floor). You control cameras, WLED lights, and smart locks.

Personality: You are the house itself — speak in first person ("I can see 3 people in the kitchen"). Be concise, informative, slightly playful. Use Hinglish occasionally ("sab theek hai", "koi nahi").

You have these functions:
- get_house_status: Get current status of all devices (cameras, lights, locks)
- get_camera_snapshot: Look through a specific camera and describe what you see
- set_lights: Change all WLED lights to a preset (social, focus, party, calm, night, off)

When describing what you see, be specific but brief. Focus on: how many people, what they're doing, general vibe.`;

const FUNCTION_DEFS = [
  {
    name: 'get_house_status',
    description: 'Get current status of all house systems: cameras, lights, locks',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_camera_snapshot',
    description: 'Look through a specific camera and describe what you see. Takes camera_id or camera name.',
    parameters: {
      type: 'object',
      properties: {
        camera_id: { type: 'string', description: 'Camera UUID or name (e.g., "Kitchen", "Entrance")' },
      },
      required: ['camera_id'],
    },
  },
  {
    name: 'set_lights',
    description: 'Set all WLED light strips to a preset mood. Options: social, focus, party, calm, night, off',
    parameters: {
      type: 'object',
      properties: {
        preset: {
          type: 'string',
          enum: ['social', 'focus', 'party', 'calm', 'night', 'off'],
          description: 'The lighting preset to activate',
        },
      },
      required: ['preset'],
    },
  },
];

// WLED preset IDs (configure these in WLED UI, then map here)
const WLED_PRESETS: Record<string, number> = {
  social: 1,
  focus: 2,
  party: 3,
  calm: 4,
  night: 5,
  off: 0,
};

async function executeFunction(name: string, args: Record<string, string>, operatorCode: string) {
  switch (name) {
    case 'get_house_status': {
      const { data: cameras } = await supabase
        .from('iot_cameras')
        .select('status')
        .eq('operator_code', operatorCode);

      const online = cameras?.filter((c: { status: string }) => c.status === 'online').length ?? 0;
      const total = cameras?.length ?? 0;

      return {
        cameras: { total, online },
        screens: { total: 8, online: 0, note: 'PiSignage integration pending' },
        lights: { total: 6, online: WLED_BASE_URL ? 6 : 0 },
        locks: { total: 4, note: 'Use CAS API for details' },
        relay: GO2RTC_BASE_URL ? 'connected' : 'not configured',
      };
    }

    case 'get_camera_snapshot': {
      const cameraId = args.camera_id;

      // Try to resolve by UUID first, then by name (safe — no .or() with unsanitized input)
      let camera;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(cameraId)) {
        const { data } = await supabase
          .from('iot_cameras')
          .select('*')
          .eq('operator_code', operatorCode)
          .eq('id', cameraId)
          .single();
        camera = data;
      }
      if (!camera) {
        // Sanitize: only allow alphanumeric, spaces, hyphens
        const safeName = cameraId.replace(/[^a-zA-Z0-9 -]/g, '');
        const { data } = await supabase
          .from('iot_cameras')
          .select('*')
          .eq('operator_code', operatorCode)
          .ilike('name', `%${safeName}%`)
          .limit(1)
          .single();
        camera = data;
      }

      if (!camera) return { error: `Camera "${cameraId}" not found` };
      if (camera.status === 'offline') return { description: `${camera.name} is offline. Last seen: ${camera.last_seen_at || 'unknown'}` };
      if (!GO2RTC_BASE_URL) return { description: `${camera.name} is registered but go2rtc relay is not configured yet.` };
      if (!camera.go2rtc_name) return { description: `${camera.name} has no go2rtc stream name configured.` };

      // Check cache
      const cached = snapshotCache.get(camera.id);
      if (cached && Date.now() - cached.timestamp < SNAPSHOT_TTL) {
        return { description: cached.description, cached: true };
      }

      // Grab snapshot from go2rtc
      const go2rtcBase = GO2RTC_BASE_URL.endsWith('/') ? GO2RTC_BASE_URL : `${GO2RTC_BASE_URL}/`;
      try {
        const snapResp = await fetch(`${go2rtcBase}api/frame.jpeg?src=${encodeURIComponent(camera.go2rtc_name)}`);
        if (!snapResp.ok) return { description: `Could not grab frame from ${camera.name} — go2rtc returned ${snapResp.status}` };

        const imageBytes = await snapResp.arrayBuffer();
        const base64 = base64Encode(new Uint8Array(imageBytes));

        // Send to OpenAI vision
        const visionResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: `Describe what you see in this security camera image from "${camera.name}" at a hacker house. Focus on: number of people, what they're doing, general vibe. Be brief (1-2 sentences).` },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
              ],
            }],
            max_tokens: 150,
          }),
        });

        const visionData = await visionResp.json();
        const description = visionData.choices?.[0]?.message?.content || 'Could not analyze image';

        // Cache it
        snapshotCache.set(camera.id, { description, timestamp: Date.now() });

        return { camera_name: camera.name, description };
      } catch (err) {
        return { description: `Error connecting to ${camera.name}: ${err.message}` };
      }
    }

    case 'set_lights': {
      const preset = args.preset;
      if (!WLED_BASE_URL) return { error: 'WLED not configured — lights cannot be controlled yet' };

      const presetId = WLED_PRESETS[preset];
      if (presetId === undefined) return { error: `Unknown preset: ${preset}` };

      try {
        // WLED JSON API: set preset
        const resp = await fetch(`${WLED_BASE_URL}json/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(presetId === 0 ? { on: false } : { on: true, ps: presetId }),
        });

        if (!resp.ok) return { error: `WLED returned ${resp.status}` };
        return { success: true, preset, message: `All lights set to ${preset}` };
      } catch (err) {
        return { error: `Could not reach WLED: ${err.message}. Check if lights are powered on.` };
      }
    }

    default:
      return { error: `Unknown function: ${name}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }

  try {
    const { message, operator_code, history = [] } = await req.json();
    if (!message || !operator_code) {
      return new Response(JSON.stringify({ error: 'message and operator_code required' }), { status: 400 });
    }

    // Rate limiting
    const now = Date.now();
    const limit = rateLimits.get(operator_code) || { count: 0, windowStart: now };
    if (now - limit.windowStart > RATE_WINDOW) {
      limit.count = 0;
      limit.windowStart = now;
    }
    if (limit.count >= RATE_LIMIT) {
      return new Response(JSON.stringify({
        reply: 'Too many messages — take a breather. Try again in a few minutes.',
        rate_limited: true,
      }), { status: 429 });
    }
    limit.count++;
    rateLimits.set(operator_code, limit);

    // Build messages for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    // Call OpenAI with tools format
    const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools: FUNCTION_DEFS.map((f) => ({ type: 'function', function: f })),
        tool_choice: 'auto',
        max_tokens: 500,
      }),
    });

    const chatData = await chatResp.json();
    let assistantMessage = chatData.choices?.[0]?.message;
    const functionCalls: Array<{ name: string; result: Record<string, unknown> }> = [];

    // Execute tool calls (max 3 iterations to prevent loops)
    let iterations = 0;
    while (assistantMessage?.tool_calls?.length && iterations < 3) {
      const toolCall = assistantMessage.tool_calls[0];
      const { name, arguments: argsStr } = toolCall.function;
      const args = JSON.parse(argsStr);
      const result = await executeFunction(name, args, operator_code);
      functionCalls.push({ name, result });

      // Send tool result back to OpenAI using role: 'tool' (not deprecated 'function')
      messages.push(assistantMessage);
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) });

      const followUp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          tools: FUNCTION_DEFS.map((f) => ({ type: 'function', function: f })),
          tool_choice: 'auto',
          max_tokens: 500,
        }),
      });

      const followUpData = await followUp.json();
      assistantMessage = followUpData.choices?.[0]?.message;
      iterations++;
    }

    return new Response(JSON.stringify({
      reply: assistantMessage?.content || 'No response.',
      function_calls: functionCalls.length > 0 ? functionCalls : undefined,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      reply: 'AI temporarily unavailable, try again in a moment.',
      error: err.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

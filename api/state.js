import { put, list } from '@vercel/blob';

const STATE_BLOB_PATH = 'app-state.json';

function defaultState() {
  return {
    lastModified: 0,
    teams: [],
    slots: [
      { id: 'slot-1', name: 'Slot 1' },
      { id: 'slot-2', name: 'Slot 2' },
      { id: 'slot-3', name: 'Slot 3' },
    ],
    timers: [],
    settings: { scoresHidden: false, maxTeamsPerSlot: 20 },
    questions: [],
    quizState: { phase: 'idle', currentQuestionIndex: 0, countdownSeconds: 10, revealed: false },
    problemStatements: [],
  };
}

export async function GET() {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response(JSON.stringify(defaultState()), { status: 200, headers });
  }
  try {
    const { blobs } = await list({ prefix: 'app-state' });
    const blob = blobs.find((b) => b.pathname === STATE_BLOB_PATH);
    if (!blob || !blob.url) {
      return new Response(JSON.stringify(defaultState()), { status: 200, headers });
    }
    const res = await fetch(blob.url);
    if (!res.ok) {
      return new Response(JSON.stringify(defaultState()), { status: 200, headers });
    }
    const body = await res.json();
    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify(defaultState()), { status: 200, headers });
  }
}

export async function POST(request) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }
  try {
    const body = await request.json();
    const stateWithTimestamp = { ...body, lastModified: Date.now() };
    const payload = JSON.stringify(stateWithTimestamp);
    await put(STATE_BLOB_PATH, payload, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers });
  }
}

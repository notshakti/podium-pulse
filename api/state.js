import { createClient } from '@supabase/supabase-js';

const APP_STATE_ROW_ID = 1;

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
    settings: { scoresHidden: false, maxTeamsPerSlot: 20, maxAssignmentsPerProblem: 3 },
    questions: [],
    quizState: { phase: 'idle', currentQuestionIndex: 0, countdownSeconds: 10, revealed: false },
    problemStatements: [],
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const supabase = getSupabase();
  if (!supabase) {
    return new Response(JSON.stringify(defaultState()), { status: 200, headers });
  }
  try {
    const { data: row, error } = await supabase
      .from('app_state')
      .select('state_data, last_modified')
      .eq('id', APP_STATE_ROW_ID)
      .maybeSingle();

    if (error) {
      console.error('[api/state] GET error:', error.message);
      return new Response(JSON.stringify(defaultState()), { status: 200, headers });
    }
    if (!row || !row.state_data) {
      return new Response(JSON.stringify(defaultState()), { status: 200, headers });
    }
    const lastModified = row.last_modified
      ? new Date(row.last_modified).getTime()
      : 0;
    const body = { ...row.state_data, lastModified };
    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch (err) {
    console.error('[api/state] GET exception:', err);
    return new Response(JSON.stringify(defaultState()), { status: 200, headers });
  }
}

export async function POST(request) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  const supabase = getSupabase();
  if (!supabase) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }
  try {
    const body = await request.json();
    const { error } = await supabase
      .from('app_state')
      .upsert(
        {
          id: APP_STATE_ROW_ID,
          state_data: body,
          last_modified: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('[api/state] POST error:', error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers,
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    console.error('[api/state] POST exception:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers,
    });
  }
}

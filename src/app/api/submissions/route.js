let submissionsStore = [];

export async function GET() {
  return new Response(JSON.stringify(submissionsStore), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    body.id = String(Date.now());
    submissionsStore.push(body);
    return new Response(JSON.stringify(body), { status: 201, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 });
  }
}

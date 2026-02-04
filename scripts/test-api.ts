const BASE = 'http://localhost:3000';

async function request(method: string, path: string, body?: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function run() {
  console.log('=== API Tests ===\n');
  let hostToken: string | null = null;
  let userToken: string | null = null;
  let adminToken: string | null = null;
  let experienceId: number | null = null;

  const r = (name: string, res: { status: number; data: unknown }, expectStatus?: number) => {
    const ok = expectStatus == null ? res.status < 400 : res.status === expectStatus;
    console.log(ok ? '[OK]' : '[FAIL]', name, '->', res.status, expectStatus != null ? `(expected ${expectStatus})` : '');
    if (!ok) console.log('  Response:', JSON.stringify(res.data, null, 2));
    return ok;
  };

  let health = await request('GET', '/health');
  r('GET /health', health, 200);
  if ((health.data as { status?: string })?.status !== 'healthy') {
    console.log('Server or DB not ready. Ensure server is running and DATABASE_URL is correct.');
    process.exit(1);
  }

  const signupHost = await request('POST', '/auth/signup', {
    email: 'testhost@example.com',
    password: 'password123',
    role: 'host',
  });
  r('POST /auth/signup (host)', signupHost, 201);

  const signupUser = await request('POST', '/auth/signup', {
    email: 'testuser@example.com',
    password: 'password123',
    role: 'user',
  });
  r('POST /auth/signup (user)', signupUser, 201);

  const loginHost = await request('POST', '/auth/login', {
    email: 'testhost@example.com',
    password: 'password123',
  });
  r('POST /auth/login (host)', loginHost, 200);
  if (loginHost.status === 200 && typeof (loginHost.data as { token?: string })?.token === 'string') {
    hostToken = (loginHost.data as { token: string }).token;
  }

  const loginUser = await request('POST', '/auth/login', {
    email: 'testuser@example.com',
    password: 'password123',
  });
  r('POST /auth/login (user)', loginUser, 200);
  if (loginUser.status === 200 && typeof (loginUser.data as { token?: string })?.token === 'string') {
    userToken = (loginUser.data as { token: string }).token;
  }

  const createExp = await request('POST', '/experiences', {
    title: 'Sunset Yoga',
    description: 'Beach yoga',
    location: 'Miami',
    price: 50,
    start_time: '2026-03-01T18:00:00.000Z',
  }, hostToken ?? undefined);
  r('POST /experiences (host)', createExp, 201);
  if (createExp.status === 201 && (createExp.data as { id?: number })?.id) {
    experienceId = (createExp.data as { id: number }).id;
  }

  const publishExp = await request('PATCH', `/experiences/${experienceId}/publish`, undefined, hostToken ?? undefined);
  r('PATCH /experiences/:id/publish (owner)', publishExp, 200);

  const listExp = await request('GET', '/experiences?page=1&limit=5');
  r('GET /experiences (public list)', listExp, 200);

  const bookExp = await request('POST', `/experiences/${experienceId}/book`, { seats: 2 }, userToken ?? undefined);
  r('POST /experiences/:id/book (user)', bookExp, 201);

  const blockAsUser = await request('PATCH', `/experiences/${experienceId}/block`, undefined, userToken ?? undefined);
  r('PATCH /experiences/:id/block as user (expect 403)', blockAsUser, 403);

  const loginBad = await request('POST', '/auth/login', { email: 'testhost@example.com', password: 'wrong' });
  r('POST /auth/login (wrong password)', loginBad, 401);

  const createExpNoAuth = await request('POST', '/experiences', {
    title: 'X',
    description: 'X',
    location: 'X',
    price: 10,
    start_time: '2026-03-01T18:00:00.000Z',
  });
  r('POST /experiences (no auth)', createExpNoAuth, 401);

  console.log('\n=== Tests completed ===');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

const BASE = 'http://localhost:3000';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function r(name, res, expectStatus) {
  const ok = expectStatus == null ? res.status < 400 : res.status === expectStatus;
  console.log(ok ? '[OK]' : '[FAIL]', name, '->', res.status, expectStatus != null ? `(expected ${expectStatus})` : '');
  if (!ok) console.log('  Response:', JSON.stringify(res.data, null, 2));
  return ok;
}

async function run() {
  console.log('=== API Tests ===\n');
  let hostToken = null;
  let userToken = null;
  let experienceId = null;
  const suffix = Date.now();
  const hostEmail = `testhost${suffix}@example.com`;
  const userEmail = `testuser${suffix}@example.com`;

  let health = await request('GET', '/health');
  r('GET /health', health, 200);
  if (health.data?.status !== 'healthy') {
    console.log('Server or DB not ready. Ensure server is running and DATABASE_URL is correct.');
    process.exit(1);
  }

  const signupHost = await request('POST', '/auth/signup', {
    email: hostEmail,
    password: 'password123',
    role: 'host',
  });
  r('POST /auth/signup (host)', signupHost, 201);

  const signupUser = await request('POST', '/auth/signup', {
    email: userEmail,
    password: 'password123',
    role: 'user',
  });
  r('POST /auth/signup (user)', signupUser, 201);

  const loginHost = await request('POST', '/auth/login', {
    email: hostEmail,
    password: 'password123',
  });
  r('POST /auth/login (host)', loginHost, 200);
  if (loginHost.status === 200 && loginHost.data?.token) hostToken = loginHost.data.token;

  const loginUser = await request('POST', '/auth/login', {
    email: userEmail,
    password: 'password123',
  });
  r('POST /auth/login (user)', loginUser, 200);
  if (loginUser.status === 200 && loginUser.data?.token) userToken = loginUser.data.token;

  const createExp = await request('POST', '/experiences', {
    title: 'Sunset Yoga',
    description: 'Beach yoga',
    location: 'Miami',
    price: 50,
    start_time: '2026-03-01T18:00:00.000Z',
  }, hostToken);
  r('POST /experiences (host)', createExp, 201);
  if (createExp.status === 201 && createExp.data?.id) experienceId = createExp.data.id;

  const publishExp = await request('PATCH', `/experiences/${experienceId}/publish`, undefined, hostToken);
  r('PATCH /experiences/:id/publish (owner)', publishExp, 200);

  const listExp = await request('GET', '/experiences?page=1&limit=5');
  r('GET /experiences (public list)', listExp, 200);

  const bookExp = await request('POST', `/experiences/${experienceId}/book`, { seats: 2 }, userToken);
  r('POST /experiences/:id/book (user)', bookExp, 201);

  const blockAsUser = await request('PATCH', `/experiences/${experienceId}/block`, undefined, userToken);
  r('PATCH /experiences/:id/block as user (expect 403)', blockAsUser, 403);

  const duplicateBook = await request('POST', `/experiences/${experienceId}/book`, { seats: 1 }, userToken);
  r('POST /experiences/:id/book duplicate (expect 400)', duplicateBook, 400);

  const loginBad = await request('POST', '/auth/login', { email: hostEmail, password: 'wrong' });
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

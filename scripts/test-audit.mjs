// Test script for audit-logs endpoints
// Usage: node scripts/test-audit.mjs
// Requires: server running, .env with valid credentials

const BASE = process.env.BASE_URL || 'http://localhost:5002';
let token = '';

async function login() {
  const email = process.env.TEST_EMAIL || 'admin@sociotech.com.do';
  const password = process.env.TEST_PASSWORD || 'Admin123!';

  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  token = body.data?.accessToken || body.accessToken;
  if (!token) {
    console.error('Login failed. Set TEST_EMAIL/TEST_PASSWORD env vars.');
    console.error('Response:', JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log(`✓ Logged in as ${email}\n`);
}

async function request(method, path) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const body = await res.json();
  return { status: res.status, body };
}

function validateContract(label, body, expectedShape) {
  const issues = [];

  // Must have success field
  if (typeof body.success !== 'boolean') {
    issues.push('missing "success" boolean');
  }

  for (const [key, type] of Object.entries(expectedShape)) {
    if (type === 'any') continue;
    if (key === 'data' && body.data === null) continue; // allow null data for 404
    const actual = typeof body[key];
    if (type === 'array' && !Array.isArray(body[key])) {
      issues.push(`"${key}" should be array, got ${actual}`);
    } else if (type !== 'array' && actual !== type) {
      issues.push(`"${key}" should be ${type}, got ${actual}`);
    }
  }

  if (issues.length > 0) {
    console.log(`  ✗ Contract issues: ${issues.join(', ')}`);
    console.log(`    Body: ${JSON.stringify(body, null, 4)}`);
  }
  return issues.length === 0;
}

function validateAuditLogEntry(item, index) {
  const issues = [];

  if (!item._id) issues.push(`[${index}] missing _id`);
  if (!item.eventId) issues.push(`[${index}] missing eventId`);
  if (!item.timestamp) issues.push(`[${index}] missing timestamp`);

  if (item.actor !== null && typeof item.actor === 'object') {
    if (!item.actor.userId) issues.push(`[${index}] actor.userId missing`);
    if (!item.actor.email) issues.push(`[${index}] actor.email missing`);
    if (!item.actor.roleName) issues.push(`[${index}] actor.roleName missing`);
  }

  if (!item.action) issues.push(`[${index}] missing action`);
  if (item.resource && typeof item.resource === 'object') {
    if (!item.resource.type) issues.push(`[${index}] resource.type missing`);
  } else {
    issues.push(`[${index}] resource missing`);
  }

  if (item.context && typeof item.context === 'object') {
    if (!item.context.method) issues.push(`[${index}] context.method missing`);
    if (!item.context.path) issues.push(`[${index}] context.path missing`);
  } else {
    issues.push(`[${index}] context missing`);
  }

  if (item.result && !['success', 'failure'].includes(item.result)) {
    issues.push(`[${index}] result should be "success"|"failure", got "${item.result}"`);
  }

  return issues;
}

async function run() {
  await login();

  let passed = 0;
  let failed = 0;

  // --- Test 1: List audit logs (default) ---
  console.log('1. GET /audit-logs');
  let { status, body } = await request('GET', '/audit-logs');
  console.log(`   Status: ${status}`);

  let ok = validateContract('List response', body, {
    success: 'boolean',
    data: 'array',
    meta: 'object',
  });
  if (ok && status === 200) {
    const issues = [];
    for (let i = 0; i < (body.data || []).length; i++) {
      issues.push(...validateAuditLogEntry(body.data[i], i));
    }
    if (issues.length > 0) {
      console.log(`  ✗ Data validation issues:`);
      issues.forEach((i) => console.log(`    ${i}`));
      ok = false;
    } else {
      console.log(`  ✓ ${body.data.length} entries, all valid`);
    }
  }
  passed += ok ? 1 : 0;
  failed += ok ? 0 : 1;

  // --- Test 2: Pagination ---
  console.log('\n2. GET /audit-logs?limit=2');
  ({ status, body } = await request('GET', '/audit-logs?limit=2'));
  console.log(`   Status: ${status}`);
  ok = validateContract('Paginated', body, { success: 'boolean', data: 'array', meta: 'object' });
  if (ok && body.meta) {
    if (typeof body.meta.hasMore === 'boolean') {
      console.log(`   ✓ hasMore: ${body.meta.hasMore}`);
    } else {
      console.log(`   ✗ meta.hasMore should be boolean`);
      ok = false;
    }
    if (body.data.length <= 2) {
      console.log(`   ✓ limit respected: ${body.data.length} entries`);
    } else {
      console.log(`   ✗ limit not respected: ${body.data.length} entries`);
      ok = false;
    }
  }
  passed += ok ? 1 : 0;
  failed += ok ? 0 : 1;

  // --- Test 3: Cursor-based pagination ---
  console.log('\n3. GET /audit-logs?limit=2 (page 2 via cursor)');
  if (body.meta?.nextCursor) {
    const cursor = body.meta.nextCursor;
    ({ status, body } = await request('GET', `/audit-logs?limit=2&cursor=${cursor}`));
    console.log(`   Status: ${status}`);
    ok = validateContract('Cursor page', body, { success: 'boolean', data: 'array', meta: 'object' });
    if (ok && body.data.length > 0) {
      console.log(`   ✓ ${body.data.length} entries on page 2`);
    } else if (ok) {
      console.log(`   ✓ No more entries (end of list)`);
    }
    passed += ok ? 1 : 0;
    failed += ok ? 0 : 1;
  } else {
    console.log('   ⚠ No cursor returned, skipping');
  }

  // --- Test 4: Filter by action ---
  console.log('\n4. GET /audit-logs?action=users:create');
  ({ status, body } = await request('GET', '/audit-logs?action=users:create'));
  console.log(`   Status: ${status}`);
  ok = validateContract('Filtered', body, { success: 'boolean', data: 'array', meta: 'object' });
  if (ok && body.data.length > 0) {
    const allMatch = body.data.every((e) => e.action === 'users:create');
    if (allMatch) {
      console.log(`   ✓ All ${body.data.length} entries have action=users:create`);
    } else {
      console.log(`   ✗ Not all entries match the filter`);
      ok = false;
    }
  } else if (ok) {
    console.log('   ✓ No matching entries (valid empty result)');
  }
  passed += ok ? 1 : 0;
  failed += ok ? 0 : 1;

  // --- Test 5: Filter by userId ---
  console.log('\n5. GET /audit-logs?userId=<first entry actor.userId>');
  const { body: listBody } = await request('GET', '/audit-logs?limit=1');
  const firstEntry = listBody.data?.[0];
  if (firstEntry?.actor?.userId) {
    const uid = firstEntry.actor.userId;
    ({ status, body } = await request('GET', `/audit-logs?userId=${uid}`));
    console.log(`   Status: ${status} (filtering by ${uid})`);
    ok = validateContract('User filter', body, { success: 'boolean', data: 'array', meta: 'object' });
    if (ok && body.data.length > 0) {
      const allMatch = body.data.every((e) => e.actor?.userId === uid);
      if (allMatch) {
        console.log(`   ✓ All ${body.data.length} entries match userId`);
      } else {
        console.log(`   ✗ Not all entries match userId filter`);
        ok = false;
      }
    }
    passed += ok ? 1 : 0;
    failed += ok ? 0 : 1;
  } else {
    console.log('   ⚠ No entries to test userId filter, skipping');
  }

  // --- Test 6: Filter by resourceType ---
  console.log('\n6. GET /audit-logs?resourceType=User');
  ({ status, body } = await request('GET', '/audit-logs?resourceType=User'));
  console.log(`   Status: ${status}`);
  ok = validateContract('Resource filter', body, { success: 'boolean', data: 'array', meta: 'object' });
  if (ok && body.data.length > 0) {
    const allMatch = body.data.every((e) => e.resource?.type === 'User');
    if (allMatch) {
      console.log(`   ✓ All ${body.data.length} entries match resourceType=User`);
    } else {
      console.log(`   ✗ Not all entries match resourceType filter`);
      ok = false;
    }
  }
  passed += ok ? 1 : 0;
  failed += ok ? 0 : 1;

  // --- Test 7: Get by ID (if we have entries) ---
  console.log('\n7. GET /audit-logs/:id (first entry)');
  const { body: singleBody } = await request('GET', '/audit-logs?limit=1');
  const entry = singleBody.data?.[0];
  if (entry?._id) {
    ({ status, body } = await request('GET', `/audit-logs/${entry._id}`));
    console.log(`   Status: ${status}`);
    ok = validateContract('Single entry', body, { success: 'boolean', data: 'object' });
    if (ok) {
      const issues = validateAuditLogEntry(body.data, 0);
      if (issues.length > 0) {
        console.log(`  ✗ Validation: ${issues.join(', ')}`);
        ok = false;
      } else {
        console.log(`  ✓ Entry matches contract`);
      }
    }
    passed += ok ? 1 : 0;
    failed += ok ? 0 : 1;
  } else {
    console.log('   ⚠ No entries to test by ID, skipping');
  }

  // --- Test 8: 404 for non-existent ID ---
  console.log('\n8. GET /audit-logs/000000000000000000000000 (not found)');
  ({ status, body } = await request('GET', '/audit-logs/000000000000000000000000'));
  console.log(`   Status: ${status}`);
  ok = status === 404
    ? validateContract('404', body, { success: 'boolean', message: 'string', error: 'string' })
    : (console.log(`   ✗ Expected 404, got ${status}`), false);
  passed += ok ? 1 : 0;
  failed += ok ? 0 : 1;

  // --- Summary ---
  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(50));
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});

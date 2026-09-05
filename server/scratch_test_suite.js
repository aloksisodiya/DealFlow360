const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🚀 Starting DealFlow360 Complete Backend & Database Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // 1. Auth Login to obtain valid JWT Token
  let token = '';
  await test('1. Auth Login (Admin)', async () => {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arjavdariya2@gmail.com', password: 'Arjav@123' })
    });
    const json = await res.json();
    if (!json.token) throw new Error(json.message || 'No token returned');
    token = json.token;
  });

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // 2. Dashboard
  await test('2. Dashboard Metrics & Activities', async () => {
    const [mRes, aRes] = await Promise.all([
      fetch(`${BASE_URL}/dashboard/metrics`, { headers: headers() }),
      fetch(`${BASE_URL}/dashboard/activities`, { headers: headers() })
    ]);
    const mJson = await mRes.json();
    const aJson = await aRes.json();
    if (!mJson.success || !mJson.data.pipelineValue) throw new Error('Invalid metrics response');
    if (!aJson.success || !Array.isArray(aJson.data)) throw new Error('Invalid activities response');
  });

  // 3. Products Module
  let createdProductId = '';
  await test('3. Products - List & Create', async () => {
    const listRes = await fetch(`${BASE_URL}/products`, { headers: headers() });
    const listJson = await listRes.json();
    if (!listJson.success || !Array.isArray(listJson.data)) throw new Error('Failed to list products');

    const createRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'AI Analytics Copilot Module',
        sku: `SKU-AI-${Date.now()}`,
        category: 'Software Modules',
        price: 3499.00,
        unit: 'per license/mo',
        margin_percent: 85.0,
        stock_status: 'In Stock'
      })
    });
    const createJson = await createRes.json();
    if (!createJson.success || !createJson.data.id) throw new Error('Failed to create product');
    createdProductId = createJson.data.id;
  });

  // 4. Invoices Module
  let createdInvoiceId = '';
  await test('4. Invoices - List, Create & Update Status', async () => {
    const listRes = await fetch(`${BASE_URL}/invoices`, { headers: headers() });
    const listJson = await listRes.json();
    if (!listJson.success || !Array.isArray(listJson.data)) throw new Error('Failed to list invoices');

    const createRes = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        customer_name: 'Stark Enterprises',
        customer_email: 'finance@stark.com',
        amount: 87500.00,
        status: 'Pending',
        due_date: '2026-10-15',
        payment_method: 'ACH'
      })
    });
    const createJson = await createRes.json();
    if (!createJson.success || !createJson.data.id) throw new Error('Failed to create invoice');
    createdInvoiceId = createJson.data.id;

    const patchRes = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: 'Paid', notes: 'Settled full amount via Wire' })
    });
    const patchJson = await patchRes.json();
    if (!patchJson.success || patchJson.data.status !== 'Paid') throw new Error('Failed to update invoice status');
  });

  // 5. Subscriptions Module
  let createdSubId = '';
  await test('5. Subscriptions - List, Create & Pause', async () => {
    const listRes = await fetch(`${BASE_URL}/subscriptions`, { headers: headers() });
    const listJson = await listRes.json();
    if (!listJson.success || !Array.isArray(listJson.data)) throw new Error('Failed to list subscriptions');

    const createRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        customer_name: 'Wayne Industries',
        plan_name: 'Enterprise Ultra Cloud',
        billing_cycle: 'Monthly',
        amount: 5400.00,
        seats: 50
      })
    });
    const createJson = await createRes.json();
    if (!createJson.success || !createJson.data.id) throw new Error('Failed to create subscription');
    createdSubId = createJson.data.id;

    const patchRes = await fetch(`${BASE_URL}/subscriptions/${createdSubId}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: 'Paused' })
    });
    const patchJson = await patchRes.json();
    if (!patchJson.success || patchJson.data.status !== 'Paused') throw new Error('Failed to update subscription status');
  });

  // 6. Deal Health Module
  await test('6. Deal Health - Alerts & Resolve', async () => {
    const listRes = await fetch(`${BASE_URL}/deal-health/alerts`, { headers: headers() });
    const listJson = await listRes.json();
    if (!listJson.success || !Array.isArray(listJson.data)) throw new Error('Failed to list deal health alerts');

    if (listJson.data.length > 0) {
      const alertId = listJson.data[0].id;
      const resolveRes = await fetch(`${BASE_URL}/deal-health/resolve`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ alertId })
      });
      const resolveJson = await resolveRes.json();
      if (!resolveJson.success) throw new Error('Failed to resolve alert');
    }
  });

  // 7. Quotations & Approvals
  await test('7. Quotations & Sales Manager Approvals', async () => {
    const quotesRes = await fetch(`${BASE_URL}/sales/rep/quotations`, { headers: headers() });
    const quotesJson = await quotesRes.json();
    if (!quotesJson.success || !Array.isArray(quotesJson.data)) throw new Error('Failed to list quotations');

    const apprRes = await fetch(`${BASE_URL}/sales/manager/approvals`, { headers: headers() });
    const apprJson = await apprRes.json();
    if (!apprJson.success || !Array.isArray(apprJson.data)) throw new Error('Failed to list approvals');

    const newApprRes = await fetch(`${BASE_URL}/sales/manager/approvals`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        customer: 'Cyberdyne Systems',
        amount: 145000,
        discountNum: 25,
        stage: 'Sales Manager'
      })
    });
    const newApprJson = await newApprRes.json();
    if (!newApprJson.success) throw new Error('Failed to create approval request');
  });

  // 8. Finance, Warehouses & Inventory
  await test('8. Finance Warehouses & Inventory Transfers', async () => {
    const whRes = await fetch(`${BASE_URL}/finance/warehouses`, { headers: headers() });
    const whJson = await whRes.json();
    if (!whJson.success || !Array.isArray(whJson.data)) throw new Error('Failed to fetch warehouses');

    const invRes = await fetch(`${BASE_URL}/finance/inventory`, { headers: headers() });
    const invJson = await invRes.json();
    if (!invJson.success || !Array.isArray(invJson.data)) throw new Error('Failed to fetch inventory');

    const allocRes = await fetch(`${BASE_URL}/finance/inventory/allocate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        warehouseId: 'wh-main',
        productId: 'prod-1',
        stockDelta: 10
      })
    });
    const allocJson = await allocRes.json();
    if (!allocJson.success) throw new Error('Failed to allocate stock');

    const ordersRes = await fetch(`${BASE_URL}/finance/fulfillment/orders`, { headers: headers() });
    const ordersJson = await ordersRes.json();
    if (!ordersJson.success || !Array.isArray(ordersJson.data)) throw new Error('Failed to fetch fulfillment orders');
  });

  // 9. Pipeline Reports
  await test('9. Pipeline Analytics & Reports', async () => {
    const repRes = await fetch(`${BASE_URL}/reports/pipeline`, { headers: headers() });
    const repJson = await repRes.json();
    if (!repJson.success || !repJson.data.kpis) throw new Error('Failed to fetch reports');
  });

  console.log(`\n========================================`);
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});

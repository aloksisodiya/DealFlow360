import db from "../config/db.js";

async function run() {
  const warrantyProds = [
    {
      id: 'prod-wrn-3m',
      name: '3-Month Hardware Extended Warranty',
      sku: 'SKU-WRN-3M',
      category: 'Subscriptions',
      avatar: 'W3',
      avatar_color: 'blue',
      price: 2999.00,
      unit: 'per unit',
      margin_percent: 80.00,
      stock_status: 'In Stock',
      variants: JSON.stringify(['48-hr Parts Replacement', 'Diagnostics Support']),
      tier_pricing: JSON.stringify({ Bronze: 2999, Silver: 2849, Gold: 2699, Enterprise: 2549 }),
      description: 'Essential component and diagnostic coverage for fast-paced project rollouts and temporary hardware deployments.',
      is_active: true
    },
    {
      id: 'prod-wrn-6m',
      name: '6-Month Extended Care Warranty',
      sku: 'SKU-WRN-6M',
      category: 'Subscriptions',
      avatar: 'W6',
      avatar_color: 'purple',
      price: 5499.00,
      unit: 'per unit',
      margin_percent: 80.00,
      stock_status: 'In Stock',
      variants: JSON.stringify(['24-hr Hub Dispatch', 'Motherboard & Screen Protection']),
      tier_pricing: JSON.stringify({ Bronze: 5499, Silver: 5224, Gold: 4949, Enterprise: 4674 }),
      description: 'Extended component, motherboard, and optical transceiver protection with regional hub spare stocking.',
      is_active: true
    },
    {
      id: 'prod-wrn-12m',
      name: '12-Month Comprehensive Full Care Warranty',
      sku: 'SKU-WRN-12M',
      category: 'Subscriptions',
      avatar: 'W1',
      avatar_color: 'amber',
      price: 9999.00,
      unit: 'per unit',
      margin_percent: 85.00,
      stock_status: 'In Stock',
      variants: JSON.stringify(['Same-Day Onsite SLA', 'Free Annual Overhaul Kit', 'VIP Level-3 Line']),
      tier_pricing: JSON.stringify({ Bronze: 9999, Silver: 9499, Gold: 8999, Enterprise: 8499 }),
      description: 'Bumper-to-bumper VIP warranty with same-day onsite engineer dispatch across 12 Indian metros and annual overhaul kit.',
      is_active: true
    }
  ];

  for (const wp of warrantyProds) {
    await db('products').insert(wp).onConflict('id').merge();
  }

  const warehouses = await db('warehouses').select('id');
  for (const wp of warrantyProds) {
    for (const w of warehouses) {
      const existing = await db('warehouse_inventory').where({ warehouse_id: w.id, product_id: wp.id }).first();
      if (existing) {
        await db('warehouse_inventory').where({ id: existing.id }).update({ stock_qty: 500, product_name: wp.name });
      } else {
        await db('warehouse_inventory').insert({
          warehouse_id: w.id,
          product_id: wp.id,
          product_name: wp.name,
          stock_qty: 500
        });
      }
    }
  }

  console.log('✅ Added/Updated 3 Warranty Subscription Plans in Products Catalog DB!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

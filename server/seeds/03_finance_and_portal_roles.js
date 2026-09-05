/**
 * Knex Seed: Populates initial sample data for Finance/Ops & Customer Portal roles
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing entries
  await knex("approval_audit_logs").del();
  await knex("portal_line_comments").del();
  await knex("credit_notes").del();
  await knex("quotation_fulfillment_splits").del();
  await knex("warehouse_inventory").del();
  await knex("warehouses").del();

  // 1. Insert Warehouses (PDF Section A4)
  await knex("warehouses").insert([
    {
      id: "wh-main",
      name: "Main Warehouse",
      location: "Chicago, IL",
      shipping_cost_weight: 1.0
    },
    {
      id: "wh-east",
      name: "East Depot",
      location: "Newark, NJ",
      shipping_cost_weight: 1.2
    }
  ]);

  // 2. Insert Warehouse Inventory (PDF Section A4 & B6)
  await knex("warehouse_inventory").insert([
    { warehouse_id: "wh-main", product_id: "prod-1", product_name: "Enterprise Server Rack X1", stock_qty: 150 },
    { warehouse_id: "wh-main", product_id: "prod-2", product_name: "Setup & Onboarding Service", stock_qty: 999 },
    { warehouse_id: "wh-east", product_id: "prod-1", product_name: "Enterprise Server Rack X1", stock_qty: 30 },
    { warehouse_id: "wh-east", product_id: "prod-2", product_name: "Setup & Onboarding Service", stock_qty: 999 }
  ]);

  // 3. Insert Reconciled Credit Notes (PDF Section A5 & B7)
  await knex("credit_notes").insert([
    {
      id: "CN-1001",
      quote_id: "Q-9402",
      customer_name: "Acme Corp",
      amount: 450.00,
      reason: "Mid-cycle subscription downgrade proration credit",
      type: "Proration Partial Refund",
      status: "Reconciled"
    }
  ]);

  // 4. Insert Portal Line Item Comments (PDF Section B8)
  await knex("portal_line_comments").insert([
    {
      quote_id: "Q-8841",
      line_item_id: "prod-2",
      sender_role: "Customer",
      comment_text: "Can we get an additional 5% volume discount if we order 5 setup packages instead of 3?"
    },
    {
      quote_id: "Q-8841",
      line_item_id: "prod-2",
      sender_role: "Finance",
      comment_text: "Finance reviewed: approved special 15% tier pricing on Order #8841 subject to 5-unit volume."
    }
  ]);

  // 5. Insert Approval Audit Trail (PDF Section A3 & B4)
  await knex("approval_audit_logs").insert([
    {
      quote_id: "Q-9402",
      reviewer_role: "Finance",
      reviewer_id: "fin-admin-1",
      action: "APPROVE",
      reason: "High risk discount approved due to multi-year Gold contract commit."
    }
  ]);
}

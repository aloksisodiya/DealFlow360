import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Plus, 
  Search, 
  ChevronRight, 
  MoreVertical, 
  Info, 
  CheckCircle2, 
  X, 
  ArrowUpDown, 
  Layers, 
  Box, 
  Warehouse, 
  Truck, 
  Check, 
  AlertTriangle, 
  Download,
  Loader2
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { 
  fetchInventory, 
  fetchFulfillmentOrders, 
  allocateStock, 
  transferStock, 
  overrideFulfillmentSplit 
} from '../../services/fulfillmentService';
import './Fulfillment.css';

export default function Fulfillment({ user, onNavigate, onLogout }) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Warehouse Inventory State from database
  const [warehouseFilter, setWarehouseFilter] = useState('all'); // 'all' | 'Main Warehouse' | 'East Depot'
  const [inventoryList, setInventoryList] = useState([]);

  // Orders Awaiting Fulfillment State from database
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'split-pending' | 'backorder'
  const [searchQuery, setSearchQuery] = useState('');
  const [ordersList, setOrdersList] = useState([]);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'newAllocation' | 'transfer' | 'restock' | 'manageSplit' | 'reviewStock' | 'footerModal'
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Form states for modals
  const [newAllocWarehouse, setNewAllocWarehouse] = useState('Main Warehouse');
  const [newAllocProduct, setNewAllocProduct] = useState('Enterprise Server Rack X1');
  const [newAllocQty, setNewAllocQty] = useState(25);

  const [transferOrigin, setTransferOrigin] = useState('Main Warehouse');
  const [transferDest, setTransferDest] = useState('East Depot');
  const [transferQty, setTransferQty] = useState(5);

  const [restockQty, setRestockQty] = useState(20);

  // Split management state
  const [splitDraft, setSplitDraft] = useState(null);

  const loadFulfillmentData = async () => {
    try {
      setLoading(true);
      const [invData, ordData] = await Promise.all([
        fetchInventory().catch(() => []),
        fetchFulfillmentOrders().catch(() => [])
      ]);
      if (Array.isArray(invData) && invData.length > 0) {
        setInventoryList(invData);
      }
      if (Array.isArray(ordData) && ordData.length > 0) {
        setOrdersList(ordData);
      }
    } catch (err) {
      console.error('Failed to load fulfillment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFulfillmentData();
  }, []);

  // Filter handlers
  const filteredInventory = inventoryList.filter(item => {
    if (warehouseFilter === 'all') return true;
    return (item.warehouse || '').toLowerCase().includes(warehouseFilter.toLowerCase());
  });

  const filteredOrders = ordersList.filter(order => {
    const matchesFilter = 
      orderFilter === 'all' ? true :
      orderFilter === 'split-pending' ? order.status === 'Split Pending' :
      orderFilter === 'backorder' ? order.status === 'Backorder' : true;

    const matchesSearch = 
      (order.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.warehouses || []).some(w => w.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Warehouse', 'Product', 'SKU', 'In Stock', 'Reserved', 'Available', 'Status'];
    const rows = inventoryList.map(i => [
      i.warehouse,
      i.product,
      i.sku,
      i.inStock,
      i.reserved,
      i.available,
      i.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory CSV exported successfully!');
  };

  // Open Transfer Modal
  const handleOpenTransfer = (item) => {
    setSelectedInventory(item);
    setTransferOrigin(item.warehouse);
    setTransferDest(item.warehouse === 'Main Warehouse' ? 'East Depot' : 'Main Warehouse');
    setTransferQty(Math.min(5, item.available || 5));
    setActiveModal('transfer');
  };

  // Open Restock Modal
  const handleOpenRestock = (item) => {
    setSelectedInventory(item);
    setRestockQty(20);
    setActiveModal('restock');
  };

  // Submit Transfer
  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (transferQty <= 0) {
      showToast('Please enter a valid transfer quantity.');
      return;
    }

    const fromWhId = transferOrigin.includes('East') ? 'wh-east' : 'wh-main';
    const toWhId = transferDest.includes('East') ? 'wh-east' : 'wh-main';
    const prodId = selectedInventory?.productId || 'prod-1';

    try {
      await transferStock({
        fromWarehouseId: fromWhId,
        toWarehouseId: toWhId,
        productId: prodId,
        qty: Number(transferQty)
      });
      showToast(`Transferred ${transferQty} units of ${selectedInventory.product} to ${transferDest}!`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Transfer failed: ${err.message}`);
    }
  };

  // Submit Restock
  const handleSubmitRestock = async (e) => {
    e.preventDefault();
    if (restockQty <= 0) {
      showToast('Please enter a valid restock quantity.');
      return;
    }

    const whId = (selectedInventory?.warehouse || '').includes('East') ? 'wh-east' : 'wh-main';
    const prodId = selectedInventory?.productId || 'prod-1';

    try {
      await allocateStock({
        warehouseId: whId,
        productId: prodId,
        productName: selectedInventory?.product,
        stockDelta: Number(restockQty)
      });
      showToast(`Restocked ${restockQty} units at ${selectedInventory.warehouse}!`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Restock failed: ${err.message}`);
    }
  };

  // Submit New Allocation
  const handleSubmitNewAllocation = async (e) => {
    e.preventDefault();
    if (newAllocQty <= 0) {
      showToast('Quantity must be greater than zero.');
      return;
    }

    const whId = newAllocWarehouse.includes('East') ? 'wh-east' : 'wh-main';

    try {
      await allocateStock({
        warehouseId: whId,
        productId: newAllocProduct.includes('Server') ? 'prod-1' : 'prod-2',
        productName: newAllocProduct,
        stockDelta: Number(newAllocQty)
      });
      showToast(`Allocated ${newAllocQty} units of ${newAllocProduct} to ${newAllocWarehouse}!`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Allocation failed: ${err.message}`);
    }
  };

  // Open Manage Split Modal
  const handleOpenManageSplit = (order) => {
    setSelectedOrder(order);
    setSplitDraft(JSON.parse(JSON.stringify(order.items)));
    setActiveModal('manageSplit');
  };

  // Open Review Stock Modal
  const handleOpenReviewStock = (order) => {
    setSelectedOrder(order);
    setActiveModal('reviewStock');
  };

  // Save Split changes
  const handleSaveSplit = async () => {
    try {
      await overrideFulfillmentSplit(selectedOrder.code, splitDraft);
      showToast(`Warehouse split allocation saved for ${selectedOrder.code}! Dispatch scheduled.`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Split update failed: ${err.message}`);
    }
  };

  return (
    <div className="fulfillment-container">
      {/* Universal Top Navigation */}
      <Navbar 
        activePage="fulfillment" 
        user={user} 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        onToast={showToast}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={18} color="#e9d5e3" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Fulfillment Content */}
      <main className="fulfillment-main animate-fade-in">
        
        {/* Page Subheader */}
        <div className="fulfillment-header-row">
          <div className="fulfillment-title-group">
            <h1 className="fulfillment-title">Fulfillment and Stock (List)</h1>
            <p className="fulfillment-subtitle">
              Live stock per warehouse, plus every order that still needs fulfilling
            </p>
          </div>

          <div className="fulfillment-actions-group">
            <button 
              className="btn-export-inventory"
              onClick={handleExportCSV}
              title="Download full inventory report as CSV"
            >
              <Upload size={15} style={{ transform: 'rotate(180deg)' }} />
              <span>Export Inventory CSV</span>
            </button>

            <button 
              className="btn-new-allocation"
              onClick={() => setActiveModal('newAllocation')}
            >
              <Plus size={16} />
              <span>New Stock Allocation</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: Warehouse Inventory Levels */}
        <div className="fulfillment-section-card">
          <div className="section-header-row">
            <div className="section-title-left">
              <span className="wh-dot purple" style={{ width: '9px', height: '9px' }}></span>
              <span className="section-title-text">Warehouse Inventory Levels</span>
              <span className="section-title-muted">3 monitored locations</span>
            </div>

            <div className="section-filters-right">
              <div className="segmented-filter-group">
                <button 
                  className={`btn-filter-tab ${warehouseFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setWarehouseFilter('all')}
                >
                  All Warehouses
                </button>
                <button 
                  className={`btn-filter-tab ${warehouseFilter === 'Main Warehouse' ? 'active' : ''}`}
                  onClick={() => setWarehouseFilter('Main Warehouse')}
                >
                  Main Warehouse
                </button>
                <button 
                  className={`btn-filter-tab ${warehouseFilter === 'East Depot' ? 'active' : ''}`}
                  onClick={() => setWarehouseFilter('East Depot')}
                >
                  East Depot
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="fulfillment-table">
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Product</th>
                  <th>In Stock</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="warehouse-name-cell">
                        <span className={`wh-dot ${item.dotColor}`}></span>
                        <span>{item.warehouse}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.product}</td>
                    <td style={{ fontWeight: 700 }}>{item.inStock}</td>
                    <td style={{ color: '#64748b' }}>{item.reserved}</td>
                    <td style={{ 
                      fontWeight: 700, 
                      color: item.status === 'Low Stock' ? '#b45309' : '#0f172a' 
                    }}>
                      {item.available}
                    </td>
                    <td>
                      <span className={`stock-status-pill ${item.status === 'Optimal' ? 'optimal' : item.status === 'Low Stock' ? 'low' : 'healthy'}`}>
                        <span className="wh-dot" style={{ 
                          width: '6px', 
                          height: '6px', 
                          backgroundColor: item.status === 'Low Stock' ? '#f59e0b' : '#10b981' 
                        }}></span>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.status === 'Low Stock' ? (
                        <button 
                          className="btn-inventory-action"
                          onClick={() => handleOpenRestock(item)}
                        >
                          Restock
                        </button>
                      ) : (
                        <button 
                          className="btn-inventory-action"
                          onClick={() => handleOpenTransfer(item)}
                        >
                          Transfer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Orders Awaiting Fulfillment */}
        <div className="fulfillment-section-card">
          <div className="section-header-row">
            <div className="section-title-left">
              <div>
                <span className="section-title-text">Orders Awaiting Fulfillment</span>
                <span className="section-title-muted" style={{ display: 'block', marginTop: '2px', fontSize: '12.5px' }}>
                  Quotations authorized for fulfillment routing and warehouse dispatch
                </span>
              </div>
            </div>

            <div className="section-filters-right">
              <div className="segmented-filter-group">
                <button 
                  className={`btn-filter-tab ${orderFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('all')}
                >
                  All ({ordersList.length})
                </button>
                <button 
                  className={`btn-filter-tab ${orderFilter === 'split-pending' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('split-pending')}
                >
                  Split Pending ({ordersList.filter(o => o.status === 'Split Pending').length})
                </button>
                <button 
                  className={`btn-filter-tab ${orderFilter === 'backorder' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('backorder')}
                >
                  Backorder ({ordersList.filter(o => o.status === 'Backorder').length})
                </button>
              </div>

              <div className="orders-search-wrapper">
                <Search size={14} className="orders-search-icon" />
                <input 
                  type="text" 
                  className="orders-search-input"
                  placeholder="Filter orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="fulfillment-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Warehouses</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenManageSplit(order)}
                    >
                      <td>
                        <div className="order-code-cell">
                          <span className="order-code-text">{order.code}</span>
                          <span className={`order-type-badge ${order.type.toLowerCase()}`}>
                            {order.type}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            width: '26px', 
                            height: '26px', 
                            borderRadius: '6px', 
                            backgroundColor: '#f1f5f9', 
                            color: '#475569',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {order.initials}
                          </span>
                          <span style={{ fontWeight: 600 }}>{order.customer}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`fulfillment-status-pill ${order.status === 'Split Pending' ? 'split-pending' : 'backorder'}`}>
                          <span className="wh-dot" style={{ 
                            width: '6px', 
                            height: '6px', 
                            backgroundColor: order.status === 'Split Pending' ? '#f59e0b' : '#e11d48' 
                          }}></span>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="warehouse-tags-cell">
                          {order.warehouses.map((wh, idx) => (
                            <React.Fragment key={wh}>
                              <span className="wh-code-tag">{wh}</span>
                              {idx < order.warehouses.length - 1 && <span style={{ color: '#94a3b8', fontSize: '12px' }}>+</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {order.status === 'Split Pending' ? (
                            <button 
                              className="btn-manage-split"
                              onClick={() => handleOpenManageSplit(order)}
                            >
                              <span>Manage Split</span>
                              <ChevronRight size={14} />
                            </button>
                          ) : (
                            <button 
                              className="btn-review-stock"
                              onClick={() => handleOpenReviewStock(order)}
                            >
                              <span>Review Stock</span>
                              <ChevronRight size={14} />
                            </button>
                          )}

                          <div style={{ position: 'relative' }}>
                            <button 
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#94a3b8', 
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onClick={() => setOpenActionMenuId(openActionMenuId === order.id ? null : order.id)}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openActionMenuId === order.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                padding: '4px 0',
                                zIndex: 10,
                                minWidth: '170px'
                              }}>
                                <button 
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    showToast(`Printed Packing Slip for ${order.code}`);
                                  }}
                                >
                                  Print Packing Slip
                                </button>
                                <button 
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    showToast(`Dispatch hold placed on ${order.code}`);
                                  }}
                                >
                                  Hold Dispatch
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <div>
              Showing <strong style={{ color: '#0f172a' }}>1</strong> to <strong style={{ color: '#0f172a' }}>{filteredOrders.length}</strong> of <strong style={{ color: '#0f172a' }}>{ordersList.length}</strong> orders awaiting fulfillment
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button 
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '12px',
                  color: '#94a3b8',
                  cursor: 'not-allowed'
                }}
                disabled
              >
                Previous
              </button>
              <button 
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#54324c',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                1
              </button>
              <button 
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '12px',
                  color: '#94a3b8',
                  cursor: 'not-allowed'
                }}
                disabled
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Informational Banner / Tip Box */}
        <div style={{
          backgroundColor: '#fffdf5',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 800,
              flexShrink: 0
            }}>
              i
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#92400e' }}>
                Click an order row to open its warehouse split detail.
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '2px' }}>
                Review order allocation across multiple depots, fulfillment routing rules, and dispatch schedules.
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#b45309',
            fontFamily: 'monospace'
          }}>
            Shortcut: Enter ↵
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="pulse-dot"></span>
            <span>© 2025 DealFlow360 Inc. All rights reserved. Enterprise-grade deal intelligence.</span>
          </div>

          <div className="footer-links">
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('privacy'); setActiveModal('footerModal'); }}
            >
              Privacy Policy
            </button>
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('terms'); setActiveModal('footerModal'); }}
            >
              Terms of Service
            </button>
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('security'); setActiveModal('footerModal'); }}
            >
              Security & Compliance
            </button>
            <div className="status-badge">
              <span className="pulse-dot"></span>
              <span>System Status</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL 1: New Stock Allocation */}
      {activeModal === 'newAllocation' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>New Stock Allocation</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewAllocation}>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
                Allocate newly arrived freight or manufactured batches directly into regional warehouse depots.
              </p>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Destination Warehouse</label>
                <select 
                  className="form-input"
                  value={newAllocWarehouse}
                  onChange={(e) => setNewAllocWarehouse(e.target.value)}
                >
                  <option value="Main Warehouse">Main Warehouse (Central Hub)</option>
                  <option value="East Depot">East Depot (Regional East)</option>
                  <option value="West Coast Hub">West Coast Hub (San Jose)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product</label>
                <select 
                  className="form-input"
                  value={newAllocProduct}
                  onChange={(e) => setNewAllocProduct(e.target.value)}
                >
                  <option value="Laptop Pro 14">Laptop Pro 14 (SKU-LP14-PRO)</option>
                  <option value="Docking Station">Docking Station (SKU-DS-THUNDER)</option>
                  <option value="4K Thunderbolt Display 27">4K Thunderbolt Display 27</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Units to Allocate</label>
                <input 
                  type="number"
                  min="1"
                  className="form-input"
                  value={newAllocQty}
                  onChange={(e) => setNewAllocQty(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-new-allocation"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Inventory Transfer */}
      {activeModal === 'transfer' && selectedInventory && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowUpDown size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Transfer Stock</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Item to Transfer</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{selectedInventory.product}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Available at {selectedInventory.warehouse}: <strong>{selectedInventory.available} units</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Transfer Destination</label>
                <select 
                  className="form-input"
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                >
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="East Depot">East Depot</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Units to Transfer</label>
                <input 
                  type="number"
                  min="1"
                  max={selectedInventory.available}
                  className="form-input"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-new-allocation"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Restock */}
      {activeModal === 'restock' && selectedInventory && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Emergency Restock</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRestock}>
              <div style={{ background: '#fef3c7', padding: '12px 14px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>
                  Low Stock Warning: {selectedInventory.product}
                </div>
                <div style={{ fontSize: '12.5px', color: '#92400e', marginTop: '2px' }}>
                  Location: {selectedInventory.warehouse} (Only {selectedInventory.available} available units remaining).
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Inbound Restock Quantity</label>
                <input 
                  type="number"
                  min="5"
                  className="form-input"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-new-allocation"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Confirm Inbound Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Manage Split Modal */}
      {activeModal === 'manageSplit' && selectedOrder && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#714b67" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    Warehouse Split Router — {selectedOrder.code}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Customer: {selectedOrder.customer} • Priority: {selectedOrder.type}
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                Allocate Quantity by Warehouse Depot:
              </div>

              {splitDraft && splitDraft.map((item, idx) => (
                <div key={idx} className="split-router-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{item.product}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Order Requirement: {item.qty} units</div>
                    </div>
                    <span className="order-type-badge standard">Total: {item.qty}</span>
                  </div>

                  <div className="split-warehouse-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="wh-dot blue"></span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Main Warehouse</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Allocated:</span>
                      <input 
                        type="number"
                        min="0"
                        max={item.qty}
                        className="split-qty-input"
                        value={item.mainAlloc}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...splitDraft];
                          updated[idx].mainAlloc = val;
                          setSplitDraft(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div className="split-warehouse-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="wh-dot amber"></span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>East Depot</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Allocated:</span>
                      <input 
                        type="number"
                        min="0"
                        max={item.qty}
                        className="split-qty-input"
                        value={item.eastAlloc}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...splitDraft];
                          updated[idx].eastAlloc = val;
                          setSplitDraft(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12.5px', color: '#475569' }}>
              <strong>Routing Rule:</strong> {selectedOrder.routingRule}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-dash-secondary" 
                style={{ flex: 1 }}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-new-allocation"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleSaveSplit}
              >
                Authorize & Dispatch Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Review Stock for Backorder */}
      {activeModal === 'reviewStock' && selectedOrder && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#e11d48" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    Stock Shortage Review — {selectedOrder.code}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Customer: {selectedOrder.customer}
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#ffe4e6', padding: '14px', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e11d48' }}>Backorder Status Active</div>
              <div style={{ fontSize: '12.5px', color: '#9f1239', marginTop: '4px' }}>
                This order requires 12 units of Laptop Pro 14. Currently only 4 units are available at East Depot (8 units pending inbound freight arrival).
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', marginBottom: '20px', lineHeight: 1.5 }}>
              <div><strong>Suggested Resolution:</strong></div>
              <ul style={{ paddingLeft: '20px', marginTop: '6px', color: '#64748b' }}>
                <li>Auto-route 8 units from Main Warehouse (currently 22 available).</li>
                <li>Dispatch partial shipment of 4 units immediately to {selectedOrder.customer}.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-dash-secondary" 
                style={{ flex: 1 }}
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn-new-allocation"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  showToast('Inter-warehouse transfer initiated to clear backorder.');
                  setActiveModal(null);
                }}
              >
                Auto-Route from Main Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER MODAL */}
      {activeModal === 'footerModal' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {footerModalType === 'privacy' && 'Privacy Policy'}
                {footerModalType === 'terms' && 'Terms of Service'}
                {footerModalType === 'security' && 'Security & Compliance'}
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.65 }}>
              <p style={{ marginBottom: '12px' }}>
                DealFlow360 guarantees enterprise-grade security, automated stock tracking, and multi-warehouse fulfillment synchronization.
              </p>
              <p>
                All fulfillment logs, carrier integrations, and stock allocations are encrypted in transit and at rest.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

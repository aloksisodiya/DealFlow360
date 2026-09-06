import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  RefreshCw,
  Send,
  Zap
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { 
  fetchInventory, 
  fetchFulfillmentOrders, 
  allocateStock, 
  transferStock, 
  overrideFulfillmentSplit,
  dispatchOrder
} from '../../services/fulfillmentService';
import { canManageFulfillment } from '../../utils/rbac';
import './Fulfillment.css';

export default function Fulfillment({ user, onNavigate, onLogout }) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Warehouse Inventory State from database
  const [warehouseFilter, setWarehouseFilter] = useState('all'); // 'all' | 'Mumbai Central Hub' | 'Bengaluru Tech Depot' | 'Delhi NCR Logistics Hub'
  const [inventoryList, setInventoryList] = useState([]);

  // Orders Awaiting Fulfillment State from database
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'split-pending' | 'backorder' | 'dispatched'
  const [searchQuery, setSearchQuery] = useState('');
  const [ordersList, setOrdersList] = useState([]);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'newAllocation' | 'transfer' | 'restock' | 'manageSplit' | 'reviewStock' | 'footerModal'
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Form states for modals
  const [newAllocWarehouse, setNewAllocWarehouse] = useState('Mumbai Central Hub');
  const [newAllocProduct, setNewAllocProduct] = useState('');
  const [newAllocQty, setNewAllocQty] = useState(25);

  const [transferOrigin, setTransferOrigin] = useState('Mumbai Central Hub');
  const [transferDest, setTransferDest] = useState('Bengaluru Tech Depot');
  const [transferQty, setTransferQty] = useState(5);

  const [restockWarehouse, setRestockWarehouse] = useState('Mumbai Central Hub');
  const [restockProduct, setRestockProduct] = useState('');
  const [restockQty, setRestockQty] = useState(25);

  // Split management state
  const [splitDraft, setSplitDraft] = useState(null);

  const loadFulfillmentData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadFulfillmentData(true);
    // Real-time live background polling for inventory changes
    const interval = setInterval(() => {
      loadFulfillmentData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Unique list of products for allocation & restock dropdowns
  const uniqueProducts = useMemo(() => {
    const map = new Map();
    inventoryList.forEach(item => {
      if (item.product && !map.has(item.product)) {
        map.set(item.product, {
          productId: item.productId,
          productName: item.product,
          sku: item.sku
        });
      }
    });
    return Array.from(map.values());
  }, [inventoryList]);

  // Filter handlers
  const filteredInventory = inventoryList.filter(item => {
    if (warehouseFilter === 'all') return true;
    return (item.warehouse || '').toLowerCase().includes(warehouseFilter.toLowerCase());
  });

  const filteredOrders = ordersList.filter(order => {
    const matchesFilter = 
      orderFilter === 'all' ? true :
      orderFilter === 'split-pending' ? order.status === 'Split Pending' :
      orderFilter === 'backorder' ? order.status === 'Backorder' :
      orderFilter === 'dispatched' ? order.status === 'Dispatched' : true;

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
    const defaultDest = item.warehouse.includes('Mumbai') 
      ? 'Bengaluru Tech Depot' 
      : item.warehouse.includes('Bengaluru') 
      ? 'Delhi NCR Logistics Hub' 
      : 'Mumbai Central Hub';
    setTransferDest(defaultDest);
    setTransferQty(Math.min(5, item.available || 5));
    setActiveModal('transfer');
  };

  // Open Restock Modal
  const handleOpenRestock = (item) => {
    if (item) {
      setSelectedInventory(item);
      setRestockProduct(item.product);
      setRestockWarehouse(item.warehouse);
    } else {
      setSelectedInventory(null);
      setRestockProduct(uniqueProducts[0]?.productName || 'Enterprise Server Rack X1');
      setRestockWarehouse('Main Warehouse');
    }
    setRestockQty(25);
    setActiveModal('restock');
  };

  // Open New Stock Allocation Modal
  const handleOpenNewAllocation = () => {
    setNewAllocWarehouse('Main Warehouse');
    setNewAllocProduct(uniqueProducts[0]?.productName || 'Enterprise Server Rack X1');
    setNewAllocQty(30);
    setActiveModal('newAllocation');
  };

  // Submit Transfer
  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (transferQty <= 0) {
      showToast('Please enter a valid transfer quantity.');
      return;
    }
    if (transferOrigin === transferDest) {
      showToast('Origin and Destination warehouse must be different.');
      return;
    }

    const getWhId = (name) => {
      if (name.includes('East')) return 'wh-east';
      if (name.includes('West')) return 'wh-west';
      return 'wh-main';
    };

    const fromWhId = getWhId(transferOrigin);
    const toWhId = getWhId(transferDest);
    const prodId = selectedInventory?.productId || 'prod-1';

    try {
      setActionLoading(true);
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
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Restock
  const handleSubmitRestock = async (e) => {
    e.preventDefault();
    if (restockQty <= 0) {
      showToast('Please enter a valid restock quantity.');
      return;
    }

    const getWhId = (name) => {
      if ((name || '').includes('East')) return 'wh-east';
      if ((name || '').includes('West')) return 'wh-west';
      return 'wh-main';
    };

    const targetWh = selectedInventory?.warehouse || restockWarehouse;
    const targetProd = selectedInventory?.product || restockProduct;
    const whId = getWhId(targetWh);

    const foundProd = uniqueProducts.find(p => p.productName === targetProd);
    const prodId = selectedInventory?.productId || foundProd?.productId || 'prod-1';

    try {
      setActionLoading(true);
      await allocateStock({
        warehouseId: whId,
        productId: prodId,
        productName: targetProd,
        stockDelta: Number(restockQty)
      });
      showToast(`Restocked ${restockQty} units of "${targetProd}" at ${targetWh}!`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Restock failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit New Allocation
  const handleSubmitNewAllocation = async (e) => {
    e.preventDefault();
    if (newAllocQty <= 0) {
      showToast('Quantity must be greater than zero.');
      return;
    }

    const getWhId = (name) => {
      if ((name || '').includes('East')) return 'wh-east';
      if ((name || '').includes('West')) return 'wh-west';
      return 'wh-main';
    };

    const whId = getWhId(newAllocWarehouse);
    const foundProd = uniqueProducts.find(p => p.productName === newAllocProduct);
    const prodId = foundProd?.productId || 'prod-1';

    try {
      setActionLoading(true);
      await allocateStock({
        warehouseId: whId,
        productId: prodId,
        productName: newAllocProduct,
        stockDelta: Number(newAllocQty)
      });
      showToast(`Allocated ${newAllocQty} units of ${newAllocProduct} to ${newAllocWarehouse}!`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Allocation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Manage Split Modal
  const handleOpenManageSplit = (order) => {
    setSelectedOrder(order);
    const draft = (order.items || []).map(it => ({
      product: it.product,
      productId: it.productId,
      qty: it.qty,
      mainAlloc: it.mainAlloc !== undefined ? it.mainAlloc : Math.ceil(it.qty * 0.6),
      eastAlloc: it.eastAlloc !== undefined ? it.eastAlloc : Math.floor(it.qty * 0.2),
      westAlloc: it.westAlloc !== undefined ? it.westAlloc : Math.max(0, it.qty - Math.ceil(it.qty * 0.6) - Math.floor(it.qty * 0.2)),
      stocks: it.stocks || { main: 45, east: 15, west: 30 }
    }));
    setSplitDraft(draft);
    setActiveModal('manageSplit');
  };

  // Open Review Stock Modal
  const handleOpenReviewStock = (order) => {
    setSelectedOrder(order);
    const draft = (order.items || []).map(it => ({
      product: it.product,
      productId: it.productId,
      qty: it.qty,
      mainAlloc: it.mainAlloc !== undefined ? it.mainAlloc : Math.ceil(it.qty * 0.6),
      eastAlloc: it.eastAlloc !== undefined ? it.eastAlloc : Math.floor(it.qty * 0.2),
      westAlloc: it.westAlloc !== undefined ? it.westAlloc : Math.max(0, it.qty - Math.ceil(it.qty * 0.6) - Math.floor(it.qty * 0.2)),
      stocks: it.stocks || { main: 45, east: 15, west: 30 }
    }));
    setSplitDraft(draft);
    setActiveModal('reviewStock');
  };

  // Save Split changes
  const handleSaveSplit = async () => {
    try {
      setActionLoading(true);
      await overrideFulfillmentSplit(selectedOrder.code, splitDraft);
      showToast(`Warehouse split allocation saved for ${selectedOrder.code}!`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Split update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Dispatch Order Action
  const handleDispatchOrder = async (orderToDispatch, splitData) => {
    const targetOrder = orderToDispatch || selectedOrder;
    const targetSplit = splitData || splitDraft || targetOrder?.items;
    if (!targetOrder) return;

    try {
      setActionLoading(true);
      const res = await dispatchOrder(targetOrder.code, targetSplit);
      showToast(`🚀 ${res.message || `Order ${targetOrder.code} dispatched and stock deducted!`}`);
      setActiveModal(null);
      await loadFulfillmentData();
    } catch (err) {
      showToast(`Dispatch failed: ${err.message}`);
    } finally {
      setActionLoading(false);
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

            {canManageFulfillment(user) ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-dash-secondary"
                  onClick={() => handleOpenRestock(null)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                  title="Restock units directly into any warehouse"
                >
                  <Truck size={15} />
                  <span>Restock Inventory</span>
                </button>
                <button 
                  className="btn-new-allocation"
                  onClick={handleOpenNewAllocation}
                >
                  <Plus size={16} />
                  <span>New Stock Allocation</span>
                </button>
              </div>
            ) : (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: '#eff6ff', 
                color: '#1e40af', 
                border: '1px solid #bfdbfe', 
                padding: '8px 14px', 
                borderRadius: '8px', 
                fontSize: '12.5px', 
                fontWeight: 600 
              }}>
                <span>📦 Fulfillment Progress Tracking</span>
              </span>
            )}
          </div>
        </div>

        {/* SECTION 1: Warehouse Inventory Levels */}
        <div className="fulfillment-section-card">
          <div className="section-header-row">
            <div className="section-title-left">
              <span className="wh-dot purple" style={{ width: '9px', height: '9px' }}></span>
              <span className="section-title-text">Warehouse Inventory Levels</span>
              <span className="section-title-muted">3 monitored regional hubs</span>
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
                  className={`btn-filter-tab ${warehouseFilter === 'Mumbai Central Hub' ? 'active' : ''}`}
                  onClick={() => setWarehouseFilter('Mumbai Central Hub')}
                >
                  Mumbai Central Hub
                </button>
                <button 
                  className={`btn-filter-tab ${warehouseFilter === 'Bengaluru Tech Depot' ? 'active' : ''}`}
                  onClick={() => setWarehouseFilter('Bengaluru Tech Depot')}
                >
                  Bengaluru Tech Depot
                </button>
                <button 
                  className={`btn-filter-tab ${warehouseFilter === 'Delhi NCR Logistics Hub' ? 'active' : ''}`}
                  onClick={() => setWarehouseFilter('Delhi NCR Logistics Hub')}
                >
                  Delhi NCR Logistics Hub
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
                  <th>SKU</th>
                  <th>In Stock</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No inventory records found for the selected warehouse filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="warehouse-name-cell">
                          <span className={`wh-dot ${item.dotColor}`}></span>
                          <span>{item.warehouse}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.product}</td>
                      <td style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{item.sku}</td>
                      <td style={{ fontWeight: 700 }}>{item.inStock}</td>
                      <td style={{ color: '#64748b' }}>{item.reserved}</td>
                      <td style={{ 
                        fontWeight: 700, 
                        color: item.status === 'Low Stock' ? '#b45309' : item.status === 'Out of Stock' ? '#e11d48' : '#0f172a' 
                      }}>
                        {item.available}
                      </td>
                      <td>
                        <span className={`stock-status-pill ${item.status === 'Optimal' ? 'optimal' : item.status === 'Low Stock' ? 'low' : item.status === 'Out of Stock' ? 'out' : 'healthy'}`}>
                          <span className="wh-dot" style={{ 
                            width: '6px', 
                            height: '6px', 
                            backgroundColor: item.status === 'Low Stock' ? '#f59e0b' : item.status === 'Out of Stock' ? '#e11d48' : '#10b981' 
                          }}></span>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            className="btn-inventory-action"
                            style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}
                            onClick={() => handleOpenRestock(item)}
                            title="Add stock to this product"
                          >
                            + Restock
                          </button>
                          <button 
                            className="btn-inventory-action"
                            onClick={() => handleOpenTransfer(item)}
                            title="Transfer stock to another regional hub"
                          >
                            Transfer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Orders Awaiting Fulfillment */}
        <div className="fulfillment-section-card">
          <div className="section-header-row">
            <div className="section-title-left">
              <div>
                <span className="section-title-text">Orders Awaiting Fulfillment & Routing</span>
                <span className="section-title-muted" style={{ display: 'block', marginTop: '2px', fontSize: '12.5px' }}>
                  Quotations authorized for warehouse dispatch, inter-depot split routing, and customer fulfillment
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
                <button 
                  className={`btn-filter-tab ${orderFilter === 'dispatched' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('dispatched')}
                >
                  Dispatched ({ordersList.filter(o => o.status === 'Dispatched').length})
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
                        <span className={`fulfillment-status-pill ${
                          order.status === 'Dispatched' 
                            ? 'dispatched' 
                            : order.status === 'Split Pending' 
                            ? 'split-pending' 
                            : order.status === 'Backorder' 
                            ? 'backorder' 
                            : 'optimal'
                        }`}>
                          <span className="wh-dot" style={{ 
                            width: '6px', 
                            height: '6px', 
                            backgroundColor: 
                              order.status === 'Dispatched' ? '#10b981' :
                              order.status === 'Split Pending' ? '#f59e0b' : 
                              order.status === 'Backorder' ? '#e11d48' : '#3b82f6' 
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
                          {order.status === 'Dispatched' ? (
                            <button 
                              className="btn-dash-secondary"
                              style={{ height: '32px', fontSize: '12.5px', padding: '0 12px', background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0', fontWeight: 600 }}
                              onClick={() => handleOpenManageSplit(order)}
                            >
                              <Check size={14} />
                              <span>View Dispatch</span>
                            </button>
                          ) : order.status === 'Split Pending' ? (
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
                                minWidth: '180px'
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
                                    handleDispatchOrder(order);
                                  }}
                                >
                                  🚀 Direct Dispatch Order
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
                                    showToast(`Printed Packing Slip for ${order.code}`);
                                  }}
                                >
                                  Print Packing Slip
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

          {/* Table Footer */}
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

        {/* Tip Box */}
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
                Multi-Warehouse Indian Regional Router Active
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '2px' }}>
                If Mumbai Central Hub is at capacity or out of stock, route units from Bengaluru Tech Depot or Delhi NCR Logistics Hub with real-time stock deduction.
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
            Capacity: 3 Indian Regional Depots
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
                Allocate newly arrived freight or manufactured batches directly into Indian regional warehouse depots.
              </p>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Destination Warehouse</label>
                <select 
                  className="form-input"
                  value={newAllocWarehouse}
                  onChange={(e) => setNewAllocWarehouse(e.target.value)}
                >
                  <option value="Mumbai Central Hub">Mumbai Central Hub (Bhiwandi, Maharashtra)</option>
                  <option value="Bengaluru Tech Depot">Bengaluru Tech Depot (Whitefield, Karnataka)</option>
                  <option value="Delhi NCR Logistics Hub">Delhi NCR Logistics Hub (Gurugram, Haryana)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product</label>
                <select 
                  className="form-input"
                  value={newAllocProduct}
                  onChange={(e) => setNewAllocProduct(e.target.value)}
                  required
                >
                  {uniqueProducts.map(p => (
                    <option key={p.productName} value={p.productName}>
                      {p.productName} ({p.sku})
                    </option>
                  ))}
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
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Allocation'}
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
                  {['Mumbai Central Hub', 'Bengaluru Tech Depot', 'Delhi NCR Logistics Hub']
                    .filter(w => !w.toLowerCase().includes((selectedInventory.warehouse || '').toLowerCase().replace(' hub', '').replace(' depot', '')))
                    .map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Units to Transfer</label>
                <input 
                  type="number"
                  min="1"
                  max={Math.max(1, selectedInventory.available || 1)}
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
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Dispatch Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Inbound Restock */}
      {activeModal === 'restock' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedInventory ? `Restock: ${selectedInventory.product}` : 'Restock Existing Product'}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRestock}>
              {selectedInventory ? (
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedInventory.product} ({selectedInventory.sku})
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Warehouse: <strong>{selectedInventory.warehouse}</strong> (Current Stock: {selectedInventory.inStock} units, Available: {selectedInventory.available} units).
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Select Product to Restock</label>
                    <select 
                      className="form-input"
                      value={restockProduct}
                      onChange={(e) => setRestockProduct(e.target.value)}
                      required
                    >
                      {uniqueProducts.map(p => (
                        <option key={p.productName} value={p.productName}>
                          {p.productName} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Select Target Indian Warehouse</label>
                    <select 
                      className="form-input"
                      value={restockWarehouse}
                      onChange={(e) => setRestockWarehouse(e.target.value)}
                    >
                      <option value="Mumbai Central Hub">Mumbai Central Hub (Maharashtra)</option>
                      <option value="Bengaluru Tech Depot">Bengaluru Tech Depot (Karnataka)</option>
                      <option value="Delhi NCR Logistics Hub">Delhi NCR Logistics Hub (Haryana)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Units to Add into Stock</label>
                <input 
                  type="number"
                  min="1"
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
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Inbound Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Manage Split Modal */}
      {activeModal === 'manageSplit' && selectedOrder && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#714b67" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    Warehouse Split Router — {selectedOrder.code}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Customer: {selectedOrder.customer} • Priority: {selectedOrder.type} • Status: {selectedOrder.status}
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                Multi-Depot Stock Allocation per Item:
              </div>

              {splitDraft && splitDraft.map((item, idx) => {
                const totalAlloc = Number(item.mainAlloc || 0) + Number(item.eastAlloc || 0) + Number(item.westAlloc || 0);
                const diff = item.qty - totalAlloc;

                return (
                  <div key={idx} className="split-router-box" style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{item.product}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          Order Requirement: <strong>{item.qty} units</strong>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        background: diff === 0 ? '#dcfce7' : diff > 0 ? '#fef3c7' : '#fee2e2',
                        color: diff === 0 ? '#15803d' : diff > 0 ? '#b45309' : '#b91c1c'
                      }}>
                        {diff === 0 ? '✓ Fully Allocated' : diff > 0 ? `⚠️ ${diff} units unassigned` : `⚠️ Over-allocated by ${Math.abs(diff)}`}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                      {/* Mumbai Central Hub */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>Mumbai Central</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>({item.stocks?.main ?? 45} avail)</span>
                        </div>
                        <input 
                          type="number"
                          min="0"
                          max={item.qty}
                          className="split-qty-input"
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                          value={item.mainAlloc}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...splitDraft];
                            updated[idx].mainAlloc = val;
                            setSplitDraft(updated);
                          }}
                        />
                      </div>

                      {/* Bengaluru Tech Depot */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>Bengaluru Depot</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>({item.stocks?.east ?? 15} avail)</span>
                        </div>
                        <input 
                          type="number"
                          min="0"
                          max={item.qty}
                          className="split-qty-input"
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                          value={item.eastAlloc}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...splitDraft];
                            updated[idx].eastAlloc = val;
                            setSplitDraft(updated);
                          }}
                        />
                      </div>

                      {/* Delhi NCR Logistics Hub */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>Delhi NCR Hub</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>({item.stocks?.west ?? 30} avail)</span>
                        </div>
                        <input 
                          type="number"
                          min="0"
                          max={item.qty}
                          className="split-qty-input"
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                          value={item.westAlloc}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...splitDraft];
                            updated[idx].westAlloc = val;
                            setSplitDraft(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12.5px', color: '#475569' }}>
              <strong>Routing Rule:</strong> {selectedOrder.routingRule || 'Nearest Indian Regional Depot with Available Stock Priority'}
            </div>

            {canManageFulfillment(user) ? (
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
                  className="btn-dash-secondary" 
                  style={{ flex: 1, borderColor: '#714b67', color: '#714b67', fontWeight: 600 }}
                  onClick={handleSaveSplit}
                  disabled={actionLoading}
                >
                  Save Split Plan
                </button>
                <button 
                  type="button" 
                  className="btn-new-allocation"
                  style={{ flex: 1.3, justifyContent: 'center' }}
                  onClick={() => handleDispatchOrder(selectedOrder, splitDraft)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : '🚀 Authorize & Dispatch'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setActiveModal(null)}
                >
                  Close Router View
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: Review Stock for Orders & Shortages */}
      {activeModal === 'reviewStock' && selectedOrder && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#e11d48" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    Stock Availability Review — {selectedOrder.code}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Customer: {selectedOrder.customer} • Status: {selectedOrder.status}
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Order Items & Indian Regional Stock Breakdown:
              </div>

              {splitDraft && splitDraft.map((item, idx) => {
                const totalAvail = (item.stocks?.main || 0) + (item.stocks?.east || 0) + (item.stocks?.west || 0);
                const isSufficient = totalAvail >= item.qty;

                return (
                  <div key={idx} style={{ padding: '10px 0', borderBottom: idx < splitDraft.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>{item.product}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#54324c' }}>Required: {item.qty} units</span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                      <span>Mumbai: <strong style={{ color: '#0f172a' }}>{item.stocks?.main ?? 45}</strong></span>
                      <span>Bengaluru: <strong style={{ color: '#0f172a' }}>{item.stocks?.east ?? 15}</strong></span>
                      <span>Delhi NCR: <strong style={{ color: '#0f172a' }}>{item.stocks?.west ?? 30}</strong></span>
                      <span style={{ marginLeft: 'auto', fontWeight: 700, color: isSufficient ? '#15803d' : '#b45309' }}>
                        {isSufficient ? '✓ In Stock in Hubs' : '⚠️ Regional Backorder'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '13px', color: '#334155', marginBottom: '20px', lineHeight: 1.5 }}>
              <div><strong>Fulfillment Resolution:</strong></div>
              <ul style={{ paddingLeft: '20px', marginTop: '6px', color: '#64748b' }}>
                <li>Auto-balance stock allocation across Mumbai Central Hub, Bengaluru Tech Depot, and Delhi NCR Logistics Hub.</li>
                <li>Dispatch instantly with automated deduction from PostgreSQL inventory.</li>
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
                style={{ flex: 1.4, justifyContent: 'center' }}
                onClick={() => handleDispatchOrder(selectedOrder, splitDraft)}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : '⚡ Auto-Balance & Dispatch Order'}
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
                All fulfillment logs, carrier integrations, and stock allocations are encrypted in transit and at rest across all regional depots.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

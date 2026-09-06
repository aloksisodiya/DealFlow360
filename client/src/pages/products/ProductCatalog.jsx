import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tag, 
  Layers, 
  Upload, 
  Sliders, 
  Plus, 
  Search, 
  Edit3, 
  MoreVertical, 
  CheckCircle2, 
  X, 
  DollarSign, 
  Info, 
  Package, 
  ShieldCheck,
  Check
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import './ProductCatalog.css';

export default function ProductCatalog({ user, onNavigate, onLogout }) {
  // Toast Notification state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Category & Filter State
  const [activeCategory, setActiveCategory] = useState('All'); // 'All' | 'Hardware' | 'Services' | 'Subscriptions' | 'Bundles'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Price Editing State
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [inlinePriceVal, setInlinePriceVal] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Products Data loaded from live PostgreSQL database
  const [products, setProducts] = useState([]);

  // Modals state
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCat, setNewProdCat] = useState('Hardware');
  const [newProdPrice, setNewProdPrice] = useState(500);
  const [newProdUnit, setNewProdUnit] = useState('Each');
  const [newProdTax, setNewProdTax] = useState('18%');
  const [newProdVariants, setNewProdVariants] = useState('Standard');
  const [newProdStock, setNewProdStock] = useState(100);

  // Edit Product Form State
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editSku, setEditSku] = useState('');
  const [editCat, setEditCat] = useState('Hardware');
  const [editUnit, setEditUnit] = useState('Each');
  const [editTax, setEditTax] = useState('18%');

  const loadProducts = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await fetchProducts({
        category: activeCategory === 'All' ? undefined : activeCategory,
        search: searchQuery || undefined,
        tier: selectedTier === 'All' ? undefined : selectedTier
      });
      setProducts(data);
    } catch (err) {
      if (showLoading) showToast('Failed to load products from database');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(true);
    // Real-time live polling every 4s for warehouse inventory syncing
    const interval = setInterval(() => {
      loadProducts(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeCategory, searchQuery, selectedTier]);

  // Dynamic Category Counts
  const countHardware = products.filter(p => String(p.category || '').toLowerCase() === 'hardware').length;
  const countServices = products.filter(p => String(p.category || '').toLowerCase().includes('service')).length;
  const countSubscriptions = products.filter(p => String(p.category || '').toLowerCase().includes('subscript')).length;
  const countBundles = products.filter(p => String(p.category || '').toLowerCase().includes('bundle')).length;

  // Filter calculation
  const filteredProducts = products;

  const handleExportCatalog = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Price (INR)', 'Unit', 'Stock Status'];
    const rows = products.map(p => [
      p.name,
      p.sku,
      p.category,
      p.price,
      p.unit,
      p.stockStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Product catalog exported successfully!');
  };

  const startEditingPrice = (p) => {
    setEditingPriceId(p.id);
    setInlinePriceVal(String(p.price || p.basePrice || 0));
  };

  const handleSaveInlinePrice = async (p) => {
    const num = Number(inlinePriceVal);
    if (isNaN(num) || num < 0) {
      showToast('Please enter a valid positive price.');
      return;
    }
    try {
      setIsSavingPrice(true);
      await updateProduct(p.id, { price: num });
      showToast(`Updated price of "${p.name}" to ₹${num.toLocaleString('en-IN')}!`);
      setEditingPriceId(null);
      await loadProducts(false);
    } catch (err) {
      showToast(err.message || 'Failed to update price in database');
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setEditName(p.name);
    setEditPrice(p.price);
    setEditSku(p.sku);
    setEditCat(p.category || 'Hardware');
    setEditUnit(p.unit || 'Each');
    setEditTax('18%');
    setActiveModal('editProduct');
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    try {
      const numPrice = Number(editPrice);
      await updateProduct(selectedProduct.id, {
        name: editName,
        sku: editSku,
        category: editCat,
        unit: editUnit,
        price: numPrice,
      });
      showToast(`Product "${editName}" updated with price ₹${numPrice.toLocaleString('en-IN')}!`);
      setActiveModal(null);
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to update product');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdSku.trim()) {
      showToast('Please enter product name and SKU.');
      return;
    }

    try {
      const numPrice = Number(newProdPrice);
      await createProduct({
        name: newProdName,
        sku: newProdSku.toUpperCase(),
        category: newProdCat,
        price: numPrice,
        unit: newProdUnit,
        stockQty: Number(newProdStock || 100),
        variants: [newProdVariants],
      });
      showToast(`Product "${newProdName}" added with price ₹${numPrice.toLocaleString('en-IN')} and ${newProdStock || 100} units stock!`);
      setActiveModal(null);
      setNewProdName('');
      setNewProdSku('');
      setNewProdStock(100);
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to create product in database');
    }
  };

  return (
    <div className="catalog-container">
      {/* Universal Top Navigation */}
      <Navbar 
        activePage="product" 
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

      {/* Main Product Catalog Content */}
      <main className="catalog-main animate-fade-in">

        {/* Kicker and Title Row */}
        <div className="catalog-header-row">
          <div className="catalog-title-group">
            <div className="catalog-kicker-row">
              <span>CATALOG MANAGEMENT • CPQ ENGINE •</span>
              <span className="catalog-sync-dot-badge">
                <span className="wh-dot" style={{ width: '6px', height: '6px', backgroundColor: '#10b981' }}></span>
                real-time sync
              </span>
            </div>
            <h1 className="catalog-title">Product catalog</h1>
            <p className="catalog-subtitle">
              Every product, variant and price list in one place.
            </p>
          </div>

          <div className="catalog-actions-group">
            <button 
              className="btn-cat-outline"
              onClick={handleExportCatalog}
            >
              <Upload size={14} style={{ transform: 'rotate(180deg)' }} />
              <span>Export Catalog</span>
            </button>

            <button 
              className="btn-cat-outline"
              onClick={() => setActiveModal('priceFields')}
            >
              <Sliders size={14} />
              <span>Manage Price fields</span>
            </button>

            <button 
              className="btn-new-product"
              onClick={() => setActiveModal('newProduct')}
            >
              <Plus size={16} />
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="catalog-kpi-grid">
          {/* Card 1: Total Products */}
          <div className="cat-kpi-card">
            <div>
              <div className="cat-kpi-header">
                <span className="cat-kpi-title">TOTAL PRODUCTS</span>
                <div className="cat-kpi-icon plum">
                  <Box size={16} />
                </div>
              </div>
              <div className="cat-kpi-metric-row">
                <span className="cat-kpi-metric">{products.length}</span>
                <span className="cat-kpi-badge green">active</span>
              </div>
            </div>
            <div className="cat-kpi-footer-row">
              • Database catalog items
            </div>
          </div>

          {/* Card 2: Pricelists */}
          <div className="cat-kpi-card">
            <div>
              <div className="cat-kpi-header">
                <span className="cat-kpi-title">PRICELISTS</span>
                <div className="cat-kpi-icon teal">
                  <Tag size={16} />
                </div>
              </div>
              <div className="cat-kpi-metric-row">
                <span className="cat-kpi-metric">3 tiers</span>
                <span className="cat-kpi-sub-text">Standard, Enterprise, Partner</span>
              </div>
            </div>
            <div className="cat-kpi-footer-row">
              • Currencies configured: INR (₹), USD ($)
            </div>
          </div>

          {/* Card 3: Variants */}
          <div className="cat-kpi-card">
            <div>
              <div className="cat-kpi-header">
                <span className="cat-kpi-title">VARIANTS</span>
                <div className="cat-kpi-icon purple">
                  <Package size={16} />
                </div>
              </div>
              <div className="cat-kpi-metric-row">
                <span className="cat-kpi-metric">{products.length} SKUs</span>
                <span className="cat-kpi-badge purple">Configured</span>
              </div>
            </div>
            <div className="cat-kpi-footer-row">
              • Across active hardware &amp; service lines
            </div>
          </div>
        </div>

        {/* Category Segmented Tabs & Search Row */}
        <div className="catalog-filter-bar">
          <div className="catalog-category-tabs">
            <button 
              className={`btn-cat-tab ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              <span>All Products</span>
              <span className="tab-badge-num">{products.length}</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Hardware' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Hardware')}
            >
              <span>Hardware</span>
              <span className="tab-badge-num">{countHardware}</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Services' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Services')}
            >
              <span>Services</span>
              <span className="tab-badge-num">{countServices}</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Subscriptions' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Subscriptions')}
            >
              <span>Subscriptions</span>
              <span className="tab-badge-num">{countSubscriptions}</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Bundles' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Bundles')}
            >
              <span>Bundles</span>
              <span className="tab-badge-num">{countBundles}</span>
            </button>
          </div>

          <div className="catalog-search-controls-right">
            <div className="catalog-search-box">
              <Search size={14} className="catalog-search-icon" />
              <input 
                type="text" 
                className="catalog-search-input"
                placeholder="Search name, SKU, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="catalog-select-pill"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              <option value="All">Tier: All tiers</option>
              <option value="Standard">Tier: Standard</option>
              <option value="Enterprise">Tier: Enterprise</option>
              <option value="Partner">Tier: Partner</option>
            </select>

            <select 
              className="catalog-select-pill"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              <option value="INR">Currency: INR (₹)</option>
              <option value="USD">Currency: USD ($)</option>
              <option value="EUR">Currency: EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="catalog-table-card">
          <div className="catalog-table-header">
            <div>
              <strong>Products Catalog</strong> — Showing {filteredProducts.length} of {products.length} items (Click any price to change)
            </div>
            <div>
              Currency: <strong>INR (₹)</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>PRODUCT NAME</th>
                  <th>CATEGORY</th>
                  <th>VARIANTS</th>
                  <th>UNIT PRICE (₹ INR)</th>
                  <th>UNIT</th>
                  <th>WAREHOUSE STOCK</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(prod => (
                  <tr 
                    key={prod.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpenEdit(prod)}
                  >
                    {/* Product Name */}
                    <td>
                      <div className="product-cell">
                        <div className={`product-avatar ${prod.avatarColor || 'plum'}`}>
                          {prod.avatar || prod.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="product-name-bold">{prod.name}</div>
                          <div className="product-sku-text">SKU: {prod.sku}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className={`cat-pill-badge ${prod.category === 'Subscriptions' ? 'sub' : prod.category === 'Services' ? 'srv' : 'hdw'}`}>
                        {prod.category}
                      </span>
                    </td>

                    {/* Variants */}
                    <td>
                      {Array.isArray(prod.variants) && prod.variants.length > 0 && prod.variants[0] !== '—' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {prod.variants.slice(0, 2).map((v, idx) => (
                            <span key={idx} className="variant-pill">{v}</span>
                          ))}
                          {prod.variants.length > 2 && (
                            <span className="variant-pill">+{prod.variants.length - 2}</span>
                          )}
                        </div>
                      ) : prod.variants && prod.variants !== '—' ? (
                        <span className="variant-pill">{prod.variants}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>

                    {/* Price with Inline Edit Mode */}
                    <td onClick={(e) => e.stopPropagation()}>
                      {editingPriceId === prod.id ? (
                        <div className="price-inline-edit-box">
                          <span className="currency-prefix">₹</span>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            className="price-inline-input"
                            value={inlinePriceVal}
                            onChange={(e) => setInlinePriceVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlinePrice(prod);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            autoFocus
                          />
                          <button 
                            type="button"
                            className="btn-price-inline-save"
                            title="Save Price"
                            disabled={isSavingPrice}
                            onClick={() => handleSaveInlinePrice(prod)}
                          >
                            <Check size={13} />
                          </button>
                          <button 
                            type="button"
                            className="btn-price-inline-cancel"
                            title="Cancel"
                            onClick={() => setEditingPriceId(null)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="price-display-wrap"
                          title="Click to edit price directly"
                          onClick={() => startEditingPrice(prod)}
                        >
                          <span className="price-bold-text">
                            {prod.priceFormatted || `₹${Number(prod.price || 0).toLocaleString('en-IN')}`}
                          </span>
                          <button 
                            type="button" 
                            className="btn-edit-price-pill"
                            title="Edit price"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingPrice(prod);
                            }}
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td>
                      {prod.unit === 'Recurring' || prod.category === 'Subscriptions' ? (
                        <strong style={{ color: '#714b67', fontSize: '12px' }}>{prod.unit || 'per unit'}</strong>
                      ) : (
                        <span>{prod.unit}</span>
                      )}
                    </td>

                    {/* Live Warehouse Inventory */}
                    <td>
                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          color: (prod.stockQty || 0) <= 0 ? '#ef4444' : (prod.stockQty || 0) < 20 ? '#d97706' : '#16a34a'
                        }}>
                          <span>●</span>
                          <span>{prod.stockQty ?? 0} units</span>
                        </span>
                        {prod.warehouseBreakdown?.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {prod.warehouseBreakdown.map(wb => `${wb.warehouseName.split(' ')[0]}: ${wb.stockQty}`).join(' · ')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`cat-status-pill ${(prod.stockQty || 0) <= 0 ? 'inactive' : (prod.stockQty || 0) < 20 ? 'warning' : 'active'}`}>
                        <span className="cat-status-dot"></span>
                        <span>{prod.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button 
                          className="btn-quick-price-action"
                          title="Edit Price & Specs"
                          onClick={() => handleOpenEdit(prod)}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <div style={{ position: 'relative' }}>
                          <button 
                            className="cat-action-btn"
                            onClick={() => setOpenActionMenuId(openActionMenuId === prod.id ? null : prod.id)}
                          >
                            <MoreVertical size={15} />
                          </button>

                          {openActionMenuId === prod.id && (
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
                              minWidth: '160px'
                            }}>
                              <button 
                                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  startEditingPrice(prod);
                                }}
                              >
                                Edit Price Inline
                              </button>
                              <button 
                                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleOpenEdit(prod);
                                }}
                              >
                                Edit Full Specs & Price
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="catalog-pagination-row">
            <div>
              Showing <strong>{filteredProducts.length > 0 ? 1 : 0}</strong> to <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
            </div>

            <div className="cat-pagination-btns">
              <button className="btn-page-step" disabled>Previous</button>
              <button className={`btn-page-num ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
              <button className="btn-page-step" disabled>Next</button>
            </div>
          </div>
        </div>

        {/* Informational Callout Tip */}
        <div className="catalog-tip-card">
          <div className="catalog-tip-left">
            <div className="catalog-tip-icon">₹</div>
            <div className="catalog-tip-text">
              <strong>Price Management Tip:</strong> Click the <strong>Edit</strong> button on any price cell to change unit prices inline, or click a product row to manage pricing tiers &amp; CPQ matrix in real-time.
            </div>
          </div>

          <div className="catalog-tip-badge">
            INR (₹) Base Currency Sync
          </div>
        </div>

      </main>

      {/* Universal Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="pulse-dot"></span>
            <span>All Systems Operational</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            <span>DealFlow360 v4.12 Enterprise</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
            <span>© 2026 DealFlow360 Technologies, Inc. All rights reserved.</span>
          </div>

          <div className="footer-links">
            <button 
              className="footer-link"
              onClick={() => showToast('Terms of Service')}
            >
              Terms of Service
            </button>
            <button 
              className="footer-link"
              onClick={() => showToast('Privacy Policy')}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL 1: New Product */}
      {activeModal === 'newProduct' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Create New Product SKU
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product Name *</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. 4K UltraWide Monitor 34"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">SKU Identifier *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. HW-MON-34UW"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input"
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Services">Services</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Bundles">Bundles</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Base Price (₹ INR) *</label>
                  <input 
                    type="number"
                    min="1"
                    className="form-input"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input 
                    type="number"
                    min="0"
                    className="form-input"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select 
                    className="form-input"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                  >
                    <option value="Each">Each</option>
                    <option value="per unit">per unit</option>
                    <option value="per month">per month</option>
                    <option value="per year">per year</option>
                    <option value="flat fee">flat fee</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate</label>
                  <select 
                    className="form-input"
                    value={newProdTax}
                    onChange={(e) => setNewProdTax(e.target.value)}
                  >
                    <option value="18%">18% (GST)</option>
                    <option value="12%">12% (GST)</option>
                    <option value="5%">5% (GST)</option>
                    <option value="0%">0% Exempt</option>
                  </select>
                </div>
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
                  className="btn-new-product"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manage Price Fields */}
      {activeModal === 'priceFields' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Manage Pricelists &amp; Currency Tiers
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ margin: '14px 0 20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Standard List Price (Default)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Base CPQ price matrix in INR (₹) across regional hubs</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Enterprise Volume Tier (15% Wholesale Floor)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Auto-applied for enterprise bulk deals</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Gold &amp; Silver Tiers</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Automatic 5% and 10% loyalty margins calculated on base price</div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-dash-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setActiveModal(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Product Specs & Price */}
      {activeModal === 'editProduct' && selectedProduct && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Edit Product &amp; Price — {selectedProduct.sku}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product Name *</label>
                <input 
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input"
                    value={editCat}
                    onChange={(e) => setEditCat(e.target.value)}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Services">Services</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Bundles">Bundles</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#714b67' }}>
                    Unit Price (₹ INR) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#714b67', fontSize: '14px' }}>₹</span>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      className="form-input"
                      style={{ paddingLeft: '26px', fontWeight: 700, fontSize: '15px' }}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select 
                    className="form-input"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                  >
                    <option value="Each">Each</option>
                    <option value="per unit">per unit</option>
                    <option value="per month">per month</option>
                    <option value="per year">per year</option>
                    <option value="flat fee">flat fee</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tax Rate</label>
                  <select 
                    className="form-input"
                    value={editTax}
                    onChange={(e) => setEditTax(e.target.value)}
                  >
                    <option value="18%">18% (GST)</option>
                    <option value="12%">12% (GST)</option>
                    <option value="5%">5% (GST)</option>
                    <option value="0%">0% Exempt</option>
                  </select>
                </div>
              </div>

              {/* Real-time Tier Pricing Matrix Preview */}
              <div style={{
                background: '#faf5f8',
                border: '1px solid #dfc2d6',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#714b67', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Auto-Calculated CPQ Tier Pricing:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Standard</div>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>₹{Number(editPrice || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Silver (-5%)</div>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>₹{Math.round(Number(editPrice || 0) * 0.95).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Gold (-10%)</div>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>₹{Math.round(Number(editPrice || 0) * 0.90).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Enterprise (-15%)</div>
                    <strong style={{ fontSize: '12.5px', color: '#059669' }}>₹{Math.round(Number(editPrice || 0) * 0.85).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
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
                  className="btn-new-product"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save &amp; Update Price in DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

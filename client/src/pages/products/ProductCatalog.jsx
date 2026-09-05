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
  const [activeCategory, setActiveCategory] = useState('All'); // 'All' | 'Hardware' | 'Services' | 'Subscription' | 'Bundles'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Products Data loaded from live PostgreSQL database
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProducts({
        category: activeCategory === 'All' ? undefined : activeCategory,
        search: searchQuery || undefined,
        tier: selectedTier === 'All' ? undefined : selectedTier
      });
      setProducts(data);
    } catch (err) {
      showToast('Failed to load products from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeCategory, searchQuery, selectedTier]);

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
  const [newProdTax, setNewProdTax] = useState('15%');
  const [newProdVariants, setNewProdVariants] = useState('Standard');

  // Edit Product Form State
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editTax, setEditTax] = useState('15%');

  // Filter calculation
  const filteredProducts = products;

  const handleExportCatalog = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Price', 'Unit', 'Stock Status'];
    const rows = products.map(p => [
      p.name,
      p.sku,
      p.category,
      p.priceFormatted,
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

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setEditName(p.name);
    setEditPrice(p.price);
    setEditTax('15%');
    setActiveModal('editProduct');
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(selectedProduct.id, {
        name: editName,
        price: Number(editPrice),
      });
      showToast(`Product ${editName} updated successfully in database!`);
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
      await createProduct({
        name: newProdName,
        sku: newProdSku.toUpperCase(),
        category: newProdCat,
        price: Number(newProdPrice),
        unit: newProdUnit,
        variants: [newProdVariants],
      });
      showToast(`Product "${newProdName}" added to database catalog!`);
      setActiveModal(null);
      setNewProdName('');
      setNewProdSku('');
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
                <span className="cat-kpi-metric">128</span>
                <span className="cat-kpi-badge green">active</span>
              </div>
            </div>
            <div className="cat-kpi-footer-row">
              • 6 archived products in repository
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
              • 2 Currencies configured: USD ($), EUR (€)
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
                <span className="cat-kpi-metric">340 SKUs</span>
                <span className="cat-kpi-badge purple">Configured</span>
              </div>
            </div>
            <div className="cat-kpi-footer-row">
              • Across all active hardware &amp; service lines
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
              <span className="tab-badge-num">128</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Hardware' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Hardware')}
            >
              <span>Hardware</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Services' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Services')}
            >
              <span>Services</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Subscriptions' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Subscriptions')}
            >
              <span>Subscriptions</span>
            </button>

            <button 
              className={`btn-cat-tab ${activeCategory === 'Bundles' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Bundles')}
            >
              <span>Bundles</span>
            </button>
          </div>

          <div className="catalog-search-controls-right">
            <div className="catalog-search-box">
              <Search size={14} className="catalog-search-icon" />
              <input 
                type="text" 
                className="catalog-search-input"
                placeholder="Filter rows..."
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
              <option value="USD">Currency: USD ($)</option>
              <option value="EUR">Currency: EUR (€)</option>
              <option value="GBP">Currency: GBP (£)</option>
            </select>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="catalog-table-card">
          <div className="catalog-table-header">
            <div>
              <strong>Products</strong> Showing 4 of 128 items
            </div>
            <div>
              Sorted by: <strong>Default Hierarchy</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>PRODUCT NAME</th>
                  <th>CATEGORY</th>
                  <th>VARIANTS</th>
                  <th>PRICE</th>
                  <th>UNIT</th>
                  <th>TAX</th>
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
                        <div className={`product-avatar ${prod.avatarColor}`}>
                          {prod.avatar}
                        </div>
                        <div>
                          <div className="product-name-bold">{prod.name}</div>
                          <div className="product-sku-text">SKU: {prod.sku}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ color: '#475569', fontWeight: 500 }}>
                      {prod.category}
                    </td>

                    {/* Variants */}
                    <td>
                      {prod.variants !== '—' ? (
                        <span className="variant-pill">{prod.variants}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {prod.priceFormatted}
                    </td>

                    {/* Unit */}
                    <td>
                      {prod.unit === 'Recurring' ? (
                        <strong style={{ color: '#7e22ce' }}>Recurring</strong>
                      ) : (
                        <span>{prod.unit}</span>
                      )}
                    </td>

                    {/* Tax */}
                    <td style={{ color: '#64748b' }}>
                      {prod.tax}
                    </td>

                    {/* Status */}
                    <td>
                      <span className="cat-status-pill">
                        <span className="cat-status-dot"></span>
                        <span>{prod.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button 
                          className="cat-action-btn"
                          title="Edit Product"
                          onClick={() => handleOpenEdit(prod)}
                        >
                          <Edit3 size={15} />
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
                                  showToast(`Cloned price spec for ${prod.name}`);
                                }}
                              >
                                Duplicate SKU
                              </button>
                              <button 
                                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12.5px', color: '#e11d48', cursor: 'pointer' }}
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  showToast(`Archived ${prod.sku}`);
                                }}
                              >
                                Archive Product
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
              Showing <strong>1</strong> to <strong>4</strong> of <strong>128</strong> products
            </div>

            <div className="cat-pagination-btns">
              <button className="btn-page-step" disabled>Previous</button>
              <button className={`btn-page-num ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
              <button className={`btn-page-num ${currentPage === 2 ? 'active' : ''}`} onClick={() => setCurrentPage(2)}>2</button>
              <button className={`btn-page-num ${currentPage === 3 ? 'active' : ''}`} onClick={() => setCurrentPage(3)}>3</button>
              <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
              <button className="btn-page-num" onClick={() => setCurrentPage(32)}>32</button>
              <button className="btn-page-step" onClick={() => setCurrentPage(2)}>Next</button>
            </div>
          </div>
        </div>

        {/* Informational Callout Tip */}
        <div className="catalog-tip-card">
          <div className="catalog-tip-left">
            <div className="catalog-tip-icon">i</div>
            <div className="catalog-tip-text">
              Click a product row to open general info, variants and tier/currency price lists.
            </div>
          </div>

          <div className="catalog-tip-badge">
            Shortcut: Enter ↵ or Space to Expand
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
            <span>© 2025 DealFlow360 Technologies, Inc. All rights reserved.</span>
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
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('audit'); setActiveModal('footerModal'); }}
            >
              Audit Logs
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
                <label className="form-label">Product Name</label>
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
                  <label className="form-label">SKU Identifier</label>
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
                    <option value="Subscription">Subscription</option>
                    <option value="Bundles">Bundles</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Base Price ($)</label>
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
                  <label className="form-label">Unit</label>
                  <select 
                    className="form-input"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                  >
                    <option value="Each">Each</option>
                    <option value="Recurring">Recurring</option>
                    <option value="Hour">Hour</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate</label>
                  <select 
                    className="form-input"
                    value={newProdTax}
                    onChange={(e) => setNewProdTax(e.target.value)}
                  >
                    <option value="15%">15%</option>
                    <option value="18%">18%</option>
                    <option value="0% (Exempt)">0% (Exempt)</option>
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
                <div style={{ fontSize: '12px', color: '#64748b' }}>Base CPQ price matrix across USD ($) and EUR (€)</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Enterprise Volume Tier (10% Floor)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Auto-applied for quotes exceeding $100k contract value</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Partner Reseller Tier (15% Wholesale)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Wholesale discounting matrix for certified channel partners</div>
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

      {/* MODAL 3: Edit Product Specs */}
      {activeModal === 'editProduct' && selectedProduct && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Edit Product Specs — {selectedProduct.sku}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product Name</label>
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
                  <label className="form-label">List Price ($ USD)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate</label>
                  <select 
                    className="form-input"
                    value={editTax}
                    onChange={(e) => setEditTax(e.target.value)}
                  >
                    <option value="15%">15% Standard</option>
                    <option value="18%">18% High</option>
                    <option value="0%">0% Exempt</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '12.5px', color: '#475569' }}>
                <div><strong>Category:</strong> {selectedProduct.category}</div>
                <div style={{ marginTop: '4px' }}><strong>Variants Configured:</strong> {selectedProduct.variants}</div>
                <div style={{ marginTop: '4px' }}><strong>Stock Availability:</strong> {selectedProduct.stockAvailable} units in warehouse hub</div>
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
                  Save Changes
                </button>
              </div>
            </form>
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
                {footerModalType === 'audit' && 'System Audit Logs'}
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.65 }}>
              <p style={{ marginBottom: '12px' }}>
                DealFlow360 guarantees enterprise-grade CPQ product catalog synchronization, dynamic currency valuation, and automated multi-tier discounting.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

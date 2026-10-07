// ==========================================
// INVENTORY & COSTING ENGINE
// ==========================================

// Initial inventory data (may kasamang auto-saved data sa LocalStorage)
let defaultProducts = [
  { id: 1, name: "Coca-cola 1.5", category: "Beverages", unitCost: 28.00, sellingPrice: 45.00, qty: 24, img: "🥤" },
  { id: 2, name: "Piattos (Sour cream)", category: "Snacks", unitCost: 12.00, sellingPrice: 20.00, qty: 18, img: "🍿" },
  { id: 3, name: "Pancit canton", category: "Instant noodles", unitCost: 8.50, sellingPrice: 15.00, qty: 22, img: "🍜" },
  { id: 4, name: "Skyflakes crackers", category: "Biscuits", unitCost: 6.00, sellingPrice: 10.00, qty: 40, img: "🍪" },
  { id: 5, name: "Milo (Sachet)", category: "Beverages", unitCost: 6.50, sellingPrice: 10.00, qty: 15, img: "🥤" },
  { id: 6, name: "Century tuna (180g)", category: "Canned goods", unitCost: 20.00, sellingPrice: 32.00, qty: 8, img: "🥫" },
  { id: 7, name: "Bearbrand (Choco)", category: "Beverages", unitCost: 10.00, sellingPrice: 18.00, qty: 5, img: "🥤" },
  { id: 8, name: "Mang tomas", category: "Condiments", unitCost: 15.00, sellingPrice: 25.00, qty: 12, img: "🍾" },
  { id: 9, name: "Jufran Banana Ketchup", category: "Condiments", unitCost: 22.00, sellingPrice: 35.00, qty: 6, img: "🍾" },
  { id: 10, name: "Purefoods Hatdog (5kg)", category: "Frozen foods", unitCost: 120.00, sellingPrice: 180.00, qty: 0, img: "🌭" },
  { id: 11, name: "Condom (Trust)", category: "Essential", unitCost: 50.00, sellingPrice: 60.00, qty: 10, img: "📦" },
  { id: 12, name: "Pineapple juice", category: "Essential", unitCost: 18.00, sellingPrice: 25.00, qty: 12, img: "🧃" }
];

// Load saved inventory or use default
let products = JSON.parse(localStorage.getItem('tindahan_inventory')) || defaultProducts;
let selectedProductId = products[0] ? products[0].id : null;

// Helper: Format PHP currency
function formatPHP(amount) {
  return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Compute Status Badge
function getStockStatus(qty) {
  if (qty <= 0) return { label: 'Out of stock', class: 'out-stock' };
  if (qty <= 10) return { label: 'Low stock', class: 'low-stock' };
  return { label: 'In stock', class: 'in-stock' };
}

// Save Data to LocalStorage
function saveProducts() {
  localStorage.setItem('tindahan_inventory', JSON.stringify(products));
}

// ==========================================
// RENDER & UPDATE FUNCTIONS
// ==========================================

function updateHeaderCards() {
  let totalItems = products.length;
  let totalStockValue = 0;
  let totalPotentialProfit = 0;
  let lowStockCount = 0;

  products.forEach(p => {
    let totalCost = p.unitCost * p.qty;
    let potentialProfit = (p.sellingPrice - p.unitCost) * p.qty;
    
    totalStockValue += totalCost;
    totalPotentialProfit += potentialProfit;

    if (p.qty <= 10) {
      lowStockCount++;
    }
  });

  document.getElementById('card-total-items').textContent = totalItems;
  document.getElementById('card-total-value').textContent = formatPHP(totalStockValue);
  document.getElementById('card-potential-profit').textContent = formatPHP(totalPotentialProfit);
  document.getElementById('card-low-stock').textContent = lowStockCount;
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventory-table-body');
  const searchVal = document.getElementById('inv-search').value.toLowerCase();
  const categoryFilter = document.getElementById('filter-category').value;
  const statusFilter = document.getElementById('filter-status').value;

  tbody.innerHTML = '';

  let filtered = products.filter(p => {
    let matchesSearch = p.name.toLowerCase().includes(searchVal);
    let matchesCategory = (categoryFilter === 'All') || (p.category === categoryFilter);
    
    let status = getStockStatus(p.qty).label;
    let matchesStatus = (statusFilter === 'All') || (status === statusFilter);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">Walang nakitang produkto.</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    // TAMANG KALKULASYON: Unit Cost x Stock Qty
    let realTotalCost = p.unitCost * p.qty; 
    let status = getStockStatus(p.qty);

    let tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    if (p.id === selectedProductId) {
      tr.style.backgroundColor = '#e6f2e8';
    }

    tr.innerHTML = `
      <td><strong>${p.img || '📦'} ${p.name}</strong></td>
      <td>${p.category}</td>
      <td>${formatPHP(p.unitCost)}</td>
      <td>${formatPHP(p.sellingPrice)}</td>
      <td><strong>${p.qty}</strong></td>
      <td><strong>${formatPHP(realTotalCost)}</strong></td>
      <td><span class="badge ${status.class}">${status.label}</span></td>
      <td>
        <button onclick="deleteProduct(${p.id}, event)" style="background:none; border:none; color:red; cursor:pointer;" title="Delete">🗑️</button>
      </td>
    `;

    // Click row to select product & update Costing Side Panel
    tr.addEventListener('click', (e) => {
      selectedProductId = p.id;
      renderInventoryTable();
      renderSideCostingPanel(p);
    });

    tbody.appendChild(tr);
  });

  updateHeaderCards();
}

function renderSideCostingPanel(p) {
  if (!p) {
    p = products[0];
    if (!p) return;
  }

  let shippingCost = 2.00; // Fixed estimate per unit
  let otherCost = 1.00;    // Fixed estimate per unit
  let totalUnitCost = p.unitCost + shippingCost + otherCost;
  let estimatedProfit = p.sellingPrice - totalUnitCost;
  
  let margin = 0;
  if (p.sellingPrice > 0) {
    margin = ((estimatedProfit / p.sellingPrice) * 100).toFixed(1);
  }

  document.getElementById('side-img').textContent = p.img || '📦';
  document.getElementById('side-name').textContent = p.name;
  document.getElementById('side-category').textContent = p.category;
  document.getElementById('side-unit-cost').textContent = formatPHP(p.unitCost);
  document.getElementById('side-shipping').textContent = formatPHP(shippingCost);
  document.getElementById('side-other-cost').textContent = formatPHP(otherCost);
  document.getElementById('side-total-unit-cost').textContent = formatPHP(totalUnitCost);
  document.getElementById('side-selling-price').textContent = formatPHP(p.sellingPrice);
  
  let profitEl = document.getElementById('side-profit');
  profitEl.textContent = formatPHP(estimatedProfit);
  profitEl.style.color = estimatedProfit >= 0 ? '#0d5c50' : 'red';

  let marginEl = document.getElementById('side-margin');
  marginEl.textContent = `${margin}%`;
  marginEl.style.color = margin >= 0 ? '#0d5c50' : 'red';
}

// ==========================================
// ACTIONS & EVENTS
// ==========================================

function deleteProduct(id, event) {
  event.stopPropagation(); // Iwasan ang row click
  if (confirm("Sigurado ka bang gusto mong burahin ang produktong ito?")) {
    products = products.filter(p => p.id !== id);
    if (selectedProductId === id) {
      selectedProductId = products.length > 0 ? products[0].id : null;
    }
    saveProducts();
    renderInventoryTable();
    if (selectedProductId) {
      renderSideCostingPanel(products.find(p => p.id === selectedProductId));
    }
  }
}

// Event Listeners para sa Search at Filters
document.getElementById('inv-search').addEventListener('input', renderInventoryTable);
document.getElementById('filter-category').addEventListener('change', renderInventoryTable);
document.getElementById('filter-status').addEventListener('change', renderInventoryTable);

// Modal Controls
const modal = document.getElementById('product-modal');
document.getElementById('open-add-modal-btn').addEventListener('click', () => modal.showModal());
document.getElementById('close-modal-btn').addEventListener('click', () => modal.close());

// Add New Product Form Submit
document.getElementById('add-product-form').addEventListener('submit', function(e) {
  e.preventDefault();

  let name = document.getElementById('p-name').value;
  let category = document.getElementById('p-category').value;
  let unitCost = parseFloat(document.getElementById('p-cost').value);
  let sellingPrice = parseFloat(document.getElementById('p-price').value);
  let qty = parseInt(document.getElementById('p-qty').value);

  let newProduct = {
    id: Date.now(),
    name: name,
    category: category,
    unitCost: unitCost,
    sellingPrice: sellingPrice,
    qty: qty,
    img: '📦'
  };

  products.push(newProduct);
  saveProducts();

  selectedProductId = newProduct.id;
  renderInventoryTable();
  renderSideCostingPanel(newProduct);

  this.reset();
  modal.close();
});

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  renderInventoryTable();
  if (products.length > 0) {
    renderSideCostingPanel(products[0]);
  }
});
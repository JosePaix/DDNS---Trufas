// Estado Global da Aplicação
let truffles = JSON.parse(localStorage.getItem('dosn_truffles')) || [];
let ingredients = JSON.parse(localStorage.getItem('dosn_ingredients')) || [];
let sales = JSON.parse(localStorage.getItem('dosn_sales')) || [];

// Constantes de Preço
const COST_PRICE = 2.14;
const NORMAL_PRICE = 5.00;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Definir data padrão de hoje nos inputs de data
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('truffle-prod-date')) {
        document.getElementById('truffle-prod-date').value = today;
        calculateTruffleExpiry();
    }
    if(document.getElementById('ing-expiry')) {
        document.getElementById('ing-expiry').value = today;
    }

    renderAll();
    addSaleRow(); // Linha inicial de venda
});

// Navegação entre Abas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// ==================== CADASTRO DE INGREDIENTES ====================
function handleIngredientSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('ing-name').value;
    const weight = document.getElementById('ing-weight').value;
    const expiry = document.getElementById('ing-expiry').value;

    ingredients.push({ id: Date.now(), name, weight, expiry });
    saveData();
    renderIngredients();
    document.getElementById('ingredient-form').reset();
    document.getElementById('ing-expiry').value = new Date().toISOString().split('T')[0];
}

function deleteIngredient(id) {
    ingredients = ingredients.filter(i => i.id !== id);
    saveData();
    renderIngredients();
}

function renderIngredients() {
    const tbody = document.querySelector('#ingredients-table tbody');
    tbody.innerHTML = '';
    if(ingredients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Nenhum ingrediente cadastrado.</td></tr>';
        return;
    }
    ingredients.forEach(ing => {
        tbody.innerHTML += `
            <tr>
                <td>${ing.name}</td>
                <td>${ing.weight}</td>
                <td>${formatDate(ing.expiry)}</td>
                <td><button class="btn-icon" onclick="deleteIngredient(${ing.id})"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
}

// ==================== CADASTRO DE TRUFAS ====================
function calculateTruffleExpiry() {
    const prodDateStr = document.getElementById('truffle-prod-date').value;
    if(!prodDateStr) return;
    const prodDate = new Date(prodDateStr);
    prodDate.setDate(prodDate.getDate() + 10);
    document.getElementById('truffle-expiry-date').value = prodDate.toISOString().split('T')[0];
}

function handleTruffleSubmit(e) {
    e.preventDefault();
    const flavor = document.getElementById('truffle-flavor').value;
    const prodDate = document.getElementById('truffle-prod-date').value;
    const expiryDate = document.getElementById('truffle-expiry-date').value;
    const qty = parseInt(document.getElementById('truffle-qty').value);

    truffles.push({ id: Date.now(), flavor, prodDate, expiryDate, qty });
    saveData();
    renderTruffles();
    updateFlavorSelects();
    document.getElementById('truffle-form').reset();
    document.getElementById('truffle-prod-date').value = new Date().toISOString().split('T')[0];
    calculateTruffleExpiry();
}

function deleteTruffle(id) {
    truffles = truffles.filter(t => t.id !== id);
    saveData();
    renderTruffles();
    updateFlavorSelects();
}

function renderTruffles() {
    const tbody = document.querySelector('#truffles-table tbody');
    tbody.innerHTML = '';
    if(truffles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Nenhuma trufa cadastrada.</td></tr>';
        return;
    }
    truffles.forEach(t => {
        tbody.innerHTML += `
            <tr>
                <td>${t.flavor}</td>
                <td>${formatDate(t.prodDate)}</td>
                <td>${formatDate(t.expiryDate)}</td>
                <td>${t.qty}</td>
                <td><button class="btn-icon" onclick="deleteTruffle(${t.id})"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
}

function updateFlavorSelects() {
    const selects = document.querySelectorAll('.sale-flavor');
    const flavors = [...new Set(truffles.map(t => t.flavor))];
    
    selects.forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">Selecione o sabor</option>';
        flavors.forEach(f => {
            sel.innerHTML += `<option value="${f}">${f}</option>`;
        });
        sel.value = currentVal;
    });
}

// ==================== VENDAS ====================
function addSaleRow() {
    const container = document.getElementById('sale-items-container');
    const flavors = [...new Set(truffles.map(t => t.flavor))];
    let optionsHtml = '<option value="">Selecione o sabor</option>';
    flavors.forEach(f => {
        optionsHtml += `<option value="${f}">${f}</option>`;
    });

    const div = document.createElement('div');
    div.className = 'sale-item-row';
    div.innerHTML = `
        <div class="form-group">
            <label>Sabor da Trufa</label>
            <select class="sale-flavor" required onchange="calculateSaleTotal()">
                ${optionsHtml}
            </select>
        </div>
        <div class="form-group">
            <label>Quantidade</label>
            <input type="number" class="sale-qty" min="1" value="1" required onchange="calculateSaleTotal()">
        </div>
        <button type="button" class="btn-icon" onclick="removeSaleRow(this)"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(div);
    calculateSaleTotal();
}

function removeSaleRow(btn) {
    const rows = document.querySelectorAll('.sale-item-row');
    if(rows.length > 1) {
        btn.closest('.sale-item-row').remove();
        calculateSaleTotal();
    } else {
        alert('A venda precisa ter pelo menos um item.');
    }
}

function togglePromoSection() {
    const isPromo = document.getElementById('is-promo').checked;
    const promoSection = document.getElementById('promo-section');
    if(isPromo) {
        promoSection.classList.remove('hidden');
    } else {
        promoSection.classList.add('hidden');
        document.getElementById('promo-total-price').value = '';
    }
    calculateSaleTotal();
}

function calculateSaleTotal() {
    let totalQty = 0;
    const rows = document.querySelectorAll('.sale-item-row');
    rows.forEach(row => {
        const qtyInput = row.querySelector('.sale-qty');
        totalQty += parseInt(qtyInput.value) || 0;
    });

    const totalCost = totalQty * COST_PRICE;
    const isPromo = document.getElementById('is-promo').checked;
    
    let saleTotal = 0;
    if(isPromo) {
        const promoPriceInput = parseFloat(document.getElementById('promo-total-price').value);
        saleTotal = isNaN(promoPriceInput) ? 0 : promoPriceInput;
    } else {
        saleTotal = totalQty * NORMAL_PRICE;
    }

    const profit = saleTotal - totalCost;

    document.getElementById('summary-cost').innerText = formatMoney(totalCost);
    document.getElementById('summary-total').innerText = formatMoney(saleTotal);
    document.getElementById('summary-profit').innerText = formatMoney(profit);
}

function handleSaleSubmit(e) {
    e.preventDefault();
    const rows = document.querySelectorAll('.sale-item-row');
    const items = [];
    let totalQty = 0;

    for(let row of rows) {
        const flavor = row.querySelector('.sale-flavor').value;
        const qty = parseInt(row.querySelector('.sale-qty').value);
        if(!flavor) {
            alert('Por favor, selecione o sabor de todas as trufas.');
            return;
        }
        items.push({ flavor, qty });
        totalQty += qty;
    }

    const isPromo = document.getElementById('is-promo').checked;
    const totalCost = totalQty * COST_PRICE;
    let saleTotal = 0;

    if(isPromo) {
        saleTotal = parseFloat(document.getElementById('promo-total-price').value);
        if(isNaN(saleTotal) || saleTotal < 0) {
            alert('Por favor, insira um valor válido para a promoção.');
            return;
        }
    } else {
        saleTotal = totalQty * NORMAL_PRICE;
    }

    const profit = saleTotal - totalCost;

    // Abater do estoque de trufas se houver lotes disponíveis
    for(let item of items) {
        let remainingToDeduct = item.qty;
        for(let t of truffles) {
            if(t.flavor === item.flavor && t.qty > 0) {
                if(t.qty >= remainingToDeduct) {
                    t.qty -= remainingToDeduct;
                    remainingToDeduct = 0;
                } else {
                    remainingToDeduct -= t.qty;
                    t.qty = 0;
                }
            }
            if(remainingToDeduct === 0) break;
        }
    }

    sales.push({
        id: Date.now(),
        date: new Date().toISOString(),
        items,
        totalQty,
        isPromo,
        totalCost,
        saleTotal,
        profit
    });

    saveData();
    renderAll();
    document.getElementById('sale-form').reset();
    document.getElementById('promo-section').classList.add('hidden');
    document.getElementById('sale-items-container').innerHTML = '';
    addSaleRow();
    alert('Venda registrada com sucesso!');
}

function deleteSale(id) {
    if(confirm('Tem certeza que deseja excluir esta venda?')) {
        sales = sales.filter(s => s.id !== id);
        saveData();
        renderAll();
    }
}

// ==================== RELATÓRIOS E RENDERIZAÇÃO ====================
function renderAll() {
    renderIngredients();
    renderTruffles();
    updateFlavorSelects();
    renderSalesTables();
    calculateReports();
}

function renderSalesTables() {
    const recentTbody = document.querySelector('#recent-sales-table tbody');
    const fullTbody = document.querySelector('#full-sales-table tbody');
    
    recentTbody.innerHTML = '';
    fullTbody.innerHTML = '';

    if(sales.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma venda registrada.</td></tr>';
        fullTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma venda registrada.</td></tr>';
        return;
    }

    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedSales.forEach((s, index) => {
        const itemsStr = s.items.map(i => `${i.qty}x ${i.flavor}`).join(', ');
        const typeStr = s.isPromo ? '<span style="color: #b25b5b; font-weight:600;">Promoção</span>' : 'Normal';
        
        if(index < 5) {
            recentTbody.innerHTML += `
                <tr>
                    <td>${formatDateTime(s.date)}</td>
                    <td>${itemsStr}</td>
                    <td>${s.totalQty}</td>
                    <td>${typeStr}</td>
                    <td>${formatMoney(s.saleTotal)}</td>
                    <td style="color: var(--success); font-weight:600;">${formatMoney(s.profit)}</td>
                    <td><button class="btn-icon" onclick="deleteSale(${s.id})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        }

        fullTbody.innerHTML += `
            <tr>
                <td>${formatDateTime(s.date)}</td>
                <td>${itemsStr}</td>
                <td>${s.totalQty}</td>
                <td>${s.isPromo ? 'Promoção' : 'Normal'}</td>
                <td>${formatMoney(s.totalCost)}</td>
                <td>${formatMoney(s.saleTotal)}</td>
                <td style="color: var(--success); font-weight:600;">${formatMoney(s.profit)}</td>
            </tr>
        `;
    });
}

function calculateReports() {
    const now = new Date();
    
    let dayTotal = 0, dayProfit = 0;
    let weekTotal = 0, weekProfit = 0;
    let monthTotal = 0, monthProfit = 0;

    const startOfWeek = new Date(now);
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    sales.forEach(s => {
        const saleDate = new Date(s.date);
        
        if(saleDate.toDateString() === now.toDateString()) {
            dayTotal += s.saleTotal;
            dayProfit += s.profit;
        }

        if(saleDate >= startOfWeek) {
            weekTotal += s.saleTotal;
            weekProfit += s.profit;
        }

        if(saleDate >= startOfMonth) {
            monthTotal += s.saleTotal;
            monthProfit += s.profit;
        }
    });

    document.getElementById('rep-day-total').innerText = formatMoney(dayTotal);
    document.getElementById('rep-day-profit').innerText = formatMoney(dayProfit);
    
    document.getElementById('rep-week-total').innerText = formatMoney(weekTotal);
    document.getElementById('rep-week-profit').innerText = formatMoney(weekProfit);

    document.getElementById('rep-month-total').innerText = formatMoney(monthTotal);
    document.getElementById('rep-month-profit').innerText = formatMoney(monthProfit);
}

// ==================== EXPORTAR EXCEL ====================
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    const salesData = sales.map(s => ({
        'Data/Hora': formatDateTime(s.date),
        'Itens': s.items.map(i => `${i.qty}x ${i.flavor}`).join(', '),
        'Quantidade Total': s.totalQty,
        'Tipo': s.isPromo ? 'Promoção' : 'Normal',
        'Custo Total (R$)': s.totalCost.toFixed(2),
        'Valor Venda (R$)': s.saleTotal.toFixed(2),
        'Lucro (R$)': s.profit.toFixed(2)
    }));
    const wsSales = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, wsSales, "Vendas");

    const trufflesData = truffles.map(t => ({
        'Sabor': t.flavor,
        'Data Produção': formatDate(t.prodDate),
        'Validade': formatDate(t.expiryDate),
        'Quantidade em Estoque': t.qty
    }));
    const wsTruffles = XLSX.utils.json_to_sheet(trufflesData);
    XLSX.utils.book_append_sheet(wb, wsTruffles, "Estoque Trufas");

    const ingredientsData = ingredients.map(i => ({
        'Nome do Ingrediente': i.name,
        'Peso': i.weight,
        'Validade': formatDate(i.expiry)
    }));
    const wsIngredients = XLSX.utils.json_to_sheet(ingredientsData);
    XLSX.utils.book_append_sheet(wb, wsIngredients, "Ingredientes");

    XLSX.writeFile(wb, "Doces_Do_Nosso_Sim_Relatorio.xlsx");
}

function saveData() {
    localStorage.setItem('dosn_truffles', JSON.stringify(truffles));
    localStorage.setItem('dosn_ingredients', JSON.stringify(ingredients));
    localStorage.setItem('dosn_sales', JSON.stringify(sales));
}

function formatMoney(val) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
    if(!dateStr) return '';
    const parts = dateStr.split('-');
    if(parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(dateStr) {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
}

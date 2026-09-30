// Estado Global da Aplicação
let truffles = JSON.parse(localStorage.getItem('dosn_truffles')) || [];
let ingredients = JSON.parse(localStorage.getItem('dosn_ingredients')) || [];
let sales = JSON.parse(localStorage.getItem('dosn_sales')) || [];

// Credenciais de Login
const VALID_USER = "paixao421";
const VALID_PASS = "362514@Sa";

// Sabores Padrão
const DEFAULT_FLAVORS = ["Maracujá", "Prestígio", "Brigadeiro", "Ninho"];
const COST_PRICE = 2.14;
const NORMAL_PRICE = 5.00;

let flavorsChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();
    checkLockoutTimer();
    initTheme();

    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('truffle-prod-date')) {
        document.getElementById('truffle-prod-date').value = today;
        calculateTruffleExpiry();
    }
    if(document.getElementById('ing-expiry')) {
        document.getElementById('ing-expiry').value = today;
    }

    renderAll();
    addSaleRow();
});

// ==================== TEMA (SOL E LUA) ====================
function initTheme() {
    const theme = localStorage.getItem('dosn_theme') || 'light';
    setTheme(theme, false);
}

function setTheme(theme, save = true) {
    const sunBtn = document.getElementById('sun-btn');
    const moonBtn = document.getElementById('moon-btn');

    if(theme === 'dark') {
        document.body.classList.add('dark-mode');
        if(sunBtn) sunBtn.classList.remove('active-theme');
        if(moonBtn) moonBtn.classList.add('active-theme');
    } else {
        document.body.classList.remove('dark-mode');
        if(moonBtn) moonBtn.classList.remove('active-theme');
        if(sunBtn) sunBtn.classList.add('active-theme');
    }

    if(save) {
        localStorage.setItem('dosn_theme', theme);
    }

    if(sales.length > 0) {
        renderChart();
    }
}

// ==================== LOGIN ====================
function checkLoginState() {
    const isLogged = sessionStorage.getItem('dosn_logged');
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');

    if(isLogged === 'true') {
        loginScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
    } else {
        loginScreen.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
}

function handleLogin(e) {
    e.preventDefault();
    let lockoutUntil = parseInt(localStorage.getItem('dosn_lockout_until')) || 0;
    if(Date.now() < lockoutUntil) return;

    const userInput = document.getElementById('login-user').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();
    const errorDiv = document.getElementById('login-error');

    if(userInput === VALID_USER && passInput === VALID_PASS) {
        localStorage.setItem('dosn_failed_attempts', '0');
        localStorage.setItem('dosn_lockout_until', '0');
        sessionStorage.setItem('dosn_logged', 'true');
        errorDiv.classList.add('hidden');
        document.getElementById('login-form').reset();
        checkLoginState();
    } else {
        let failedAttempts = parseInt(localStorage.getItem('dosn_failed_attempts')) || 0;
        failedAttempts++;
        localStorage.setItem('dosn_failed_attempts', failedAttempts.toString());

        let now = Date.now();
        if(failedAttempts === 3) {
            let blockUntil = now + 5 * 1000;
            localStorage.setItem('dosn_lockout_until', blockUntil.toString());
            triggerLockout(5, "aguarde 5 segundos");
        } else if(failedAttempts > 3) {
            let extraBlocks = failedAttempts - 3;
            let blockDurationSeconds = 180 * extraBlocks; 
            let blockUntil = now + blockDurationSeconds * 1000;
            localStorage.setItem('dosn_lockout_until', blockUntil.toString());
            let mins = Math.ceil(blockDurationSeconds / 60);
            triggerLockout(blockDurationSeconds, `Bloqueado por ${mins} min.`);
        } else {
            let remaining = 3 - failedAttempts;
            errorDiv.innerText = `Incorreto. Restam ${remaining} tentativa(s).`;
            errorDiv.classList.remove('hidden');
        }
    }
}

function triggerLockout(durationInSeconds, message) {
    const errorDiv = document.getElementById('login-error');
    const timerDiv = document.getElementById('login-timer');
    const loginBtn = document.getElementById('login-btn');
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');

    errorDiv.innerText = message;
    errorDiv.classList.remove('hidden');
    loginBtn.disabled = true;
    userInput.disabled = true;
    passInput.disabled = true;
    timerDiv.classList.remove('hidden');

    let remainingTime = durationInSeconds;
    const interval = setInterval(() => {
        let mins = Math.floor(remainingTime / 60);
        let secs = remainingTime % 60;
        timerDiv.innerText = mins > 0 ? `Aguarde ${mins}m ${secs}s` : `aguarde ${secs}s`;
        remainingTime--;

        if(remainingTime < 0) {
            clearInterval(interval);
            timerDiv.classList.add('hidden');
            errorDiv.classList.add('hidden');
            loginBtn.disabled = false;
            userInput.disabled = false;
            passInput.disabled = false;
            userInput.focus();
        }
    }, 1000);
}

function checkLockoutTimer() {
    let lockoutUntil = parseInt(localStorage.getItem('dosn_lockout_until')) || 0;
    let now = Date.now();
    if(now < lockoutUntil) {
        let remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
        triggerLockout(remainingSeconds, "aguarde bloqueio");
    }
}

function handleLogout() {
    sessionStorage.removeItem('dosn_logged');
    checkLoginState();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabId === 'relatorios') {
        renderChart();
    }
}

// ==================== CADASTRO DE INGREDIENTES & CUSTO ====================
function handleIngredientSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('ing-name').value;
    const weight = document.getElementById('ing-weight').value;
    const price = parseFloat(document.getElementById('ing-price').value) || 0;
    const expiry = document.getElementById('ing-expiry').value;

    ingredients.push({ id: Date.now(), name, weight, price, expiry });
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
    
    let totalProductionCost = 0;

    if(ingredients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Nenhum ingrediente.</td></tr>';
    } else {
        ingredients.forEach(ing => {
            totalProductionCost += (ing.price || 0);
            tbody.innerHTML += `
                <tr>
                    <td>${ing.name}</td>
                    <td>${ing.weight}</td>
                    <td>${formatMoney(ing.price || 0)}</td>
                    <td>${formatDate(ing.expiry)}</td>
                    <td><button class="btn-icon" onclick="deleteIngredient(${ing.id})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        });
    }

    document.getElementById('total-production-cost').innerText = formatMoney(totalProductionCost);
}

// ==================== CADASTRO DE TRUFAS (CICLOS DE 7 DIAS) ====================
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

// Função para agrupar e separar lotes em ciclos de 7 dias
function renderTruffles() {
    const cyclesContainer = document.getElementById('cycles-container');
    cyclesContainer.innerHTML = '';

    let totalProduced = 0;
    truffles.forEach(t => totalProduced += (t.qty || 0));

    document.getElementById('total-produced-count').innerText = totalProduced;
    const salesTotalBadge = document.getElementById('sales-total-truffles-count');
    if(salesTotalBadge) salesTotalBadge.innerText = totalProduced;

    if(truffles.length === 0) {
        cyclesContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Nenhum lote de trufa cadastrado.</p>';
        return;
    }

    // Ordenar trufas por data de produção
    const sortedTruffles = [...truffles].sort((a, b) => new Date(a.prodDate) - new Date(b.prodDate));

    // Agrupar em blocos de ciclos de 7 dias a partir da primeira produção
    let cyclesMap = {};
    
    sortedTruffles.forEach(t => {
        let prodDate = new Date(t.prodDate);
        // Encontrar o início do ciclo de 7 dias
        let baseDate = new Date(sortedTruffles[0].prodDate);
        let diffTime = prodDate - baseDate;
        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let cycleIndex = Math.floor(diffDays / 7);
        
        let cycleStart = new Date(baseDate);
        cycleStart.setDate(baseDate.getDate() + (cycleIndex * 7));
        let cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 6);

        let cycleKey = `Ciclo: ${formatDate(cycleStart.toISOString().split('T')[0])} até ${formatDate(cycleEnd.toISOString().split('T')[0])}`;

        if(!cyclesMap[cycleKey]) {
            cyclesMap[cycleKey] = [];
        }
        cyclesMap[cycleKey].push(t);
    });

    for(let cycleName in cyclesMap) {
        let cycleHtml = `
            <div style="background: var(--beige-light); border: 1px solid var(--beige-dark); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                <h4 style="color: var(--accent-color); font-size: 0.9rem; margin-bottom: 8px; border-bottom: 1px dashed var(--accent-color); padding-bottom: 4px;"><i class="fa-solid fa-calendar-days"></i> ${cycleName}</h4>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Sabor</th>
                                <th>Produção</th>
                                <th>Validade</th>
                                <th>Qtd</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        cyclesMap[cycleName].forEach(t => {
            cycleHtml += `
                <tr>
                    <td>${t.flavor}</td>
                    <td>${formatDate(t.prodDate)}</td>
                    <td>${formatDate(t.expiryDate)}</td>
                    <td>${t.qty}</td>
                    <td><button class="btn-icon" onclick="deleteTruffle(${t.id})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        });

        cycleHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        cyclesContainer.innerHTML += cycleHtml;
    }
}

function getAllFlavors() {
    const customFlavors = truffles.map(t => t.flavor);
    return [...new Set([...DEFAULT_FLAVORS, ...customFlavors])];
}

function updateFlavorSelects() {
    const selects = document.querySelectorAll('.sale-flavor');
    const flavors = getAllFlavors();
    
    selects.forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">Selecione</option>';
        flavors.forEach(f => {
            sel.innerHTML += `<option value="${f}">${f}</option>`;
        });
        sel.value = currentVal;
    });

    const truffleSelect = document.getElementById('truffle-flavor');
    if(truffleSelect) {
        const currentTruffleVal = truffleSelect.value;
        truffleSelect.innerHTML = '<option value="">Selecione</option>';
        DEFAULT_FLAVORS.forEach(f => {
            truffleSelect.innerHTML += `<option value="${f}">${f}</option>`;
        });
        truffles.forEach(t => {
            if(!DEFAULT_FLAVORS.includes(t.flavor)) {
                truffleSelect.innerHTML += `<option value="${t.flavor}">${t.flavor}</option>`;
            }
        });
        truffleSelect.value = currentTruffleVal;
    }
}

// ==================== VENDAS & SUBTRAÇÃO DO ESTOQUE ====================
function addSaleRow() {
    const container = document.getElementById('sale-items-container');
    const flavors = getAllFlavors();
    let optionsHtml = '<option value="">Selecione</option>';
    flavors.forEach(f => {
        optionsHtml += `<option value="${f}">${f}</option>`;
    });

    const div = document.createElement('div');
    div.className = 'sale-item-row';
    div.innerHTML = `
        <div class="form-group">
            <label>Sabor</label>
            <select class="sale-flavor" required onchange="calculateSaleTotal()">
                ${optionsHtml}
            </select>
        </div>
        <div class="form-group" style="max-width: 90px;">
            <label>Qtd</label>
            <input type="number" class="sale-qty" min="1" value="1" required onchange="calculateSaleTotal()">
        </div>
        <button type="button" class="btn-icon danger" onclick="removeSaleRow(this)"><i class="fa-solid fa-trash"></i></button>
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
        alert('Mínimo 1 item.');
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
            alert('Selecione o sabor.');
            return;
        }
        items.push({ flavor, qty });
        totalQty += qty;
    }

    const paymentMethod = document.getElementById('payment-method').value;
    const isPromo = document.getElementById('is-promo').checked;
    const totalCost = totalQty * COST_PRICE;
    let saleTotal = 0;

    if(isPromo) {
        saleTotal = parseFloat(document.getElementById('promo-total-price').value);
        if(isNaN(saleTotal) || saleTotal < 0) {
            alert('Valor de promoção inválido.');
            return;
        }
    } else {
        saleTotal = totalQty * NORMAL_PRICE;
    }

    const profit = saleTotal - totalCost;

    // Subtração automática do valor total das trufas produzidas em estoque
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
        paymentMethod,
        isReceived: true,
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
    alert('Venda registrada e estoque subtraído com sucesso!');
}

function toggleSaleReceived(id) {
    const sale = sales.find(s => s.id === id);
    if(sale) {
        sale.isReceived = !sale.isReceived;
        saveData();
        renderAll();
    }
}

function deleteSale(id) {
    if(confirm('Excluir venda?')) {
        sales = sales.filter(s => s.id !== id);
        saveData();
        renderAll();
    }
}

// ==================== RELATÓRIOS & DÍZIMO ====================
function renderAll() {
    renderIngredients();
    renderTruffles();
    updateFlavorSelects();
    renderSalesTables();
    calculateReports();
    renderChart();
}

function renderSalesTables() {
    const recentTbody = document.querySelector('#recent-sales-table tbody');
    const fullTbody = document.querySelector('#full-sales-table tbody');
    
    recentTbody.innerHTML = '';
    fullTbody.innerHTML = '';

    if(sales.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">Nenhuma venda.</td></tr>';
        fullTbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">Nenhuma venda.</td></tr>';
        return;
    }

    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedSales.forEach((s, index) => {
        const itemsStr = s.items.map(i => `${i.qty}x ${i.flavor}`).join(', ');
        const typeStr = s.isPromo ? '<span style="color: var(--danger);">Promo</span>' : 'Normal';
        const receivedChecked = s.isReceived ? 'checked' : '';
        const statusBadge = s.isReceived ? '<span style="color: var(--success);"><i class="fa-solid fa-check"></i> Sim</span>' : '<span style="color: var(--danger);">Não</span>';
        const paymentStr = s.paymentMethod || 'Dinheiro';

        const checkboxHtml = `<label style="cursor: pointer; display:flex; align-items:center; gap:4px;"><input type="checkbox" ${receivedChecked} onchange="toggleSaleReceived(${s.id})" style="width:14px; height:14px;"> ${statusBadge}</label>`;
        
        if(index < 5) {
            recentTbody.innerHTML += `
                <tr>
                    <td>${formatDateTimeShort(s.date)}</td>
                    <td>${itemsStr}</td>
                    <td>${s.totalQty}</td>
                    <td>${paymentStr}</td>
                    <td>${typeStr}</td>
                    <td>${checkboxHtml}</td>
                    <td>${formatMoney(s.saleTotal)}</td>
                    <td style="color: var(--success);">${formatMoney(s.profit)}</td>
                    <td><button class="btn-icon" onclick="deleteSale(${s.id})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        }

        fullTbody.innerHTML += `
            <tr>
                <td>${formatDateTimeShort(s.date)}</td>
                <td>${itemsStr}</td>
                <td>${s.totalQty}</td>
                <td>${paymentStr}</td>
                <td>${typeStr}</td>
                <td>${checkboxHtml}</td>
                <td>${formatMoney(s.totalCost)}</td>
                <td>${formatMoney(s.saleTotal)}</td>
                <td style="color: var(--success);">${formatMoney(s.profit)}</td>
            </tr>
        `;
    });
}

function calculateReports() {
    const now = new Date();
    let dayTotal = 0, dayProfit = 0;
    let weekTotal = 0, weekProfit = 0;
    let monthTotal = 0, monthProfit = 0;
    let totalNetProfit = 0;

    const startOfWeek = new Date(now);
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    sales.forEach(s => {
        totalNetProfit += s.profit;
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

    // Cálculo do Dízimo (10% do Lucro Líquido total)
    let dizimoAmount = totalNetProfit * 0.10;
    document.getElementById('rep-dizimo-total').innerText = formatMoney(dizimoAmount);
}

function renderChart() {
    const ctx = document.getElementById('flavorsChart');
    if(!ctx) return;

    const flavorCounts = {};
    sales.forEach(s => {
        s.items.forEach(item => {
            flavorCounts[item.flavor] = (flavorCounts[item.flavor] || 0) + item.qty;
        });
    });

    const labels = Object.keys(flavorCounts);
    const dataValues = Object.values(flavorCounts);

    if(flavorsChartInstance) {
        flavorsChartInstance.destroy();
    }

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#ffffff' : '#4a3b2c';
    const gridColor = isDark ? '#333333' : '#e8dfd1';

    flavorsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Sem vendas'],
            datasets: [{
                label: 'Qtd',
                data: dataValues.length > 0 ? dataValues : [0],
                backgroundColor: isDark ? '#ffffff' : '#8c6d48',
                borderColor: isDark ? '#cccccc' : '#705435',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
                y: { beginAtZero: true, ticks: { color: textColor, precision: 0, font: { size: 10 } }, grid: { color: gridColor } }
            }
        }
    });
}

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const salesData = sales.map(s => ({
        'Data/Hora': formatDateTime(s.date),
        'Itens': s.items.map(i => `${i.qty}x ${i.flavor}`).join(', '),
        'Qtd': s.totalQty,
        'Pagamento': s.paymentMethod || 'Dinheiro',
        'Tipo': s.isPromo ? 'Promoção' : 'Normal',
        'Recebido': s.isReceived ? 'Sim' : 'Não',
        'Custo (R$)': s.totalCost.toFixed(2),
        'Total (R$)': s.saleTotal.toFixed(2),
        'Lucro (R$)': s.profit.toFixed(2)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), "Vendas");

    const trufflesData = truffles.map(t => ({
        'Sabor': t.flavor,
        'Produção': formatDate(t.prodDate),
        'Validade': formatDate(t.expiryDate),
        'Qtd': t.qty
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trufflesData), "Estoque");

    const ingredientsData = ingredients.map(i => ({
        'Nome': i.name,
        'Peso': i.weight,
        'Preço (R$)': (i.price || 0).toFixed(2),
        'Validade': formatDate(i.expiry)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingredientsData), "Ingredientes");

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

function formatDateTimeShort(dateStr) {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

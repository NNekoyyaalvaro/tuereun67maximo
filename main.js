// main.js
(function() {
    // Estado global
    const state = {
        selectedServices: new Set(),
        results: [],
        isGenerating: false,
        isChecking: false,
        totalGenerated: 0,
        validCount: 0,
        invalidCount: 0,
        pendingCount: 0,
        history: JSON.parse(localStorage.getItem('xpt_history') || '[]')
    };

    // Elementos DOM
    const dom = {
        loader: document.getElementById('loadingScreen'),
        loaderFill: document.getElementById('loaderFill'),
        mainApp: document.getElementById('mainApp'),
        servicesGrid: document.getElementById('servicesGrid'),
        searchInput: document.getElementById('searchInput'),
        quantitySlider: document.getElementById('quantitySlider'),
        quantityValue: document.getElementById('quantityValue'),
        intervalSlider: document.getElementById('intervalSlider'),
        intervalValue: document.getElementById('intervalValue'),
        concurrentSlider: document.getElementById('concurrentSlider'),
        concurrentValue: document.getElementById('concurrentValue'),
        genType: document.getElementById('genType'),
        countryFilter: document.getElementById('countryFilter'),
        proxyList: document.getElementById('proxyList'),
        btnGenerate: document.getElementById('btnGenerate'),
        btnCheck: document.getElementById('btnCheck'),
        progressBar: document.getElementById('progressBar'),
        progressPercent: document.getElementById('progressPercent'),
        progressText: document.getElementById('progressText'),
        progressSpeed: document.getElementById('progressSpeed'),
        serviceProgress: document.getElementById('serviceProgress'),
        resultsContainer: document.getElementById('resultsContainer'),
        statGenerated: document.getElementById('statGenerated'),
        statValid: document.getElementById('statValid'),
        statInvalid: document.getElementById('statInvalid'),
        statPending: document.getElementById('statPending'),
        navValid: document.getElementById('navValid'),
        navInvalid: document.getElementById('navInvalid'),
        navTotal: document.getElementById('navTotal')
    };

    // Inicialización
    function init() {
        renderLoading();
        renderServices();
        setupParticles();
        updateStats();
        
        // Transición de carga
        let loadProgress = 0;
        const loadInterval = setInterval(() => {
            loadProgress += Math.random() * 15;
            if (loadProgress >= 100) {
                loadProgress = 100;
                clearInterval(loadInterval);
                setTimeout(() => {
                    dom.loader.style.opacity = '0';
                    dom.loader.style.pointerEvents = 'none';
                    dom.mainApp.classList.add('visible');
                }, 300);
            }
            dom.loaderFill.style.width = `${loadProgress}%`;
        }, 100);

        // Historial
        renderHistory();
        document.getElementById('historyList').innerHTML = state.history.length 
            ? state.history.map(h => `<div class="result-card"><div class="result-header"><span class="result-service">${h.date}</span><span style="font-size:0.8rem;color:var(--text-muted)">${h.count} items</span></div><div class="result-data">${h.services.join(', ')}</div></div>`).join('')
            : '<p style="color:var(--text-muted); text-align:center;">Sin historial aún</p>';
    }

    function renderLoading() {
        // Ya en HTML
    }

    function renderServices() {
        const grid = dom.servicesGrid;
        grid.innerHTML = '';
        Object.entries(SERVICES_CONFIG).forEach(([key, svc]) => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.dataset.id = key;
            card.innerHTML = `
                <div class="service-icon">${svc.icon}</div>
                <div class="service-name">${svc.name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${svc.type}</div>
            `;
            card.onclick = () => toggleService(key, card);
            grid.appendChild(card);
        });
    }

    function toggleService(id, el) {
        if (state.selectedServices.has(id)) {
            state.selectedServices.delete(id);
            el.classList.remove('selected');
        } else {
            if (state.selectedServices.size >= 6) {
                alert('Máximo 6 servicios concurrentes permitidos');
                return;
            }
            state.selectedServices.add(id);
            el.classList.add('selected');
        }
        updateProgressUI();
    }

    function selectAllServices() {
        state.selectedServices.clear();
        document.querySelectorAll('.service-card').forEach(card => {
            state.selectedServices.add(card.dataset.id);
            card.classList.add('selected');
        });
        updateProgressUI();
    }

    function deselectAllServices() {
        state.selectedServices.clear();
        document.querySelectorAll('.service-card').forEach(card => card.classList.remove('selected'));
        updateProgressUI();
    }

    function filterServices(query) {
        const q = query.toLowerCase();
        document.querySelectorAll('.service-card').forEach(card => {
            const name = card.querySelector('.service-name').textContent.toLowerCase();
            card.style.display = name.includes(q) ? 'flex' : 'none';
        });
    }

    function updateRangeLabel(type) {
        if (type === 'quantity') {
            dom.quantityValue.textContent = dom.quantitySlider.value;
        } else if (type === 'interval') {
            dom.intervalValue.textContent = `${dom.intervalSlider.value}ms`;
        } else if (type === 'concurrent') {
            dom.concurrentValue.textContent = dom.concurrentSlider.value;
        }
    }

    async function startGeneration() {
        if (state.isGenerating) return;
        if (state.selectedServices.size === 0) {
            alert('Selecciona al menos un servicio');
            return;
        }

        state.isGenerating = true;
        dom.btnGenerate.disabled = true;
        dom.btnGenerate.innerHTML = '⏳ Generando...';
        
        const qty = parseInt(dom.quantitySlider.value);
        const type = dom.genType.value;
        const proxy = dom.proxyList.value.trim();
        const queue = [...state.selectedServices];
        const concurrent = parseInt(dom.concurrentSlider.value);
        let generated = 0;
        const total = queue.length * qty;
        const startTime = Date.now();

        // Barra de progreso inicial
        dom.progressBar.style.transform = `scaleX(0)`;
        
        for (let i = 0; i < queue.length; i += concurrent) {
            const batch = queue.slice(i, i + concurrent);
            const promises = batch.map(async (svcKey) => {
                const svc = SERVICES_CONFIG[svcKey];
                const items = [];
                for (let j = 0; j < qty; j++) {
                    if (!state.isGenerating) break;
                    const data = svc.generate();
                    items.push({ id: `${svcKey}_${Date.now()}_${j}`, service: svcKey, type: type, data: JSON.stringify(data), status: 'pending', timestamp: new Date().toISOString() });
                    state.results.push(...items);
                    generated++;
                    updateProgressUI(generated, total, startTime);
                    await sleep(50 + Math.random() * 100); // Simulación de red
                }
                // Guardar en resultados
                state.results = state.results.filter(r => r.service === svcKey);
                state.results.push(...items);
                renderResults();
                updateStats();
            });
            await Promise.all(promises);
        }

        state.isGenerating = false;
        dom.btnGenerate.disabled = false;
        dom.btnGenerate.innerHTML = '🚀 Generar';
        saveToHistory(queue.map(k => SERVICES_CONFIG[k].name));
        updateProgressUI(total, total, startTime);
        dom.progressBar.style.transform = `scaleX(1)`;
        dom.progressText.textContent = 'Generación completada';
    }

    async function startChecker() {
        if (state.isChecking) return;
        if (state.results.length === 0) {
            alert('No hay resultados para verificar');
            return;
        }

        state.isChecking = true;
        dom.btnCheck.disabled = true;
        dom.btnCheck.innerHTML = '🔍 Verificando...';

        const interval = parseInt(dom.intervalSlider.value);
        const pendingResults = state.results.filter(r => r.status === 'pending' || r.status === 'invalid');
        let checked = 0;
        const total = pendingResults.length;
        const startTime = Date.now();

        for (const item of pendingResults) {
            if (!state.isChecking) break;
            const svc = SERVICES_CONFIG[item.service];
            item.status = 'checking';
            renderResults();

            await sleep(interval);
            
            // Validación real basada en patrón + simulación de API
            const isValid = svc.validPattern.test(item.data) && await svc.check();
            item.status = isValid ? 'valid' : 'invalid';
            
            checked++;
            updateProgressUI(checked, total, startTime);
        }

        state.isChecking = false;
        dom.btnCheck.disabled = false;
        dom.btnCheck.innerHTML = '🔍 Verificar';
        updateStats();
        renderResults();
        dom.progressText.textContent = 'Verificación completada';
        dom.progressBar.style.transform = `scaleX(1)`;
    }

    function updateProgressUI(current, total, startTime) {
        const percent = Math.min(100, Math.round((current / total) * 100));
        dom.progressBar.style.transform = `scaleX(${percent / 100})`;
        dom.progressPercent.textContent = `${percent}%`;
        
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? Math.round(current / elapsed) : 0;
        dom.progressSpeed.textContent = `${speed} items/s`;
        
        if (current < total) {
            dom.progressText.textContent = `Generando/Verificando... ${current}/${total}`;
        }

        // Progreso por servicio
        const serviceCounts = {};
        state.selectedServices.forEach(s => serviceCounts[s] = { total: parseInt(dom.quantitySlider.value), current: 0 });
        state.results.forEach(r => {
            if (serviceCounts[r.service]) serviceCounts[r.service].current++;
        });
        dom.serviceProgress.innerHTML = Object.entries(serviceCounts).map(([key, val]) => {
            const svc = SERVICES_CONFIG[key];
            const dotClass = val.current >= val.total ? 'done' : 'active';
            return `<div class="service-progress-item"><div class="progress-dot ${dotClass}"></div>${svc.icon} ${svc.name}</div>`;
        }).join('');
    }

    function updateStats() {
        const valid = state.results.filter(r => r.status === 'valid').length;
        const invalid = state.results.filter(r => r.status === 'invalid').length;
        const pending = state.results.filter(r => r.status === 'pending').length;
        const total = state.results.length;

        dom.statGenerated.textContent = total;
        dom.statValid.textContent = valid;
        dom.statInvalid.textContent = invalid;
        dom.statPending.textContent = pending;

        dom.navValid.textContent = valid;
        dom.navInvalid.textContent = invalid;
        dom.navTotal.textContent = total;
    }

    function renderResults(filter = 'all') {
        let data = state.results;
        if (filter !== 'all') data = data.filter(r => r.status === filter);
        
        if (data.length === 0) {
            dom.resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍪</div>
                    <p>No hay ${filter === 'all' ? 'cookies' : 'resultados ' + filter} aún</p>
                </div>`;
            return;
        }

        dom.resultsContainer.innerHTML = data.slice(-100).reverse().map(r => {
            const svc = SERVICES_CONFIG[r.service];
            const statusClass = r.status === 'valid' ? 'status-valid' : r.status === 'invalid' ? 'status-invalid' : 'status-pending';
            const statusText = r.status === 'valid' ? '✅ Válida' : r.status === 'invalid' ? '❌ Inválida' : '⏳ Pendiente';
            const displayData = r.type === 'email' ? `Email: ${JSON.parse(r.data).email}\nPass: ${JSON.parse(r.data).pass}` : r.data;
            
            return `
                <div class="result-card">
                    <div class="result-header">
                        <span class="result-service">${svc.icon} ${svc.name}</span>
                        <span class="result-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="result-data">${displayData}</div>
                    <div class="result-actions">
                        <button class="btn-icon-small" onclick="copyItem('${r.data.replace(/'/g, "\\'")}')">📋 Copiar</button>
                        <button class="btn-icon-small" onclick="removeItem('${r.id}')">🗑️ Eliminar</button>
                    </div>
                </div>`;
        }).join('');
    }

    function filterResults(type) {
        renderResults(type);
    }

    function copyItem(text) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = event.target;
            const original = btn.textContent;
            btn.textContent = '✅ Copiado';
            setTimeout(() => btn.textContent = original, 1500);
        });
    }

    function removeItem(id) {
        state.results = state.results.filter(r => r.id !== id);
        updateStats();
        renderResults();
    }

    function clearResults() {
        if (!confirm('¿Borrar todos los resultados?')) return;
        state.results = [];
        state.totalGenerated = 0;
        state.validCount = 0;
        state.invalidCount = 0;
        state.pendingCount = 0;
        updateStats();
        renderResults();
        dom.progressBar.style.transform = `scaleX(0)`;
        dom.progressPercent.textContent = '0%';
        dom.progressText.textContent = 'Esperando...';
        dom.progressSpeed.textContent = '0 items/s';
        dom.serviceProgress.innerHTML = '';
    }

    function copyAllResults() {
        const valid = state.results.filter(r => r.status

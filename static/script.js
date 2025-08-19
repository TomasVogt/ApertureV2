// Archivo: static/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Definiciones de constantes
    const generateBtn = document.getElementById('generateBtn');
    const userInput = document.getElementById('userInput');
    const levelSelect = document.getElementById('level');
    const mindmapContainer = document.getElementById('mindmap-container');
    const loader = document.getElementById('loader');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    generateBtn.addEventListener('click', generarRuta);
    modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });
    modalCloseBtn.addEventListener('click', closeModal);

    async function generarRuta() {
        if (!userInput.value) { alert("Por favor, define un objetivo."); return; }
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generando...';
        loader.classList.remove('hidden');
        mindmapContainer.innerHTML = '';
        try {
            const response = await fetch('/generate-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: userInput.value, level: levelSelect.value })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Error del servidor: ${response.status}` }));
                throw new Error(errorData.error);
            }
            const data = await response.json();
            if (!data.nodo_raiz) { throw new Error("La IA no devolvió una ruta válida."); }
            renderMindMap(data.nodo_raiz);
        } catch (error) {
            mindmapContainer.innerHTML = `<p class="error">${error.message}</p>`;
        } finally {
            loader.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generar Mapa';
        }
    }

    function renderMindMap(rootNodeData) {
        mindmapContainer.innerHTML = `
            <div class="mindmap-nodes"></div>
            <svg class="mindmap-connectors" width="1" height="1"></svg>
        `;
        const nodesContainer = mindmapContainer.querySelector('.mindmap-nodes');
        let nodeIdCounter = 0;
        let delay = 0;

        function createColumn(nodesData) {
            if (!nodesData || nodesData.length === 0) return;
            const column = document.createElement('div');
            column.className = 'column';
            let nextNodes = [];
            
            nodesData.forEach(nodeData => {
                nodeIdCounter++;
                const nodeId = `node-${nodeIdCounter}`;
                nodeData.id = nodeId;
                
                const nodeElement = document.createElement('div');
                nodeElement.className = 'node';
                nodeElement.id = nodeId;
                if (nodeData.parentId) nodeElement.dataset.parentId = nodeData.parentId;
                if (nodeData.es_hub) nodeElement.classList.add('hub');
                
                let contentHTML = `<h4>${nodeData.titulo || nodeData.titulo_etapa || nodeData.titulo_rama}</h4>`;
                
                if(nodeData.recursos && Object.keys(nodeData.recursos).length > 0) {
                    contentHTML += `<div class="node-resource-icons">`;
                    if(nodeData.recursos.recurso_principal) contentHTML += `<span>📖</span>`;
                    if(nodeData.recursos.libro_recomendado) contentHTML += `<span>📚</span>`;
                    if(nodeData.recursos.curso_profundizacion) contentHTML += `<span>🎓</span>`;
                    if(nodeData.recursos.desafio_practico) contentHTML += `<span>💡</span>`;
                    contentHTML += `</div>`;
                }

                nodeElement.innerHTML = contentHTML;
                nodeElement.style.animationDelay = `${delay}ms`;
                delay += 50;
                
                if (!nodeData.es_hub) {
                    nodeElement.addEventListener('click', () => openModal(nodeData));
                }

                column.appendChild(nodeElement);

                const children = nodeData.sub_nodos || nodeData.etapas || (nodeData.ramas ? nodeData.ramas.map(r => ({...r, es_hub: true, titulo: r.titulo_rama})) : []);
                if(children) {
                    nextNodes.push(...children.map(c => ({...c, parentId: nodeId})))
                }
            });
            nodesContainer.appendChild(column);
            createColumn(nextNodes);
        }

        createColumn([rootNodeData]);
        setTimeout(drawConnectors, 500);
    }
    
    function drawConnectors() {
        const svg = mindmapContainer.querySelector('.mindmap-connectors');
        const nodesContainer = mindmapContainer.querySelector('.mindmap-nodes');
        if (!svg || !nodesContainer) return;
        svg.innerHTML = '';
        
        svg.setAttribute('width', nodesContainer.scrollWidth);
        svg.setAttribute('height', nodesContainer.scrollHeight);
        
        document.querySelectorAll('.node').forEach(node => {
            if (!node.dataset.parentId) return;
            const parentNode = document.getElementById(node.dataset.parentId);
            if (!parentNode) return;

            const rect1 = parentNode.getBoundingClientRect();
            const rect2 = node.getBoundingClientRect();
            const containerRect = nodesContainer.getBoundingClientRect();

            const startX = rect1.right - containerRect.left;
            const startY = rect1.top - containerRect.top + rect1.height / 2;
            const endX = rect2.left - containerRect.left;
            const endY = rect2.top - containerRect.top + rect2.height / 2;
            
            const controlX = startX + (endX - startX) * 0.5;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`);
            path.style.animationDelay = node.style.animationDelay;
            svg.appendChild(path);
});
    }

    function openModal(nodeData) {
        document.getElementById('modal-title').textContent = nodeData.titulo || nodeData.titulo_etapa;
        document.getElementById('modal-description').textContent = nodeData.descripcion || '';
        const resourcesDiv = document.getElementById('modal-resources');
        resourcesDiv.innerHTML = '';
        
        const r = nodeData.recursos;
        if(r) {
            if(r.recurso_principal && r.recurso_principal.url) resourcesDiv.innerHTML += createResourceHTML('📖', `<a href="${r.recurso_principal.url}" target="_blank" rel="noopener noreferrer">${r.recurso_principal.titulo}</a>`);
            if(r.libro_recomendado) resourcesDiv.innerHTML += createResourceHTML('📚', `<p><strong>Libro:</strong> ${r.libro_recomendado.titulo ? `<a href="${r.libro_recomendado.url}" target="_blank" rel="noopener noreferrer">${r.libro_recomendado.titulo}</a>` : r.libro_recomendado}</p>`);
            if(r.curso_profundizacion) resourcesDiv.innerHTML += createResourceHTML('🎓', `<p><strong>Curso:</strong> ${r.curso_profundizacion.titulo ? `<a href="${r.curso_profundizacion.url}" target="_blank" rel="noopener noreferrer">${r.curso_profundizacion.titulo}</a>` : r.curso_profundizacion}</p>`);
            if(r.desafio_practico) resourcesDiv.innerHTML += createResourceHTML('💡', `<p><strong>Desafío:</strong> ${r.desafio_practico}</p>`);
        }
        
        modalOverlay.classList.remove('hidden');
    }
    
    function createResourceHTML(icon, content) {
        return `<div class="resource-item"><span class="resource-icon">${icon}</span><div class="resource-details">${content}</div></div>`;
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    window.addEventListener('resize', drawConnectors);
});
function uploadModel() {
    const name = document.getElementById('newModelName').value.trim();
    const url = document.getElementById('newModelUrl').value.trim();
    const desc = document.getElementById('newModelDesc').value.trim();

    if (!name || !url || !desc) {
        alert('请填写完整模型信息');
        return;
    }

    const modelList = document.querySelector('.model-list');
    const newModel = document.createElement('div');
    newModel.className = 'model-item draggable';
    newModel.dataset.name = name;
    newModel.dataset.url = url;
    newModel.dataset.desc = desc;
    newModel.innerHTML = `
        ${name}
        <button onclick="deleteModelFromLibrary(this)">删除</button>
    `;
    modelList.appendChild(newModel);

    initDragDrop();
}

function deleteModelFromLibrary(button) {
    if (confirm('确定要删除这个模型吗？')) {
        button.parentElement.remove();
    }
}

let layers = [];
const models = [
    {
        name: 'OpenAI',
        url: 'https://chat.openai.com/',
        desc: '由OpenAI开发，以强大自然语言处理能力著称，支持多任务处理，广泛应用于对话、创作和代码生成，代表作为GPT系列模型'
    },
    {
        name: 'DeepSeek',
        url: 'https://chat.deepseek.com/',
        desc: '深度求索公司推出的开源大模型，专注高效推理与长文本处理，支持128K上下文，适合代码、数学及复杂逻辑任务'
    },
    {
        name: '腾讯元宝',
        url: 'https://yuanbao.tencent.com/',
        desc: '腾讯推出的企业级大模型，强调安全与落地应用，支持多模态交互，适用于金融、医疗行業场景优化'
    }
];

function initDragDrop() {
    let currentDragItem = null;

    document.querySelectorAll('.draggable').forEach(item => {
        item.draggable = true;

        item.addEventListener('dragstart', (e) => {
            item.classList.add('dragging');
            currentDragItem = item;

            e.dataTransfer.setData('text/plain', JSON.stringify({
                name: item.dataset.name,
                url: item.dataset.url,
                desc: item.dataset.desc
            }));
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.layer').forEach(layer => {
                layer.classList.remove('drop-target');
            });
            currentDragItem = null;
        });
    });

    document.querySelectorAll('.layer').forEach(layer => {
        layer.addEventListener('dragover', (e) => {
            e.preventDefault();

            const rect = layer.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const distance = Math.abs(e.clientY - centerY);

            if (distance < 100) {
                document.querySelectorAll('.layer').forEach(l => {
                    l.classList.remove('drop-target');
                });
                layer.classList.add('drop-target');

                const container = document.querySelector('.layers');
                if (e.clientY < 100) {
                    container.scrollLeft -= 20;
                } else if (e.clientY > window.innerHeight - 100) {
                    container.scrollLeft += 20;
                }
            }
        });

        layer.addEventListener('dragleave', () => {
            layer.classList.remove('drop-target');
        });

        layer.addEventListener('drop', (e) => {
            e.preventDefault();
            layer.classList.remove('drop-target');

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const layerIndex = Array.from(document.querySelectorAll('.layer')).indexOf(layer);

            if (layers[layerIndex] && layers[layerIndex].models.some(m => m.name === data.name)) {
                return alert('该模型已存在当前层级！');
            }

            if (layers[layerIndex]) {
                layers[layerIndex].models.push({
                    ...data,
                    weight: 1,
                    prompt: '',
                    index: layers[layerIndex].models.length
                });
                renderLayers();
            }
        });
    });
}

function addLayer() {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].models.length === 0) {
            alert('请先为每个层级添加至少一个模型！');
            return;
        }
    }

    layers.push({
        id: Date.now(),
        parallel: 0,
        models: []
    });
    renderLayers();
}

function renderLayers() {
    const container = document.getElementById('layers');
    container.innerHTML = layers
        .map((layer, index) => {
            if (!layer) return '';
            return `
                <div class="layer" data-id="${layer.id}"
                     ondragover="event.preventDefault()"
                     ondrop="dropHandler(event, ${index})">
                    <div class="layer-header">
                        <span>层级 ${index + 1}</span>
                        <button type="button" onclick="deleteLayer(${index})">删除</button>
                    </div>
                    ${(layer.models || []).map((model, modelIndex) => `
                        <div class="model-card" 
                             onclick="showModelConfig(${index}, ${modelIndex})">
                            <span>${model.name || '未命名模型'}</span>
                            <button type="button" onclick="event.stopPropagation();deleteModel(${index}, ${modelIndex})">×</button>
                        </div>
                    `).join('')}
                </div>
            `;
        })
        .join('');
    initDragDrop();
}

function showModelConfig(layerIndex, modelIndex) {
    const model = layers[layerIndex].models[modelIndex];
    document.getElementById('modalContent').innerHTML = `
        <h3>配置 ${model.name}</h3>
        <label>权重：
            <input type="number" id="config-weight" 
                   value="${model.weight || 1}" 
                   min="0" max="1" step="0.1">
        </label>
        <label>提示词：
            <textarea id="config-prompt" rows="3">${model.prompt || ''}</textarea>
        </label>
        <div style="margin-top: 15px; text-align: right;">
            <button onclick="saveConfig(${layerIndex}, ${modelIndex})">保存</button>
            <button onclick="closeModal()">取消</button>
        </div>
    `;
    showModal();
}

function saveConfig(layerIndex, modelIndex) {
    const weight = parseFloat(document.getElementById('config-weight').value);
    const prompt = document.getElementById('config-prompt').value;

    layers[layerIndex].models[modelIndex] = {
        ...layers[layerIndex].models[modelIndex],
        weight,
        prompt
    };
    closeModal();
    renderLayers();
}

function updateParallel(layerIndex, value) {
    layers[layerIndex].parallel = parseInt(value);
}

function deleteLayer(index) {
    layers.splice(index, 1);
    renderLayers();
}

function deleteModel(layerIndex, modelIndex) {
    layers[layerIndex].models.splice(modelIndex, 1);
    renderLayers();
}

function dropHandler(e, layerIndex) {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!layers[layerIndex]) {
        return alert('层级不存在！');
    }

    if (layers[layerIndex].models.some(m => m.name === data.name)) {
        return alert('该模型已存在当前层级！');
    }

    layers[layerIndex].models.push({
        ...data,
        weight: 1,
        prompt: '',
        index: layers[layerIndex].models.length
    });
    renderLayers();
}

async function combinedSubmit() {
    if (!validateSubmit()) return;

    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const imageFile = document.getElementById('projectImage').files[0];

    if (!projectName) {
        alert('请输入项目名称！');
        return;
    }

    if (!projectDescription) {
        alert('请输入项目描述！');
        return;
    }

    if (!imageFile) {
        alert('请上传项目图片！');
        return;
    }

    const submitBtn = document.querySelector('button[onclick="showUploadModal()"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;

    try {
        let imageBase64 = await toBase64(imageFile);
        const content = projectDescription;

        const payload = {
            image: imageBase64,
            content: content,
            modelList: layers.map((layer, index) => ({
                layer: index + 1,
                parallel: layer.models.length > 1 ? 1 : 0,
                models: layer.models.map(m => ({
                    modelName: m.name,
                    modelUrl: m.url,
                    weight: m.weight,
                    question: m.prompt
                }))
            }))
        };

        const res = await fetch('http://localhost:3000/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP错误! 状态码: ${res.status}`);
        }

        const result = await res.json();
        document.getElementById('message').textContent = result.message;
        closeUploadModal();

    } catch (error) {
        console.error('提交出错:', error);
        alert(`提交失败：${error.message}`);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

function showModal() {
    document.getElementById('modelConfigModal').style.display = 'block';
    document.getElementById('modalBackdrop').style.display = 'block';
}

function closeModal() {
    document.getElementById('modelConfigModal').style.display = 'none';
    document.getElementById('modalBackdrop').style.display = 'none';
}

function validateSubmit() {
    if (layers.length === 0) {
        alert('请至少添加一个层级！');
        return false;
    }
    return true;
}

let selectedServer = 'auto';

function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
    document.getElementById('modalBackdrop').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('modalBackdrop').style.display = 'none';
    document.getElementById('projectName').value = '';
    document.getElementById('projectImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.querySelectorAll('.server-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector('.server-option').classList.add('selected');
    selectedServer = 'auto';
}

function selectServer(element, server) {
    document.querySelectorAll('.server-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedServer = server;
}

function previewProjectImage() {
    const file = document.getElementById('projectImage').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

async function submitProject() {
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const imageFile = document.getElementById('projectImage').files[0];

    if (!projectName) {
        alert('请输入项目名称！');
        return;
    }

    if (!projectDescription) {
        alert('请输入项目描述！');
        return;
    }

    if (!imageFile) {
        alert('请上传项目图片！');
        return;
    }

    const formData = new FormData();
    formData.append('projectName', projectName);
    formData.append('projectDescription', projectDescription);
    formData.append('server', selectedServer);
    formData.append('image', imageFile);

    try {
        const response = await fetch('http://localhost:3000/api/project', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('项目提交成功！');
            closeUploadModal();
        } else {
            alert('提交失败，请重试');
        }
    } catch (error) {
        alert('网络错误：' + error.message);
    }
}

addLayer();

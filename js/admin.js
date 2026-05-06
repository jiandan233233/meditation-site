/**
 * 创作者工作台脚本 - GitHub API 版本
 * 使用 GitHub Contents API 存储内容
 */

// ========== 密码门禁系统 ==========

function getCreatorPassword() {
  return localStorage.getItem('creator_password') || 'sahaja2026';
}

function isCreatorAuth() {
  return sessionStorage.getItem('creator_auth') === '1';
}

function showWorkspace() {
  const overlay = document.getElementById('passwordOverlay');
  const workspace = document.getElementById('creatorWorkspace');
  const sidebar = document.getElementById('sidebarToolbar');
  const creatorBar = document.getElementById('creatorBar');
  
  if (overlay) overlay.classList.add('hidden');
  if (workspace) workspace.style.display = 'block';
  if (sidebar) sidebar.style.display = '';
  if (creatorBar) creatorBar.style.display = 'block';
}

function hideWorkspace() {
  const overlay = document.getElementById('passwordOverlay');
  const workspace = document.getElementById('creatorWorkspace');
  const sidebar = document.getElementById('sidebarToolbar');
  const creatorBar = document.getElementById('creatorBar');
  
  if (overlay) overlay.classList.remove('hidden');
  if (workspace) workspace.style.display = 'none';
  if (sidebar) sidebar.style.display = 'none';
  if (creatorBar) creatorBar.style.display = 'none';
}

function checkPassword() {
  const input = document.getElementById('passwordInput');
  const errorEl = document.getElementById('passwordError');
  const password = input.value;
  
  if (password === getCreatorPassword()) {
    sessionStorage.setItem('creator_auth', '1');
    errorEl.classList.remove('show');
    showWorkspace();
    initWorkspace();
  } else {
    errorEl.classList.add('show');
    input.value = '';
    input.focus();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        checkPassword();
      }
    });
    passwordInput.focus();
  }
  
  if (isCreatorAuth()) {
    showWorkspace();
    initWorkspace();
  } else {
    hideWorkspace();
  }
});

// ========== GitHub Token 配置 ==========

function checkGithubToken() {
  const token = getGithubToken();
  if (!token) {
    return false;
  }
  return true;
}

function showTokenSetup() {
  const modal = document.createElement('div');
  modal.id = 'tokenModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  `;
  modal.innerHTML = `
    <div style="background: var(--bg-color); padding: 32px; border-radius: 16px; max-width: 480px; width: 90%;">
      <h2 style="margin-bottom: 16px;">⚙️ 配置 GitHub Token</h2>
      <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 14px;">
        为了将内容保存到 GitHub 仓库，需要配置 GitHub Personal Access Token。
      </p>
      <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 13px; background: var(--bg-light); padding: 12px; border-radius: 8px;">
        <strong>创建 Token 步骤：</strong><br>
        1. 访问 GitHub → Settings → Developer settings<br>
        2. Personal access tokens → Generate new token<br>
        3. 勾选 <code>repo</code> 权限<br>
        4. 生成并复制 Token
      </p>
      <input type="password" id="tokenInput" placeholder="粘贴 GitHub Token..." 
        style="width: 100%; padding: 14px 16px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--bg-color); color: var(--text-color); margin-bottom: 16px; box-sizing: border-box;">
      <div style="display: flex; gap: 12px;">
        <button onclick="saveGithubToken()" style="flex: 1; padding: 12px; background: var(--creator-primary-solid); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">保存 Token</button>
        <button onclick="closeTokenModal()" style="flex: 1; padding: 12px; background: var(--bg-light); color: var(--text-color); border: none; border-radius: 8px; cursor: pointer;">取消</button>
      </div>
      <p id="tokenError" style="color: #dc3545; font-size: 13px; margin-top: 12px; display: none;"></p>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeTokenModal();
  });
}

function closeTokenModal() {
  const modal = document.getElementById('tokenModal');
  if (modal) modal.remove();
}

async function saveGithubToken() {
  const token = document.getElementById('tokenInput').value.trim();
  if (!token) {
    showTokenError('请输入 Token');
    return;
  }

  // 先保存 Token，再验证
  showLoading('正在验证 Token...');
  setGithubToken(token);
  try {
    const testResult = await githubApi('GET', '/user');
    hideLoading();
    closeTokenModal();
    showToast('✅ Token 配置成功！');
    
    // 重新加载数据
    clearCache();
    await refreshAllData();
  } catch (e) {
    // 验证失败，清除 Token
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    hideLoading();
    showTokenError('Token 无效: ' + e.message);
  }
}

function showTokenError(msg) {
  const errorEl = document.getElementById('tokenError');
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
}

// ========== 初始化工作台 ==========

async function initWorkspace() {
  // 从URL参数获取板块类型
  const urlParams = new URLSearchParams(window.location.search);
  const preType = urlParams.get('type');
  if (preType && TYPE_CONFIG[preType]) {
    currentType = preType;
  }

  // 检查 GitHub Token
  if (!checkGithubToken()) {
    setTimeout(() => {
      showTokenSetup();
    }, 300);
  }

  // 初始化UI
  initQuickCards();
  initTagSelect();
  initUploadTabs();
  initUploadAreas();
  initForm();
  initManageTabs();
  initSidebarActions();

  // 设置初始选中板块
  selectType(currentType);

  // 加载数据
  await refreshAllData();
  updateCounts();
  loadManageList('all');
}

// 刷新所有数据
async function refreshAllData() {
  showLoading('正在加载数据...');
  try {
    const content = await fetchContentJson();
    // 更新缓存
    Object.keys(content).forEach(key => {
      if (key !== 'lastUpdated') {
        saveAllData(key, content[key]);
      }
    });
    updateCounts();
    loadManageList(getCurrentFilter());
  } catch (e) {
    console.error('加载数据失败:', e);
    showToast('⚠️ 数据加载失败，请检查网络和 Token 配置');
  }
  hideLoading();
}

// ========== 修改密码 ==========

function changePassword() {
  const oldPasswordInput = document.getElementById('oldPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const statusEl = document.getElementById('passwordStatus');
  
  const oldPassword = oldPasswordInput.value;
  const newPassword = newPasswordInput.value;
  
  if (oldPassword && oldPassword !== getCreatorPassword()) {
    statusEl.className = 'settings-status error';
    statusEl.textContent = '❌ 旧密码错误';
    return;
  }
  
  if (!newPassword) {
    statusEl.className = 'settings-status error';
    statusEl.textContent = '❌ 请输入新密码';
    return;
  }
  
  if (newPassword.length < 4) {
    statusEl.className = 'settings-status error';
    statusEl.textContent = '❌ 密码至少4位';
    return;
  }
  
  localStorage.setItem('creator_password', newPassword);
  
  statusEl.className = 'settings-status success';
  statusEl.textContent = '✅ 密码修改成功';
  
  oldPasswordInput.value = '';
  newPasswordInput.value = '';
  
  setTimeout(() => {
    statusEl.className = 'settings-status';
  }, 3000);
}

function scrollToSettings() {
  const settingsSection = document.getElementById('settingsSection');
  if (settingsSection) {
    settingsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// ========== 原有代码（部分保留）==========

const TYPE_CONFIG = {
  lectures: { icon: '📖', name: '讲座', unit: '篇' },
  videos: { icon: '🎬', name: '视频', unit: '部' },
  audios: { icon: '🎵', name: '音频', unit: '条' },
  images: { icon: '🖼️', name: '图片', unit: '张' },
  literature: { icon: '📚', name: '经典文献', unit: '篇' },
  activities: { icon: '🎯', name: '活动', unit: '场' },
  downloads: { icon: '📥', name: '下载资料', unit: '份' }
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

let currentType = 'lectures';
let editingItem = null;
let imagePreviewData = [];

function initQuickCards() {
  const cards = document.querySelectorAll('.quick-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      selectType(type);
    });
  });
}

function initTagSelect() {
  const tags = document.querySelectorAll('.quick-tag');
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tags.forEach(t => t.classList.remove('selected'));
      tag.classList.add('selected');
      document.getElementById('inputCategory').value = tag.dataset.tag;
    });
  });
}

function initUploadTabs() {
  document.querySelectorAll('#videoGroup .upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchUploadTab('video', tab.dataset.tab);
    });
  });

  document.querySelectorAll('#audioGroup .upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchUploadTab('audio', tab.dataset.tab);
    });
  });

  document.querySelectorAll('#imageGroup .upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchUploadTab('image', tab.dataset.tab);
    });
  });
}

function switchUploadTab(type, tabName) {
  const group = document.getElementById(`${type}Group`);
  if (!group) return;

  group.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
  group.querySelectorAll('.upload-panel').forEach(p => p.classList.remove('active'));

  const targetTab = group.querySelector(`[data-tab="${tabName}"]`);
  if (targetTab) targetTab.classList.add('active');

  let targetPanelId = '';
  if (type === 'video') {
    targetPanelId = tabName === 'videoEmbed' ? 'videoEmbed' : 'videoUpload';
  } else if (type === 'audio') {
    targetPanelId = tabName === 'audioEmbed' ? 'audioEmbed' : 'audioUpload';
  } else if (type === 'image') {
    targetPanelId = tabName === 'imageEmbed' ? 'imageEmbed' : 'imageUpload';
  }

  const targetPanel = document.getElementById(targetPanelId);
  if (targetPanel) targetPanel.classList.add('active');
}

function initUploadAreas() {
  // 视频预览
  initDropZone('videoDropZone', 'videoFileInput', (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewVideoPlayer').src = e.target.result;
      document.getElementById('videoPreview').style.display = 'block';
      document.getElementById('videoDropZone').style.display = 'none';
      document.getElementById('videoFileName').textContent = file.name;
    };
    reader.readAsDataURL(file);
  });

  // 音频预览
  initDropZone('audioDropZone', 'audioFileInput', (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewAudioPlayer').src = e.target.result;
      document.getElementById('audioPreview').style.display = 'block';
      document.getElementById('audioDropZone').style.display = 'none';
      document.getElementById('audioFileName').textContent = file.name;
    };
    reader.readAsDataURL(file);
  });

  // 图片预览
  initDropZone('imageDropZone', 'imageFileInput', (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviewData.push(e.target.result);
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });

  // 点击上传
  document.getElementById('videoDropZone')?.addEventListener('click', () => {
    document.getElementById('videoFileInput').click();
  });

  document.getElementById('audioDropZone')?.addEventListener('click', () => {
    document.getElementById('audioFileInput').click();
  });

  document.getElementById('imageDropZone')?.addEventListener('click', () => {
    document.getElementById('imageFileInput').click();
  });

  // 文件选择
  document.getElementById('videoFileInput')?.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('previewVideoPlayer').src = ev.target.result;
        document.getElementById('videoPreview').style.display = 'block';
        document.getElementById('videoDropZone').style.display = 'none';
        document.getElementById('videoFileName').textContent = file.name;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('audioFileInput')?.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('previewAudioPlayer').src = ev.target.result;
        document.getElementById('audioPreview').style.display = 'block';
        document.getElementById('audioDropZone').style.display = 'none';
        document.getElementById('audioFileName').textContent = file.name;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('imageFileInput')?.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        imagePreviewData.push(ev.target.result);
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  });
}

function initDropZone(dropZoneId, inputId, onFile) {
  const dropZone = document.getElementById(dropZoneId);
  if (!dropZone) return;

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFile(files[0]);
    }
  });
}

function renderImagePreviews() {
  const grid = document.getElementById('imagePreviewGrid');
  if (!grid) return;

  if (imagePreviewData.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = imagePreviewData.map((data, index) => `
    <div class="image-preview-item">
      <img src="${data}" alt="预览图${index + 1}">
      <button class="image-preview-remove" onclick="removeImage(${index})">×</button>
    </div>
  `).join('');
}

function removeImage(index) {
  imagePreviewData.splice(index, 1);
  renderImagePreviews();
}

function clearVideoFile() {
  document.getElementById('videoFileInput').value = '';
  document.getElementById('videoPreview').style.display = 'none';
  document.getElementById('previewVideoPlayer').src = '';
  document.getElementById('videoDropZone').style.display = 'block';
}

function clearAudioFile() {
  document.getElementById('audioFileInput').value = '';
  document.getElementById('audioPreview').style.display = 'none';
  document.getElementById('previewAudioPlayer').src = '';
  document.getElementById('audioDropZone').style.display = 'block';
}

function initForm() {
  const form = document.getElementById('publishForm');
  if (!form) return;

  const contentArea = document.getElementById('inputContent');
  if (contentArea) {
    contentArea.addEventListener('paste', async (e) => {
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          
          // 检查是否有 GitHub Token
          if (!checkGithubToken()) {
            showToast('⚠️ 请先配置 GitHub Token 才能上传图片');
            return;
          }
          
          try {
            const url = await uploadInlineImage(file);
            const imgTag = `<img src="${url}" alt="粘贴图片" style="max-width:100%;">`;
            const start = contentArea.selectionStart;
            const end = contentArea.selectionEnd;
            const text = contentArea.value;
            contentArea.value = text.substring(0, start) + imgTag + text.substring(end);
          } catch (err) {
            showToast('❌ 图片上传失败');
            console.error(err);
          }
          break;
        }
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm();
  });
}

function selectType(type) {
  if (!TYPE_CONFIG[type]) return;

  currentType = type;

  document.querySelectorAll('.quick-card').forEach(card => {
    card.classList.toggle('active', card.dataset.type === type);
  });

  document.getElementById('currentTypeIcon').textContent = TYPE_CONFIG[type].icon;
  document.getElementById('currentTypeName').textContent = `发布${TYPE_CONFIG[type].name}`;

  document.getElementById('videoGroup').style.display = type === 'videos' ? 'block' : 'none';
  document.getElementById('audioGroup').style.display = type === 'audios' ? 'block' : 'none';
  document.getElementById('imageGroup').style.display = type === 'images' ? 'block' : 'none';
  document.getElementById('downloadGroup').style.display = type === 'downloads' ? 'block' : 'none';

  resetForm();
  document.getElementById('publishSection').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  const form = document.getElementById('publishForm');
  if (form) form.reset();

  document.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('selected'));

  clearVideoFile();
  clearAudioFile();
  imagePreviewData = [];
  renderImagePreviews();

  ['video', 'audio', 'image'].forEach(type => {
    const group = document.getElementById(`${type}Group`);
    if (group) {
      group.querySelectorAll('.upload-tab').forEach((t, i) => {
        t.classList.toggle('active', i === 0);
      });
      group.querySelectorAll('.upload-panel').forEach((p, i) => {
        p.classList.toggle('active', i === 0);
      });
    }
  });

  editingItem = null;
  document.getElementById('editId').value = '';
  document.getElementById('submitBtn').textContent = '发布';
}

// ========== 核心发布逻辑（使用 GitHub API）==========

async function submitForm() {
  // 检查 Token
  if (!checkGithubToken()) {
    showToast('⚠️ 请先配置 GitHub Token');
    showTokenSetup();
    return;
  }

  const title = document.getElementById('inputTitle').value.trim();
  const content = document.getElementById('inputContent').value.trim();
  const category = document.getElementById('inputCategory').value.trim();
  const summary = document.getElementById('inputSummary').value.trim();

  if (!title || !content) {
    showToast('❌ 请填写标题和内容');
    return;
  }

  showLoading('正在处理...');

  try {
    let videoUrl = '';
    let audioUrl = '';
    let imageUrl = '';
    let downloadUrl = '';

    // 处理视频
    if (currentType === 'videos') {
      const activePanel = document.querySelector('#videoGroup .upload-panel.active');
      if (activePanel.id === 'videoEmbed') {
        videoUrl = document.getElementById('inputVideoUrl').value.trim();
      } else {
        // 本地视频文件 - 需要上传到 GitHub
        const videoInput = document.getElementById('videoFileInput');
        if (videoInput.files[0]) {
          const file = videoInput.files[0];
          
          // 检查文件大小（GitHub API 限制 100MB）
          if (file.size > 100 * 1024 * 1024) {
            hideLoading();
            showToast('❌ 视频文件不能超过 100MB');
            return;
          }
          
          videoUrl = await uploadMedia(file, 'media/videos');
        }
      }
    }

    // 处理音频
    if (currentType === 'audios') {
      const activePanel = document.querySelector('#audioGroup .upload-panel.active');
      if (activePanel.id === 'audioEmbed') {
        audioUrl = document.getElementById('inputAudioUrl').value.trim();
      } else {
        const audioInput = document.getElementById('audioFileInput');
        if (audioInput.files[0]) {
          const file = audioInput.files[0];
          if (file.size > 100 * 1024 * 1024) {
            hideLoading();
            showToast('❌ 音频文件不能超过 100MB');
            return;
          }
          audioUrl = await uploadMedia(file, 'media/audios');
        }
      }
    }

    // 处理图片
    if (currentType === 'images') {
      const activePanel = document.querySelector('#imageGroup .upload-panel.active');
      if (activePanel.id === 'imageEmbed') {
        imageUrl = document.getElementById('inputImageUrl').value.trim();
      } else if (imagePreviewData.length > 0) {
        // 多图上传
        const urls = [];
        for (let i = 0; i < imagePreviewData.length; i++) {
          showLoading(`正在上传图片 ${i + 1}/${imagePreviewData.length}...`);
          // 从 data URL 提取文件
          const base64 = imagePreviewData[i];
          const response = await fetch(base64);
          const blob = await response.blob();
          const file = new File([blob], `image_${i}.jpg`, { type: blob.type });
          const url = await uploadMedia(file, 'media/images');
          urls.push(url);
        }
        // 多图用特殊格式存储
        imageUrl = urls.join('|||');
      }
    }

    // 处理下载
    if (currentType === 'downloads') {
      downloadUrl = document.getElementById('inputDownloadUrl').value.trim();
    }

    const item = {
      title,
      date: new Date().toISOString().split('T')[0],
      category,
      summary,
      content,
      videoUrl,
      audioUrl,
      imageUrl,
      downloadUrl
    };

    // 获取当前内容
    const contentJson = await fetchContentJson();
    
    // 判断是新增还是编辑
    const editId = document.getElementById('editId').value;
    if (editId) {
      // 编辑现有项
      item.id = editId;
      const index = contentJson[currentType].findIndex(i => i.id === editId);
      if (index !== -1) {
        contentJson[currentType][index] = item;
      }
    } else {
      // 新增
      item.id = currentType + '_' + Date.now();
      contentJson[currentType].unshift(item);
    }
    
    // 更新时间戳
    contentJson.lastUpdated = new Date().toISOString();

    // 保存到 GitHub
    const action = editId ? '更新' : '发布';
    await updateContentJson(contentJson, `${action}${TYPE_CONFIG[currentType].name}: ${title}`);

    hideLoading();
    showToast(`✅ ${TYPE_CONFIG[currentType].name}${action}成功！`);
    
    resetForm();
    updateCounts();
    loadManageList(getCurrentFilter());
    
  } catch (e) {
    hideLoading();
    console.error('发布失败:', e);
    showToast('❌ 发布失败: ' + e.message);
  }
}

// ========== 管理功能 ==========

function updateCounts() {
  let total = 0;

  ALL_TYPES.forEach(type => {
    const data = getAllData(type);
    const count = data.length;
    total += count;

    const countEl = document.getElementById(`count-${type}`);
    if (countEl) {
      countEl.textContent = `${count} ${TYPE_CONFIG[type].unit}`;
    }

    const tabCountEl = document.getElementById(`tab-count-${type}`);
    if (tabCountEl) {
      tabCountEl.textContent = count;
    }
  });

  const allCountEl = document.getElementById('count-all');
  if (allCountEl) {
    allCountEl.textContent = total;
  }
  const tabAllCountEl = document.getElementById('tab-count-all');
  if (tabAllCountEl) {
    tabAllCountEl.textContent = total;
  }
}

function initManageTabs() {
  const tabs = document.querySelectorAll('.manage-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadManageList(tab.dataset.type);
    });
  });
}

function getCurrentFilter() {
  const activeTab = document.querySelector('.manage-tab.active');
  return activeTab ? activeTab.dataset.type : 'all';
}

function loadManageList(filterType) {
  const container = document.getElementById('manageList');
  if (!container) return;

  let items = [];

  if (filterType === 'all') {
    ALL_TYPES.forEach(type => {
      const data = getAllData(type);
      data.forEach(item => {
        items.push({ ...item, _type: type });
      });
    });
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    const data = getAllData(filterType);
    items = data.map(item => ({ ...item, _type: filterType }));
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state-creator">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">暂无内容</div>
        <div class="empty-state-hint">点击上方卡片开始发布内容吧</div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="manage-item">
      <div class="manage-item-icon">${TYPE_CONFIG[item._type]?.icon || '📄'}</div>
      <div class="manage-item-info">
        <div class="manage-item-title">${escapeHtml(item.title)}</div>
        <div class="manage-item-meta">
          <span class="manage-item-type">${TYPE_CONFIG[item._type]?.name || item._type}</span>
          <span>${item.date}</span>
          ${item.category ? `<span>· ${escapeHtml(item.category)}</span>` : ''}
        </div>
      </div>
      <div class="manage-item-actions">
        <button class="btn-item-edit" onclick="editItem('${item._type}', '${item.id}')">编辑</button>
        <button class="btn-item-delete" onclick="deleteItemConfirm('${item._type}', '${item.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

async function editItem(type, id) {
  const item = getItemById(type, id);
  if (!item) {
    showToast('内容不存在');
    return;
  }

  editingItem = { type, id };

  document.getElementById('editId').value = id;
  document.getElementById('inputTitle').value = item.title;
  document.getElementById('inputCategory').value = item.category || '';
  document.getElementById('inputContent').value = item.content || '';
  document.getElementById('inputSummary').value = item.summary || '';
  
  // 切换到对应板块
  selectType(type);
  
  // 滚动到发布区
  document.getElementById('publishSection').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('submitBtn').textContent = '更新';
  
  showToast('📝 已加载内容，修改后点击"更新"保存');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
  editingItem = null;
}

async function submitEdit() {
  if (!editingItem) {
    showToast('请先选择要编辑的内容');
    return;
  }

  const updates = {
    title: document.getElementById('editTitle').value.trim(),
    category: document.getElementById('editCategory').value.trim(),
    content: document.getElementById('editContent').value.trim(),
    summary: document.getElementById('editSummary').value.trim(),
    date: document.getElementById('editDate').value
  };

  if (!updates.title || !updates.content) {
    showToast('请填写标题和内容');
    return;
  }

  showLoading('正在更新...');
  
  try {
    const contentJson = await fetchContentJson();
    const index = contentJson[editingItem.type].findIndex(i => i.id === editingItem.id);
    
    if (index !== -1) {
      updates.id = editingItem.id;
      contentJson[editingItem.type][index] = { 
        ...contentJson[editingItem.type][index],
        ...updates
      };
      contentJson.lastUpdated = new Date().toISOString();
      
      await updateContentJson(contentJson, `更新${TYPE_CONFIG[editingItem.type].name}: ${updates.title}`);
      
      hideLoading();
      showToast('✅ 更新成功！');
      closeEditModal();
      updateCounts();
      loadManageList(getCurrentFilter());
    }
  } catch (e) {
    hideLoading();
    showToast('❌ 更新失败: ' + e.message);
  }
}

async function deleteItemConfirm(type, id) {
  if (!confirm('确定要删除这条内容吗？')) return;

  if (!checkGithubToken()) {
    showToast('⚠️ 请先配置 GitHub Token');
    return;
  }

  showLoading('正在删除...');
  
  try {
    const contentJson = await fetchContentJson();
    const item = contentJson[type].find(i => i.id === id);
    const title = item ? item.title : '未知';
    
    contentJson[type] = contentJson[type].filter(i => i.id !== id);
    contentJson.lastUpdated = new Date().toISOString();
    
    await updateContentJson(contentJson, `删除${TYPE_CONFIG[type].name}: ${title}`);
    
    hideLoading();
    showToast('✅ 删除成功');
    updateCounts();
    loadManageList(getCurrentFilter());
  } catch (e) {
    hideLoading();
    showToast('❌ 删除失败: ' + e.message);
  }
}

// ========== 预览功能 ==========

function previewContent() {
  const title = document.getElementById('inputTitle').value.trim();
  const content = document.getElementById('inputContent').value.trim();
  const category = document.getElementById('inputCategory').value.trim();

  if (!title || !content) {
    showToast('请先填写标题和内容');
    return;
  }

  document.getElementById('previewType').textContent = TYPE_CONFIG[currentType].name;
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewMeta').textContent = [
    TYPE_CONFIG[currentType].icon + ' ' + TYPE_CONFIG[currentType].name,
    new Date().toLocaleDateString('zh-CN'),
    category || '未分类'
  ].join(' · ');

  let processedContent = content;
  if (currentType === 'images' && imagePreviewData.length > 0) {
    processedContent = imagePreviewData.map(src => 
      `<img src="${src}" alt="" style="max-width:100%;margin:16px 0;border-radius:8px;">`
    ).join('');
  }

  document.getElementById('previewBody').innerHTML = processedContent;
  document.getElementById('previewModal').classList.add('show');
}

function closePreviewModal() {
  document.getElementById('previewModal').classList.remove('show');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== 辅助功能 ==========

function initSidebarActions() {
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitEdit();
    });
  }

  document.getElementById('editModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
      closeEditModal();
    }
  });

  document.getElementById('previewModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'previewModal') {
      closePreviewModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closePreviewModal();
      closeTokenModal();
    }
  });
}

function scrollToPublish() {
  document.getElementById('publishSection')?.scrollIntoView({ behavior: 'smooth' });
}

function scrollToManage() {
  document.getElementById('manageSection')?.scrollIntoView({ behavior: 'smooth' });
}

// Toast 提示
function showToast(message) {
  let toast = document.getElementById('toast-message');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 99999;
      text-align: center;
      max-width: 90%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

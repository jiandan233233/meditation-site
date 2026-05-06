/**
 * 创作者工作台脚本
 * 重新设计的更便捷、直观的后台管理入口
 */

// 板块配置
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

// 当前选中的板块
let currentType = 'lectures';

// 当前编辑的内容
let editingItem = null;

// 图片预览数据
let imagePreviewData = [];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 从URL参数获取板块类型
  const urlParams = new URLSearchParams(window.location.search);
  const preType = urlParams.get('type');
  if (preType && TYPE_CONFIG[preType]) {
    currentType = preType;
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

  // 更新计数
  updateCounts();
  loadManageList('all');
});

// 初始化快捷卡片
function initQuickCards() {
  const cards = document.querySelectorAll('.quick-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      selectType(type);
    });
  });
}

// 初始化标签选择
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

// 初始化上传Tab切换
function initUploadTabs() {
  // 视频Tab
  document.querySelectorAll('#videoGroup .upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchUploadTab('video', tab.dataset.tab);
    });
  });

  // 音频Tab
  document.querySelectorAll('#audioGroup .upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchUploadTab('audio', tab.dataset.tab);
    });
  });

  // 图片Tab
  document.querySelectorAll('#imageGroup .upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchUploadTab('image', tab.dataset.tab);
    });
  });
}

// 切换上传Tab
function switchUploadTab(type, tabName) {
  const group = document.getElementById(`${type}Group`);
  if (!group) return;

  group.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
  group.querySelectorAll('.upload-panel').forEach(p => p.classList.remove('active'));

  // 找到对应的tab和panel
  const targetTab = group.querySelector(`[data-tab="${tabName}"]`);
  if (targetTab) targetTab.classList.add('active');

  // 根据tab类型找到对应panel
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

// 初始化拖拽上传区域
function initUploadAreas() {
  // 视频
  initDropZone('videoDropZone', 'videoFileInput', (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewVideoPlayer').src = e.target.result;
      document.getElementById('videoPreview').style.display = 'block';
      document.getElementById('videoDropZone').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  // 音频
  initDropZone('audioDropZone', 'audioFileInput', (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewAudioPlayer').src = e.target.result;
      document.getElementById('audioPreview').style.display = 'block';
      document.getElementById('audioDropZone').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  // 图片
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

// 初始化拖拽区域
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

// 渲染图片预览
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

// 移除图片
function removeImage(index) {
  imagePreviewData.splice(index, 1);
  renderImagePreviews();
}

// 清空视频
function clearVideoFile() {
  document.getElementById('videoFileInput').value = '';
  document.getElementById('videoPreview').style.display = 'none';
  document.getElementById('previewVideoPlayer').src = '';
  document.getElementById('videoDropZone').style.display = 'block';
}

// 清空音频
function clearAudioFile() {
  document.getElementById('audioFileInput').value = '';
  document.getElementById('audioPreview').style.display = 'none';
  document.getElementById('previewAudioPlayer').src = '';
  document.getElementById('audioDropZone').style.display = 'block';
}

// 初始化表单
function initForm() {
  const form = document.getElementById('publishForm');
  if (!form) return;

  // 设置默认日期
  const date = new Date().toISOString().split('T')[0];

  // 内容区域粘贴图片
  const contentArea = document.getElementById('inputContent');
  if (contentArea) {
    contentArea.addEventListener('paste', (e) => {
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (ev) => {
            const imgTag = `<img src="${ev.target.result}" alt="粘贴图片" style="max-width:100%;">`;
            const start = contentArea.selectionStart;
            const end = contentArea.selectionEnd;
            const text = contentArea.value;
            contentArea.value = text.substring(0, start) + imgTag + text.substring(end);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    });
  }

  // 表单提交
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm();
  });
}

// 选中板块
function selectType(type) {
  if (!TYPE_CONFIG[type]) return;

  currentType = type;

  // 更新卡片状态
  document.querySelectorAll('.quick-card').forEach(card => {
    card.classList.toggle('active', card.dataset.type === type);
  });

  // 更新发布区标题
  document.getElementById('currentTypeIcon').textContent = TYPE_CONFIG[type].icon;
  document.getElementById('currentTypeName').textContent = `发布${TYPE_CONFIG[type].name}`;

  // 显示/隐藏板块特有字段
  document.getElementById('videoGroup').style.display = type === 'videos' ? 'block' : 'none';
  document.getElementById('audioGroup').style.display = type === 'audios' ? 'block' : 'none';
  document.getElementById('imageGroup').style.display = type === 'images' ? 'block' : 'none';
  document.getElementById('downloadGroup').style.display = type === 'downloads' ? 'block' : 'none';

  // 重置表单
  resetForm();

  // 滚动到发布区
  document.getElementById('publishSection').scrollIntoView({ behavior: 'smooth' });
}

// 重置表单
function resetForm() {
  const form = document.getElementById('publishForm');
  if (form) form.reset();

  // 重置标签
  document.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('selected'));

  // 重置上传区
  clearVideoFile();
  clearAudioFile();
  imagePreviewData = [];
  renderImagePreviews();

  // 重置Tab
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
}

// 提交表单
async function submitForm() {
  const title = document.getElementById('inputTitle').value.trim();
  const content = document.getElementById('inputContent').value.trim();
  const category = document.getElementById('inputCategory').value.trim();
  const summary = document.getElementById('inputSummary').value.trim();

  if (!title || !content) {
    alert('请填写标题和内容');
    return;
  }

  // 获取板块特有数据
  let videoUrl = '';
  let audioUrl = '';
  let imageUrl = '';
  let downloadUrl = '';

  if (currentType === 'videos') {
    const activePanel = document.querySelector('#videoGroup .upload-panel.active');
    if (activePanel.id === 'videoEmbed') {
      videoUrl = document.getElementById('inputVideoUrl').value.trim();
    } else {
      // 本地视频 - 从预览播放器获取
      videoUrl = document.getElementById('previewVideoPlayer').src;
      if (videoUrl && videoUrl.startsWith('blob:')) {
        // 需要转换为base64
        videoUrl = await fileToBase64FromSrc('video');
      }
    }
  }

  if (currentType === 'audios') {
    const activePanel = document.querySelector('#audioGroup .upload-panel.active');
    if (activePanel.id === 'audioEmbed') {
      audioUrl = document.getElementById('inputAudioUrl').value.trim();
    } else {
      audioUrl = document.getElementById('previewAudioPlayer').src;
      if (audioUrl && audioUrl.startsWith('blob:')) {
        audioUrl = await fileToBase64FromSrc('audio');
      }
    }
  }

  if (currentType === 'images') {
    const activePanel = document.querySelector('#imageGroup .upload-panel.active');
    if (activePanel.id === 'imageEmbed') {
      imageUrl = document.getElementById('inputImageUrl').value.trim();
    } else if (imagePreviewData.length > 0) {
      // 多图合并为一个HTML
      imageUrl = imagePreviewData.map(src => `<img src="${src}" alt="" style="max-width:100%;margin:8px 0;">`).join('');
    }
  }

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

  if (addItem(currentType, item)) {
    alert(`${TYPE_CONFIG[currentType].name}发布成功！`);
    resetForm();
    updateCounts();
    loadManageList(getCurrentFilter());
  } else {
    alert('发布失败，请重试');
  }
}

// 从blob src转换为base64
function fileToBase64FromSrc(type) {
  return new Promise((resolve) => {
    const player = document.getElementById(type === 'video' ? 'previewVideoPlayer' : 'previewAudioPlayer');
    // 使用canvas来获取数据
    fetch(player.src)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => resolve(''));
  });
}

// 文件转Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 更新所有计数
function updateCounts() {
  let total = 0;

  ALL_TYPES.forEach(type => {
    const data = getAllData(type);
    const count = data.length;
    total += count;

    // 更新卡片计数
    const countEl = document.getElementById(`count-${type}`);
    if (countEl) {
      countEl.textContent = `${count} ${TYPE_CONFIG[type].unit}`;
    }

    // 更新管理tab计数
    const tabCountEl = document.getElementById(`tab-count-${type}`);
    if (tabCountEl) {
      tabCountEl.textContent = count;
    }
  });

  // 更新全部计数
  const allCountEl = document.getElementById('count-all');
  if (allCountEl) {
    allCountEl.textContent = total;
  }
  const tabAllCountEl = document.getElementById('tab-count-all');
  if (tabAllCountEl) {
    tabAllCountEl.textContent = total;
  }
}

// 初始化管理Tab
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

// 获取当前筛选类型
function getCurrentFilter() {
  const activeTab = document.querySelector('.manage-tab.active');
  return activeTab ? activeTab.dataset.type : 'all';
}

// 加载管理列表
function loadManageList(filterType) {
  const container = document.getElementById('manageList');
  if (!container) return;

  let items = [];

  if (filterType === 'all') {
    // 收集所有类型的数据
    ALL_TYPES.forEach(type => {
      const data = getAllData(type);
      data.forEach(item => {
        items.push({ ...item, _type: type });
      });
    });
    // 按日期排序
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

// 编辑内容
function editItem(type, id) {
  const item = getItemById(type, id);
  if (!item) {
    alert('内容不存在');
    return;
  }

  editingItem = { type, id };

  // 填充表单
  document.getElementById('editId').value = id;
  document.getElementById('editType').value = type;
  document.getElementById('editTitle').value = item.title;
  document.getElementById('editCategory').value = item.category || '';
  document.getElementById('editContent').value = item.content || '';
  document.getElementById('editSummary').value = item.summary || '';
  document.getElementById('editDate').value = item.date || '';

  // 显示弹窗
  document.getElementById('editModal').classList.add('show');
}

// 关闭编辑弹窗
function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
  editingItem = null;
}

// 提交编辑
function submitEdit() {
  if (!editingItem) return;

  const updates = {
    title: document.getElementById('editTitle').value.trim(),
    category: document.getElementById('editCategory').value.trim(),
    content: document.getElementById('editContent').value.trim(),
    summary: document.getElementById('editSummary').value.trim(),
    date: document.getElementById('editDate').value
  };

  if (!updates.title || !updates.content) {
    alert('请填写标题和内容');
    return;
  }

  if (updateItem(editingItem.type, editingItem.id, updates)) {
    alert('更新成功！');
    closeEditModal();
    updateCounts();
    loadManageList(getCurrentFilter());
  } else {
    alert('更新失败，请重试');
  }
}

// 删除确认
function deleteItemConfirm(type, id) {
  if (!confirm('确定要删除这条内容吗？')) return;

  if (deleteItem(type, id)) {
    updateCounts();
    loadManageList(getCurrentFilter());
  } else {
    alert('删除失败，请重试');
  }
}

// 预览内容
function previewContent() {
  const title = document.getElementById('inputTitle').value.trim();
  const content = document.getElementById('inputContent').value.trim();
  const category = document.getElementById('inputCategory').value.trim();

  if (!title || !content) {
    alert('请先填写标题和内容');
    return;
  }

  document.getElementById('previewType').textContent = TYPE_CONFIG[currentType].name;
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewMeta').textContent = [
    TYPE_CONFIG[currentType].icon + ' ' + TYPE_CONFIG[currentType].name,
    new Date().toLocaleDateString('zh-CN'),
    category || '未分类'
  ].join(' · ');

  // 处理内容中的图片
  let processedContent = content;
  if (currentType === 'images' && imagePreviewData.length > 0) {
    processedContent = imagePreviewData.map(src => 
      `<img src="${src}" alt="" style="max-width:100%;margin:16px 0;border-radius:8px;">`
    ).join('');
  }

  document.getElementById('previewBody').innerHTML = processedContent;
  document.getElementById('previewModal').classList.add('show');
}

// 关闭预览弹窗
function closePreviewModal() {
  document.getElementById('previewModal').classList.remove('show');
}

// HTML转义
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 初始化侧边栏操作
function initSidebarActions() {
  // 编辑表单提交
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitEdit();
    });
  }

  // 点击背景关闭弹窗
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

  // ESC关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closePreviewModal();
    }
  });
}

// 滚动到发布区
function scrollToPublish() {
  document.getElementById('publishSection')?.scrollIntoView({ behavior: 'smooth' });
}

// 滚动到管理区
function scrollToManage() {
  document.getElementById('manageSection')?.scrollIntoView({ behavior: 'smooth' });
}

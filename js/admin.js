/**
 * 后台管理脚本
 */

document.addEventListener('DOMContentLoaded', function() {
  initAdminTabs();
  initPublishForm();
  loadAdminList();
});

// Tab切换
function initAdminTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === target) {
          panel.classList.add('active');
        }
      });
    });
  });
}

// 初始化发布表单
function initPublishForm() {
  const form = document.getElementById('publishForm');
  if (!form) return;

  // 设置默认日期
  const dateInput = form.querySelector('input[name="date"]');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // 分类标签输入
  const categoryInput = form.querySelector('input[name="category"]');

  // 内容编辑区 - 粘贴图片处理
  const contentTextarea = form.querySelector('textarea[name="content"]');
  if (contentTextarea) {
    contentTextarea.addEventListener('paste', function(e) {
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          convertImageToBase64(file, function(base64) {
            const imgTag = `<img src="${base64}" alt="粘贴图片" style="max-width:100%;">`;
            const start = contentTextarea.selectionStart;
            const end = contentTextarea.selectionEnd;
            const text = contentTextarea.value;
            contentTextarea.value = text.substring(0, start) + imgTag + text.substring(end);
            contentTextarea.selectionStart = contentTextarea.selectionEnd = start + imgTag.length;
          });
          break;
        }
      }
    });
  }

  // 表单提交
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitForm();
  });

  // 图片上传
  const imageInput = document.getElementById('coverImage');
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        convertImageToBase64(file, function(base64) {
          let preview = document.getElementById('coverPreview');
          if (!preview) {
            preview = document.createElement('div');
            preview.id = 'coverPreview';
            preview.style.marginTop = '10px';
            imageInput.parentNode.appendChild(preview);
          }
          preview.innerHTML = `<img src="${base64}" style="max-width:200px;max-height:150px;">`;
          let input = form.querySelector('input[name="coverImage"]');
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'coverImage';
            form.appendChild(input);
          }
          input.value = base64;
        });
      }
    });
  }
}

// 将图片转换为Base64
function convertImageToBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    callback(e.target.result);
  };
  reader.readAsDataURL(file);
}

// 提交表单
function submitForm() {
  const form = document.getElementById('publishForm');
  if (!form) return;

  const type = form.querySelector('select[name="type"]').value;
  const title = form.querySelector('input[name="title"]').value.trim();
  const date = form.querySelector('input[name="date"]').value;
  const category = form.querySelector('input[name="category"]').value.trim();
  const summary = form.querySelector('textarea[name="summary"]').value.trim();
  const content = form.querySelector('textarea[name="content"]').value.trim();
  const videoUrl = form.querySelector('input[name="videoUrl"]').value.trim();
  const downloadUrl = form.querySelector('input[name="downloadUrl"]').value.trim();
  const coverImage = form.querySelector('input[name="coverImage"]')?.value || '';

  if (!title || !content) {
    alert('请填写标题和内容');
    return;
  }

  const item = {
    title,
    date: date || new Date().toISOString().split('T')[0],
    category,
    summary,
    content,
    videoUrl,
    downloadUrl,
    coverImage
  };

  if (addItem(type, item)) {
    alert('发布成功！');
    form.reset();
    document.getElementById('coverPreview')?.remove();
    document.querySelector('input[name="date"]').value = new Date().toISOString().split('T')[0];
    loadAdminList();
  } else {
    alert('发布失败，请重试');
  }
}

// 加载管理列表
function loadAdminList() {
  const container = document.querySelector('.admin-list');
  if (!container) return;

  const types = ['lectures', 'videos', 'literature', 'activities', 'downloads'];
  const typeNames = {
    lectures: '讲座开示',
    videos: '视频专区',
    literature: '经典文献',
    activities: '各地活动',
    downloads: '下载资料'
  };

  let html = '';

  types.forEach(type => {
    const data = getAllData(type);
    if (data.length > 0) {
      html += `<div class="admin-section" style="margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:500;margin-bottom:12px;color:var(--text-muted);">${typeNames[type]}</h3>`;
      
      data.forEach(item => {
        html += `
          <div class="admin-item" data-id="${item.id}" data-type="${type}">
            <div class="admin-item-info">
              <div class="admin-item-title">${escapeHtml(item.title)}</div>
              <div class="admin-item-meta">${item.date} · ${item.category || '未分类'}</div>
            </div>
            <div class="admin-item-actions">
              <button class="btn-edit" onclick="editItem('${type}', '${item.id}')">编辑</button>
              <button class="btn-delete" onclick="deleteItemConfirm('${type}', '${item.id}')">删除</button>
            </div>
          </div>`;
      });
      
      html += '</div>';
    }
  });

  if (!html) {
    html = '<div class="empty-state">暂无内容，请发布新内容</div>';
  }

  container.innerHTML = html;
}

// 编辑内容
function editItem(type, id) {
  const item = getItemById(type, id);
  if (!item) {
    alert('内容不存在');
    return;
  }

  const modal = document.getElementById('editModal');
  if (!modal) return;

  const form = modal.querySelector('#editForm');
  form.querySelector('input[name="id"]').value = item.id;
  form.querySelector('input[name="type"]').value = type;
  form.querySelector('input[name="title"]').value = item.title;
  form.querySelector('input[name="date"]').value = item.date;
  form.querySelector('input[name="category"]').value = item.category || '';
  form.querySelector('textarea[name="summary"]').value = item.summary || '';
  form.querySelector('textarea[name="content"]').value = item.content || '';
  form.querySelector('input[name="videoUrl"]').value = item.videoUrl || '';
  form.querySelector('input[name="downloadUrl"]').value = item.downloadUrl || '';

  modal.classList.add('show');

  // 绑定关闭事件
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.onclick = function() {
    modal.classList.remove('show');
  };

  modal.onclick = function(e) {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  };

  // 绑定提交事件
  form.onsubmit = function(e) {
    e.preventDefault();
    submitEdit();
  };
}

// 提交编辑
function submitEdit() {
  const form = document.getElementById('editForm');
  const id = form.querySelector('input[name="id"]').value;
  const type = form.querySelector('input[name="type"]').value;

  const updates = {
    title: form.querySelector('input[name="title"]').value.trim(),
    date: form.querySelector('input[name="date"]').value,
    category: form.querySelector('input[name="category"]').value.trim(),
    summary: form.querySelector('textarea[name="summary"]').value.trim(),
    content: form.querySelector('textarea[name="content"]').value.trim(),
    videoUrl: form.querySelector('input[name="videoUrl"]').value.trim(),
    downloadUrl: form.querySelector('input[name="downloadUrl"]').value.trim()
  };

  if (!updates.title || !updates.content) {
    alert('请填写标题和内容');
    return;
  }

  if (updateItem(type, id, updates)) {
    alert('更新成功！');
    document.getElementById('editModal').classList.remove('show');
    loadAdminList();
  } else {
    alert('更新失败，请重试');
  }
}

// 删除确认
function deleteItemConfirm(type, id) {
  if (!confirm('确定要删除这条内容吗？')) return;
  
  if (deleteItem(type, id)) {
    loadAdminList();
  } else {
    alert('删除失败，请重试');
  }
}

// HTML转义
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

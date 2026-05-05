/**
 * SAHAJA YOGA - 创作者页面脚本
 * 纯静态，无需后端
 */

// ========== Toast ==========
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== Tab Switching ==========
function initTabs() {
  const tabs = document.querySelectorAll('.creator-tab');
  const panels = document.querySelectorAll('.creator-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const target = tab.dataset.tab;
      panels.forEach(p => {
        p.classList.remove('active');
        if (p.id === target + '-panel') {
          p.classList.add('active');
        }
      });
      
      if (target === 'manage') {
        loadManagedContent();
      }
    });
  });
}

// ========== Publish Type Toggle ==========
function initPublishTypes() {
  const btns = document.querySelectorAll('.publish-type-btn');
  const articleForm = document.getElementById('article-form');
  const videoForm = document.getElementById('video-form');
  
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (btn.dataset.type === 'article') {
        articleForm.style.display = 'block';
        videoForm.style.display = 'none';
      } else {
        articleForm.style.display = 'none';
        videoForm.style.display = 'block';
      }
    });
  });
}

// ========== Article Form ==========
function initArticleForm() {
  const form = document.getElementById('article-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = form.querySelector('[name="title"]').value.trim();
    const category = form.querySelector('[name="category"]').value;
    const cover = form.querySelector('[name="cover"]').value.trim();
    const content = form.querySelector('[name="content"]').value.trim();
    
    if (!title || !content) {
      showToast('请填写标题和内容');
      return;
    }
    
    const article = {
      id: Date.now(),
      title,
      category,
      cover: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23FFB6C1"/><stop offset="100%" style="stop-color:%23FF8C42"/></linearGradient></defs><rect fill="url(%23g1)" width="400" height="225"/><text x="200" y="112" text-anchor="middle" fill="white" font-size="14">冥想</text></svg>',
      content,
      date: new Date().toLocaleDateString('zh-CN')
    };
    
    const articles = JSON.parse(localStorage.getItem('sahaja_articles') || '[]');
    articles.unshift(article);
    localStorage.setItem('sahaja_articles', JSON.stringify(articles));
    
    form.reset();
    showToast('文章发布成功！');
  });
}

// ========== Video Form ==========
function initVideoForm() {
  const form = document.getElementById('video-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = form.querySelector('[name="title"]').value.trim();
    const category = form.querySelector('[name="category"]').value;
    const videoUrl = form.querySelector('[name="videoUrl"]').value.trim();
    const cover = form.querySelector('[name="cover"]').value.trim();
    const description = form.querySelector('[name="description"]').value.trim();
    
    if (!title || !videoUrl) {
      showToast('请填写标题和视频链接');
      return;
    }
    
    const video = {
      id: Date.now(),
      title,
      category,
      videoUrl,
      cover: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23FFB6C1"/><stop offset="100%" style="stop-color:%23FF8C42"/></linearGradient></defs><rect fill="url(%23g1)" width="400" height="225"/><text x="200" y="112" text-anchor="middle" fill="white" font-size="14">冥想</text></svg>',
      description,
      date: new Date().toLocaleDateString('zh-CN')
    };
    
    const videos = JSON.parse(localStorage.getItem('sahaja_videos') || '[]');
    videos.unshift(video);
    localStorage.setItem('sahaja_videos', JSON.stringify(videos));
    
    form.reset();
    showToast('视频发布成功！');
  });
}

// ========== Load Managed Content ==========
function loadManagedContent() {
  const list = document.getElementById('manage-list');
  if (!list) return;
  
  const articles = JSON.parse(localStorage.getItem('sahaja_articles') || '[]');
  const videos = JSON.parse(localStorage.getItem('sahaja_videos') || '[]');
  
  let html = '';
  
  if (articles.length === 0 && videos.length === 0) {
    html = `
      <div style="text-align:center;padding:60px 20px;color:#999;">
        <p style="font-size:1.1rem;margin-bottom:8px;">📭 暂无已发布内容</p>
        <p style="font-size:0.9rem;">点击上方"发布内容"开始创作</p>
      </div>
    `;
  } else {
    // Articles
    if (articles.length > 0) {
      html += '<h4 style="font-size:1rem;color:#666;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e0e0e0;">📝 文章列表</h4>';
      articles.forEach(article => {
        html += `
          <div class="manage-item" data-id="${article.id}" data-type="article">
            <div class="manage-thumb">
              <img src="${article.cover}" alt="" onerror="this.style.display='none'">
            </div>
            <div class="manage-info">
              <div class="manage-title">${escapeHtml(article.title)}</div>
              <div class="manage-meta">${article.category} · ${article.date}</div>
            </div>
            <div class="manage-actions">
              <button class="manage-btn delete-btn" onclick="deleteContent(${article.id}, 'article')">删除</button>
            </div>
          </div>
        `;
      });
    }
    
    // Videos
    if (videos.length > 0) {
      html += '<h4 style="font-size:1rem;color:#666;margin:20px 0 12px;padding-bottom:8px;border-bottom:1px solid #e0e0e0;">🎬 视频列表</h4>';
      videos.forEach(video => {
        html += `
          <div class="manage-item" data-id="${video.id}" data-type="video">
            <div class="manage-thumb">
              <img src="${video.cover}" alt="" onerror="this.style.display='none'">
            </div>
            <div class="manage-info">
              <div class="manage-title">${escapeHtml(video.title)}</div>
              <div class="manage-meta">${video.category} · ${video.date}</div>
            </div>
            <div class="manage-actions">
              <button class="manage-btn delete-btn" onclick="deleteContent(${video.id}, 'video')">删除</button>
            </div>
          </div>
        `;
      });
    }
  }
  
  list.innerHTML = html;
}

// ========== Delete Content ==========
function deleteContent(id, type) {
  if (!confirm('确定要删除这条内容吗？')) return;
  
  const key = type === 'article' ? 'sahaja_articles' : 'sahaja_videos';
  const items = JSON.parse(localStorage.getItem(key) || '[]');
  const filtered = items.filter(item => item.id !== id);
  localStorage.setItem(key, JSON.stringify(filtered));
  
  loadManagedContent();
  showToast('删除成功');
}

// Make deleteContent global
window.deleteContent = deleteContent;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPublishTypes();
  initArticleForm();
  initVideoForm();
});

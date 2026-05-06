/**
 * 公共脚本 - 导航、搜索、评论等功能
 */

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
  initThemeToggle();
  initMobileMenu();
});

/**
 * 导航栏初始化
 */
function initNavbar() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-item');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // 下拉菜单
  const dropdown = document.querySelector('.nav-item-dropdown');
  if (dropdown) {
    dropdown.addEventListener('click', function(e) {
      e.stopPropagation();
      const menu = this.querySelector('.dropdown-menu');
      if (menu) {
        menu.classList.toggle('show');
      }
    });

    document.addEventListener('click', function() {
      const menus = document.querySelectorAll('.dropdown-menu');
      menus.forEach(menu => menu.classList.remove('show'));
    });
  }
}

/**
 * 移动端菜单
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');
  
  if (menuToggle && navbarMenu) {
    menuToggle.addEventListener('click', function() {
      navbarMenu.classList.toggle('show');
    });
  }
}

/**
 * 主题切换
 */
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  }
}

/**
 * 获取URL参数
 */
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 渲染内容列表
 */
function renderContentList(items, container, showCategory = true, defaultType = null) {
  if (!container) return;
  
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无内容</div>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="content-item ${item.videoUrl ? 'has-video' : ''}" onclick="goToDetail('${item.id}', '${defaultType || getUrlParam('type') || getCurrentType()}')">
      ${showCategory && item.category ? `<div class="item-category">${item.category}</div>` : ''}
      <div class="item-header">
        ${showCategory && item.category ? '<span></span>' : ''}
        <span class="item-date">${item.date}</span>
      </div>
      <span class="item-title">${item.title}</span>
      ${item.summary ? `<div class="item-summary">${item.summary}</div>` : ''}
    </div>
  `).join('');
}

/**
 * 获取当前页面类型
 */
function getCurrentType() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const typeMap = {
    'lectures.html': 'lectures',
    'videos.html': 'videos',
    'audios.html': 'audios',
    'images.html': 'images',
    'literature.html': 'literature',
    'activities.html': 'activities',
    'downloads.html': 'downloads'
  };
  return typeMap[page] || getUrlParam('type') || 'lectures';
}

/**
 * 跳转到详情页
 */
function goToDetail(id, type) {
  window.location.href = `detail.html?id=${id}&type=${type}`;
}

/**
 * 搜索功能
 */
function performSearch(type, keyword) {
  const results = searchData(type, keyword);
  const container = document.querySelector('.content-list');
  renderContentList(results, container);
}

/**
 * 分类筛选
 */
function filterByCategory(type, category, container) {
  const allData = getAllData(type);
  let filtered = allData;
  
  if (category && category !== '全部') {
    filtered = allData.filter(item => item.category === category);
  }
  
  renderContentList(filtered, container);
}

/**
 * 渲染分类标签
 */
function renderFilterTags(categories, container, callback) {
  if (!container) return;
  
  let html = `<span class="filter-tag active" data-category="">全部</span>`;
  categories.forEach(cat => {
    html += `<span class="filter-tag" data-category="${cat}">${cat}</span>`;
  });
  
  container.innerHTML = html;
  
  container.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', function() {
      container.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const category = this.dataset.category;
      if (callback) callback(category);
    });
  });
}

/**
 * 渲染评论
 */
function renderComments(contentId) {
  const comments = getComments(contentId);
  const container = document.querySelector('.comment-list');
  if (!container) return;

  if (comments.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无评论</div>';
    return;
  }

  container.innerHTML = comments.map(comment => `
    <div class="comment-item">
      <div class="comment-author">${escapeHtml(comment.author)}</div>
      <div class="comment-date">${new Date(comment.date).toLocaleDateString('zh-CN')}</div>
      <div class="comment-body">${escapeHtml(comment.body)}</div>
    </div>
  `).join('');
}

/**
 * 提交评论
 */
function submitComment(contentId) {
  const authorInput = document.querySelector('.comment-author-input');
  const bodyInput = document.querySelector('.comment-body-input');
  
  if (!authorInput || !bodyInput) return;
  
  const author = authorInput.value.trim();
  const body = bodyInput.value.trim();
  
  if (!author || !body) {
    alert('请填写昵称和评论内容');
    return;
  }
  
  addComment(contentId, { author, body });
  authorInput.value = '';
  bodyInput.value = '';
  renderComments(contentId);
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 分页渲染
 */
function renderPagination(total, current, perPage, container, callback) {
  if (!container) return;
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  container.innerHTML = html;

  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const page = parseInt(this.dataset.page);
      if (callback) callback(page);
    });
  });
}

/**
 * 截断文本
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 生成随机ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


// ===== 分享功能 =====

function openSharePanel(title, url) {
  // 移除已有面板
  const existing = document.getElementById('sharePanel');
  if (existing) existing.remove();
  
  // 存储分享信息
  window._shareTitle = title || document.title;
  window._shareUrl = url || window.location.href;
  
  // 创建面板
  const panel = document.createElement('div');
  panel.id = 'sharePanel';
  panel.className = 'share-panel';
  panel.innerHTML = `
    <div class="share-panel-inner">
      <div class="share-panel-header">
        <span>分享</span>
        <button class="share-close" onclick="closeSharePanel()">✕</button>
      </div>
      <div class="share-panel-body">
        <button class="share-option" onclick="copyShareLink()">
          <span class="share-icon">🔗</span><span>复制链接</span>
        </button>
        <button class="share-option" onclick="shareToWeibo()">
          <span class="share-icon">📢</span><span>微博</span>
        </button>
        <button class="share-option" onclick="shareToQQ()">
          <span class="share-icon">💬</span><span>QQ</span>
        </button>
        <button class="share-option" onclick="shareToTwitter()">
          <span class="share-icon">🐦</span><span>Twitter</span>
        </button>
        <button class="share-option" onclick="shareToWechat()">
          <span class="share-icon">💚</span><span>微信（复制链接发送）</span>
        </button>
      </div>
    </div>
  `;
  
  // 点击背景关闭
  panel.addEventListener('click', function(e) {
    if (e.target === panel) closeSharePanel();
  });
  
  document.body.appendChild(panel);
}

function closeSharePanel() {
  const panel = document.getElementById('sharePanel');
  if (panel) panel.remove();
}

function copyShareLink() {
  const url = window._shareUrl || window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showCopyToast());
  } else {
    // fallback
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showCopyToast();
  }
}

function showCopyToast() {
  closeSharePanel();
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = '✓ 链接已复制';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

function shareToWeibo() {
  const url = encodeURIComponent(window._shareUrl || window.location.href);
  const title = encodeURIComponent(window._shareTitle || document.title);
  window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`, '_blank');
  closeSharePanel();
}

function shareToQQ() {
  const url = encodeURIComponent(window._shareUrl || window.location.href);
  const title = encodeURIComponent(window._shareTitle || document.title);
  window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`, '_blank');
  closeSharePanel();
}

function shareToTwitter() {
  const url = encodeURIComponent(window._shareUrl || window.location.href);
  const text = encodeURIComponent(window._shareTitle || document.title);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  closeSharePanel();
}

function shareToWechat() {
  copyShareLink();
  // 额外提示
  setTimeout(() => {
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = '请打开微信，粘贴链接发送';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }, 1600);
}

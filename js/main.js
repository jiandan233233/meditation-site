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

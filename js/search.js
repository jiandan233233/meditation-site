/**
 * 冥想资源网站 - 搜索功能
 * 使用 Fuse.js 进行客户端全文搜索
 */

// 搜索配置
const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'excerpt', weight: 0.3 },
    { name: 'category', weight: 0.2 },
    { name: 'tags', weight: 0.1 }
  ],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2
};

let fuse = null;
let searchData = [];

// 加载搜索数据
async function loadSearchData() {
  try {
    const response = await fetch('search-data.json');
    if (!response.ok) throw new Error('Failed to load search data');
    
    searchData = await response.json();
    fuse = new Fuse(searchData, fuseOptions);
    return true;
  } catch (error) {
    console.error('Error loading search data:', error);
    return false;
  }
}

// 执行搜索
function performSearch(query) {
  if (!fuse || !query.trim()) {
    return [];
  }
  
  const results = fuse.search(query);
  return results.map(result => ({
    ...result.item,
    score: result.score
  }));
}

// 显示搜索结果
function displayResults(results, container) {
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h3>暂无搜索结果</h3>
        <p>换个关键词试试吧</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = results.map(item => `
    <a href="${item.url}" class="search-result-item">
      <span class="search-result-type">${getTypeLabel(item.type)}</span>
      <h4 class="search-result-title">${highlightMatch(item.title, getSearchQuery())}</h4>
      <p class="search-result-excerpt">${item.excerpt || ''}</p>
    </a>
  `).join('');
}

// 高亮匹配文字
function highlightMatch(text, query) {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark style="background: rgba(123, 158, 135, 0.3); padding: 0 2px;">$1</mark>');
}

// 转义正则特殊字符
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 获取类型标签
function getTypeLabel(type) {
  const labels = {
    article: '文章',
    audio: '音频',
    video: '视频'
  };
  return labels[type] || type;
}

// 获取当前搜索词
function getSearchQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') || '';
}

// 初始化搜索页面
async function initSearch() {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const searchQuery = getSearchQuery();
  
  if (!searchInput || !resultsContainer) return;
  
  // 加载搜索数据
  const loaded = await loadSearchData();
  if (!loaded) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
        <h3>搜索数据加载失败</h3>
        <p>请检查网络连接后重试</p>
      </div>
    `;
    return;
  }
  
  // 设置初始搜索词
  if (searchQuery) {
    searchInput.value = searchQuery;
    const results = performSearch(searchQuery);
    displayResults(results, resultsContainer);
  }
  
  // 绑定搜索事件
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value.trim();
      
      // 更新 URL
      const url = new URL(window.location);
      if (query) {
        url.searchParams.set('q', query);
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url);
      
      const results = performSearch(query);
      displayResults(results, resultsContainer);
    }, 300);
  });
  
  // 回车搜索
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      const results = performSearch(e.target.value.trim());
      displayResults(results, resultsContainer);
    }
  });
}

// 全局搜索函数（供其他页面调用）
window.performGlobalSearch = function(query) {
  const encodedQuery = encodeURIComponent(query);
  window.location.href = `search.html?q=${encodedQuery}`;
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initSearch);

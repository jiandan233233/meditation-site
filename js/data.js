/**
 * 数据管理模块 - GitHub API + localStorage 混合存储
 */

// ========== 配置 ==========
const CONFIG = {
  // GitHub 仓库信息
  GITHUB_REPO: 'jiandan233233/sahaja-yoga',
  GITHUB_BRANCH: 'main',
  // GitHub Pages URL（用于读取公开内容）
  GITHUB_PAGES_URL: 'https://jiandan233233.github.io/sahaja-yoga',
  // GitHub API 端点
  GITHUB_API_URL: 'https://api.github.com',
  // localStorage keys
  TOKEN_KEY: 'github_token',
  CACHE_KEY: 'site_data_cache',
  CACHE_EXPIRY_KEY: 'site_data_cache_expiry',
  CACHE_EXPIRY_MS: 5 * 60 * 1000, // 缓存5分钟
  // 评论存储
  COMMENTS_KEY: 'site_comments'
};

// 存储键名（保持向后兼容）
const STORAGE_KEYS = {
  lectures: 'site_lectures',
  videos: 'site_videos',
  audios: 'site_audios',
  images: 'site_images',
  literature: 'site_literature',
  activities: 'site_activities',
  downloads: 'site_downloads',
  comments: 'site_comments'
};

// 默认数据
const DEFAULT_DATA = {
  lectures: [
    {
      id: 'lecture_1',
      title: '入静的首要条件',
      date: '2026-05-01',
      category: '冥想入门系列',
      summary: '学习如何创造一个适合冥想的内心环境，理解入静的关键要素。',
      content: '<p>冥想的入门第一步，是学会如何让自己平静下来。很多人以为冥想是要"什么都不想"，但这其实是一个常见的误解。</p><p>入静的首要条件是：接受。接受此刻的你，无论思绪多么纷乱，无论身体多么疲惫。接受是放松的开始，而放松是冥想的基础。</p><h3>几个入静的小技巧：</h3><ul><li>找一个安静的空间</li><li>保持舒适的坐姿</li><li>闭上眼睛，自然呼吸</li><li>不要评判自己的思绪</li></ul><p>当你能够接受自己本来的样子时，宁静自然会到来。</p>'
    }
  ],
  videos: [],
  audios: [],
  images: [],
  literature: [],
  activities: [],
  downloads: []
};

// ========== GitHub API 函数 ==========

/**
 * 获取 GitHub Token
 */
function getGithubToken() {
  return localStorage.getItem(CONFIG.TOKEN_KEY) || '';
}

/**
 * 设置 GitHub Token
 */
function setGithubToken(token) {
  localStorage.setItem(CONFIG.TOKEN_KEY, token);
}

/**
 * 通用 GitHub API 调用
 */
async function githubApi(method, path, body = null) {
  const token = getGithubToken();
  if (!token) {
    throw new Error('GitHub Token 未配置，请在创作者工作台设置');
  }

  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${CONFIG.GITHUB_API_URL}${path}`, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API 请求失败: ${response.status}`);
  }

  // DELETE 请求返回 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * 获取文件 SHA（用于更新文件）
 */
async function getFileSha(path) {
  try {
    const data = await githubApi('GET', `/repos/${CONFIG.GITHUB_REPO}/contents/${path}`);
    return data.sha;
  } catch (e) {
    // 文件不存在，返回 null
    return null;
  }
}

/**
 * 从 GitHub Pages 获取 content.json（公开读取，不需要 token）
 */
async function fetchContentJson() {
  const cache = getCache();
  if (cache) {
    return cache;
  }

  try {
    const response = await fetch(`${CONFIG.GITHUB_PAGES_URL}/data/content.json`);
    if (!response.ok) {
      throw new Error('获取内容失败');
    }
    const data = await response.json();
    setCache(data);
    return data;
  } catch (e) {
    console.warn('无法从 GitHub Pages 获取内容，使用缓存或默认数据:', e);
    const cachedData = getCache();
    if (cachedData) {
      return cachedData;
    }
    return DEFAULT_DATA;
  }
}

/**
 * 更新 content.json（需要 token）
 */
async function updateContentJson(data, message = '更新内容') {
  showLoading('正在保存到 GitHub...');
  
  try {
    const path = 'data/content.json';
    const sha = await getFileSha(path);
    
    const content = JSON.stringify(data, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    
    const body = {
      message: message,
      content: base64Content,
      branch: CONFIG.GITHUB_BRANCH
    };
    
    if (sha) {
      body.sha = sha;
    }

    await githubApi('PUT', `/repos/${CONFIG.GITHUB_REPO}/contents/${path}`, body);
    
    // 更新本地缓存
    setCache(data);
    
    hideLoading();
    return true;
  } catch (e) {
    hideLoading();
    throw e;
  }
}

/**
 * 上传媒体文件到仓库
 */
async function uploadMedia(file, directory) {
  showLoading(`正在上传 ${file.name}...`);
  
  try {
    // 生成文件名
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const path = `${directory}/${filename}`;
    
    // 转换为 base64
    const base64Content = await fileToBase64(file);
    const base64Data = base64Content.split(',')[1];
    
    const body = {
      message: `上传媒体文件: ${file.name}`,
      content: base64Data,
      branch: CONFIG.GITHUB_BRANCH
    };

    await githubApi('PUT', `/repos/${CONFIG.GITHUB_REPO}/contents/${path}`, body);
    
    // 返回 GitHub Pages URL
    const mediaUrl = `${CONFIG.GITHUB_PAGES_URL}/${directory}/${filename}`;
    
    hideLoading();
    return mediaUrl;
  } catch (e) {
    hideLoading();
    throw e;
  }
}

/**
 * 上传图片（内嵌在内容中的小图片）
 */
async function uploadInlineImage(file) {
  showLoading(`正在上传图片 ${file.name}...`);
  
  try {
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const path = `media/images/${filename}`;
    
    const base64Content = await fileToBase64(file);
    const base64Data = base64Content.split(',')[1];
    
    const body = {
      message: `上传图片: ${file.name}`,
      content: base64Data,
      branch: CONFIG.GITHUB_BRANCH
    };

    await githubApi('PUT', `/repos/${CONFIG.GITHUB_REPO}/contents/${path}`, body);
    
    hideLoading();
    return `${CONFIG.GITHUB_PAGES_URL}/${path}`;
  } catch (e) {
    hideLoading();
    throw e;
  }
}

// ========== 缓存函数 ==========

function getCache() {
  try {
    const cached = localStorage.getItem(CONFIG.CACHE_KEY);
    const expiry = localStorage.getItem(CONFIG.CACHE_EXPIRY_KEY);
    
    if (cached && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(cached);
    }
    return null;
  } catch (e) {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CONFIG.CACHE_EXPIRY_KEY, (Date.now() + CONFIG.CACHE_EXPIRY_MS).toString());
  } catch (e) {
    console.warn('缓存设置失败:', e);
  }
}

function clearCache() {
  localStorage.removeItem(CONFIG.CACHE_KEY);
  localStorage.removeItem(CONFIG.CACHE_EXPIRY_KEY);
}

// ========== 数据操作函数（兼容新旧接口） ==========

/**
 * 初始化默认数据
 */
function initDefaultData() {
  // 旧版 localStorage 初始化（保留以防万一）
  Object.keys(STORAGE_KEYS).forEach(key => {
    const storageKey = STORAGE_KEYS[key];
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_DATA[key] || []));
    }
  });
}

/**
 * 获取所有数据（从 GitHub 或缓存）
 */
async function getAllDataAsync(type) {
  try {
    const content = await fetchContentJson();
    return content[type] || [];
  } catch (e) {
    console.error('获取数据失败:', e);
    return [];
  }
}

/**
 * 同步获取所有数据（使用缓存）
 */
function getAllData(type) {
  const cache = getCache();
  if (cache && cache[type]) {
    return cache[type];
  }
  // 如果没有缓存，返回空数组，页面会通过异步加载
  return [];
}

/**
 * 保存所有数据
 */
function saveAllData(type, data) {
  // 同时更新缓存
  const cache = getCache() || {};
  cache[type] = data;
  setCache(cache);
  return true;
}

/**
 * 获取单条数据
 */
function getItemById(type, id) {
  const data = getAllData(type);
  return data.find(item => item.id === id) || null;
}

/**
 * 添加数据（仅更新本地缓存和 localStorage）
 */
function addItem(type, item) {
  const data = getAllData(type);
  item.id = type + '_' + Date.now();
  data.unshift(item);
  return saveAllData(type, data);
}

/**
 * 更新数据（仅更新本地）
 */
function updateItem(type, id, updates) {
  const data = getAllData(type);
  const index = data.findIndex(item => item.id === id);
  if (index === -1) return false;
  data[index] = { ...data[index], ...updates };
  return saveAllData(type, data);
}

/**
 * 删除数据（仅更新本地）
 */
function deleteItem(type, id) {
  const data = getAllData(type);
  const filtered = data.filter(item => item.id !== id);
  return saveAllData(type, filtered);
}

/**
 * 搜索数据
 */
function searchData(type, keyword) {
  const data = getAllData(type);
  if (!keyword) return data;
  const kw = keyword.toLowerCase();
  return data.filter(item => 
    item.title.toLowerCase().includes(kw) ||
    item.summary.toLowerCase().includes(kw) ||
    (item.category && item.category.toLowerCase().includes(kw))
  );
}

/**
 * 获取所有分类
 */
function getCategories(type) {
  const data = getAllData(type);
  const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
  return categories;
}

// ========== 评论相关 ==========

function getComments(contentId) {
  const allComments = JSON.parse(localStorage.getItem(CONFIG.COMMENTS_KEY) || '{}');
  return allComments[contentId] || [];
}

function addComment(contentId, comment) {
  const allComments = JSON.parse(localStorage.getItem(CONFIG.COMMENTS_KEY) || '{}');
  if (!allComments[contentId]) {
    allComments[contentId] = [];
  }
  allComments[contentId].push({
    id: Date.now().toString(),
    ...comment,
    date: new Date().toISOString()
  });
  localStorage.setItem(CONFIG.COMMENTS_KEY, JSON.stringify(allComments));
}

// ========== UI 辅助函数 ==========

function showLoading(message = '加载中...') {
  let loadingEl = document.getElementById('global-loading');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.id = 'global-loading';
    loadingEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;
    document.body.appendChild(loadingEl);
  }
  loadingEl.innerHTML = `
    <div style="background: white; padding: 24px 40px; border-radius: 12px; text-align: center; color: #333;">
      <div style="margin-bottom: 12px;">⏳</div>
      <div id="loading-text">${message}</div>
      <div style="margin-top: 12px; font-size: 12px; color: #666;">请稍候...</div>
    </div>
  `;
  loadingEl.style.display = 'flex';
}

function hideLoading() {
  const loadingEl = document.getElementById('global-loading');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

// ========== 工具函数 ==========

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========== 初始化 ==========
initDefaultData();

// 页面加载时预取数据
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    fetchContentJson().catch(console.warn);
  });
}

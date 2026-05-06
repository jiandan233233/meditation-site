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
  comments: 'site_comments',
  // 新增内容类型
  mother_talks: 'site_mother_talks',
  broadcasts: 'site_broadcasts',
  mantras: 'site_mantras',
  sentences_108: 'site_sentences_108',
  meditation_guide: 'site_meditation_guide',
  music_audio: 'site_music_audio',
  music_video: 'site_music_video',
  activity_videos: 'site_activity_videos'
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
  downloads: [],
  // 新增默认数据
  mother_talks: [],
  broadcasts: [],
  mantras: [],
  sentences_108: [],
  meditation_guide: [],
  music_audio: [],
  music_video: [],
  activity_videos: []
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
 * 更新 content.json（使用 Git Data API，与 uploadMedia 统一）
 * 
 * 问题：原 Contents API 在 uploadMedia 之后会因 SHA 不匹配导致 409 Conflict
 * 解决：改用 Git Data API，每次获取最新 HEAD commit，避免冲突
 */
async function updateContentJson(data, message = '更新内容') {
  showLoading('正在保存到 GitHub...');
  
  try {
    const path = 'data/content.json';
    
    // 转换为 base64
    const content = JSON.stringify(data, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    
    // 步骤1: 创建 blob
    showLoading('正在创建数据文件...');
    const blobSha = await createBlob(base64Content);
    
    // 步骤2: 获取 HEAD commit SHA（每次都获取最新，避免与 uploadMedia 冲突）
    showLoading('正在获取仓库信息...');
    const headCommitSha = await getHeadRef();
    
    // 步骤3: 获取 commit 的 tree SHA
    const commitData = await getCommit(headCommitSha);
    const baseTreeSha = commitData.tree.sha;
    
    // 步骤4: 创建新 tree
    showLoading('正在更新文件索引...');
    const newTreeSha = await createTree(baseTreeSha, [{
      path: path,
      mode: '100644',
      type: 'blob',
      sha: blobSha
    }]);
    
    // 步骤5: 创建新 commit
    showLoading('正在提交更改...');
    const newCommitSha = await createCommit(message, newTreeSha, headCommitSha);
    
    // 步骤6: 更新 ref
    await updateRef(`heads/${CONFIG.GITHUB_BRANCH}`, newCommitSha);
    
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
 * Git Data API 辅助函数
 */

/**
 * 创建 Blob
 * @param {string} content - base64 编码的内容
 * @returns {Promise<string>} blob SHA
 */
async function createBlob(content) {
  const data = await githubApi('POST', `/repos/${CONFIG.GITHUB_REPO}/git/blobs`, {
    content: content,
    encoding: 'base64'
  });
  return data.sha;
}

/**
 * 获取 HEAD ref
 * @returns {Promise<string>} commit SHA
 */
async function getHeadRef() {
  const data = await githubApi('GET', `/repos/${CONFIG.GITHUB_REPO}/git/ref/heads/${CONFIG.GITHUB_BRANCH}`);
  return data.object.sha;
}

/**
 * 获取 commit 信息
 * @param {string} commitSha - commit SHA
 * @returns {Promise<object>} commit 对象
 */
async function getCommit(commitSha) {
  return githubApi('GET', `/repos/${CONFIG.GITHUB_REPO}/git/commits/${commitSha}`);
}

/**
 * 创建新 tree
 * @param {string} baseTreeSha - 基础 tree SHA
 * @param {Array} entries - 文件条目 [{ path, mode, type, sha }]
 * @returns {Promise<string>} new tree SHA
 */
async function createTree(baseTreeSha, entries) {
  const data = await githubApi('POST', `/repos/${CONFIG.GITHUB_REPO}/git/trees`, {
    base_tree: baseTreeSha,
    tree: entries
  });
  return data.sha;
}

/**
 * 创建新 commit
 * @param {string} message - commit 消息
 * @param {string} treeSha - tree SHA
 * @param {string} parentSha - parent commit SHA
 * @returns {Promise<string>} new commit SHA
 */
async function createCommit(message, treeSha, parentSha) {
  const data = await githubApi('POST', `/repos/${CONFIG.GITHUB_REPO}/git/commits`, {
    message: message,
    tree: treeSha,
    parents: [parentSha]
  });
  return data.sha;
}

/**
 * 更新 ref
 * @param {string} ref - ref 路径，如 "heads/main"
 * @param {string} sha - 新的 commit SHA
 */
async function updateRef(ref, sha) {
  await githubApi('PATCH', `/repos/${CONFIG.GITHUB_REPO}/git/refs/${ref}`, {
    sha: sha,
    force: false
  });
}

/**
 * 上传媒体文件到仓库（使用 Git Data API，支持大文件）
 * GitHub 仓库单文件上限 100MB，原始文件建议不超过 75MB
 */
async function uploadMedia(file, directory) {
  // 文件大小限制：75MB（base64 编码后约 100MB，在 GitHub 限制内）
  const MAX_SIZE = 75 * 1024 * 1024;
  
  if (file.size > MAX_SIZE) {
    throw new Error(`视频文件超过 ${MAX_SIZE / 1024 / 1024}MB 限制。请压缩视频后重试，或分段上传。`);
  }
  
  try {
    // 生成文件名
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const path = `${directory}/${filename}`;
    
    // 步骤1: 转换文件为 base64
    showLoading('正在读取文件...');
    const base64Content = await fileToBase64(file);
    const base64Data = base64Content.split(',')[1];
    
    // 步骤2: 创建 Blob
    showLoading('正在上传文件数据 (1/4)...');
    const blobSha = await createBlob(base64Data);
    
    // 步骤3: 获取 HEAD commit SHA
    showLoading('正在获取仓库信息 (2/4)...');
    const headCommitSha = await getHeadRef();
    
    // 步骤4: 获取 commit 的 tree SHA
    const commitData = await getCommit(headCommitSha);
    const baseTreeSha = commitData.tree.sha;
    
    // 步骤5: 创建新 tree
    showLoading('正在创建文件索引 (3/4)...');
    const newTreeSha = await createTree(baseTreeSha, [{
      path: path,
      mode: '100644',
      type: 'blob',
      sha: blobSha
    }]);
    
    // 步骤6: 创建新 commit
    showLoading('正在保存到仓库 (4/4)...');
    const newCommitSha = await createCommit(
      `上传媒体文件: ${file.name}`,
      newTreeSha,
      headCommitSha
    );
    
    // 步骤7: 更新 ref
    await updateRef(`heads/${CONFIG.GITHUB_BRANCH}`, newCommitSha);
    
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
 * 上传图片（内嵌在内容中的小图片）- 使用 Contents API
 */
async function uploadInlineImage(file) {
  // 图片文件限制：1MB（base64后约1.37MB）
  const MAX_SIZE = 1 * 1024 * 1024;
  
  if (file.size > MAX_SIZE) {
    throw new Error('图片文件超过1MB限制。请压缩图片后重试（建议压缩到500KB以下）。');
  }
  
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

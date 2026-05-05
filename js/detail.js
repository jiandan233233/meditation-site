/**
 * 详情页脚本 - 渲染内容详情和评论区
 */

(function() {
  'use strict';

  let currentId = '';
  let currentType = '';
  let currentItem = null;

  // 类型名称映射
  const TYPE_NAMES = {
    lectures: '讲座开示',
    videos: '视频专区',
    literature: '经典文献',
    activities: '活动分享',
    downloads: '下载资料'
  };

  // 页面初始化
  document.addEventListener('DOMContentLoaded', function() {
    initDetail();
    initCommentForm();
  });

  // 初始化详情页
  function initDetail() {
    const params = new URLSearchParams(window.location.search);
    currentId = params.get('id');
    currentType = params.get('type');

    if (!currentId || !currentType) {
      showError('参数错误，请从列表页进入');
      return;
    }

    // 加载内容
    loadContent();
  }

  // 加载内容数据
  function loadContent() {
    const data = getAllData(currentType);
    currentItem = data.find(item => item.id === currentId);

    if (!currentItem) {
      showError('内容不存在');
      return;
    }

    renderDetail();
    renderComments();
  }

  // 渲染详情内容
  function renderDetail() {
    // 更新页面标题
    document.title = currentItem.title + ' - Sahaja Yoga';

    // 面包屑
    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = TYPE_NAMES[currentType] || currentType;
    }

    // 标题
    const titleEl = document.getElementById('detail-title');
    if (titleEl) {
      titleEl.textContent = currentItem.title;
    }

    // 日期
    const dateEl = document.getElementById('detail-date');
    if (dateEl) {
      dateEl.textContent = currentItem.date || '';
    }

    // 分类标签
    const categoryEl = document.getElementById('detail-category');
    if (categoryEl && currentItem.category) {
      categoryEl.textContent = currentItem.category;
      categoryEl.style.display = 'inline-block';
    } else if (categoryEl) {
      categoryEl.style.display = 'none';
    }

    // 视频区
    const videoSection = document.getElementById('detail-video');
    const videoWrapper = document.getElementById('video-wrapper');
    if (videoSection && videoWrapper && currentItem.videoUrl) {
      videoSection.style.display = 'block';
      videoWrapper.innerHTML = getVideoEmbed(currentItem.videoUrl);
    }

    // 正文内容
    const contentEl = document.getElementById('detail-content');
    if (contentEl) {
      contentEl.innerHTML = currentItem.content || '<p>暂无详细内容</p>';
    }
  }

  // 生成视频嵌入HTML
  function getVideoEmbed(url) {
    if (!url) return '';

    // B站视频
    if (url.includes('bilibili.com') || url.match(/^BV[\w]+$/)) {
      const bvid = url.match(/^BV[\w]+$/) ? url : extractBilibiliId(url);
      if (bvid) {
        return `<iframe src="//player.bilibili.com/player.html?bvid=${bvid}&autoplay=0" 
                allowfullscreen="allowfullscreen" 
                webkitallowfullscreen="webkitallowfullscreen" 
                mozallowfullscreen="mozallowfullscreen">
                </iframe>`;
      }
    }

    // YouTube视频（国内可能无法访问）
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const ytid = extractYouTubeId(url);
      if (ytid) {
        return `<iframe src="//www.youtube.com/embed/${ytid}?autoplay=0" 
                allowfullscreen="allowfullscreen" 
                webkitallowfullscreen="webkitallowfullscreen" 
                mozallowfullscreen="mozallowfullscreen">
                </iframe>`;
      }
    }

    // HTML5视频
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) || url.includes('.mp4') || url.includes('.webm')) {
      return `<video src="${url}" controls></video>`;
    }

    // 直接是iframe代码
    if (url.includes('<iframe')) {
      return url;
    }

    // 默认：假设是嵌入链接
    return `<iframe src="${url}" allowfullscreen></iframe>`;
  }

  // 提取B站视频ID
  function extractBilibiliId(url) {
    const match = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
    return match ? match[1] : null;
  }

  // 提取YouTube视频ID
  function extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1].length === 11) {
        return match[1];
      }
    }
    return null;
  }

  // 显示错误信息
  function showError(message) {
    const container = document.querySelector('.detail-container');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <p>⚠️ ${message}</p>
          <a href="javascript:history.back()" style="color:var(--link-color);margin-top:16px;display:inline-block;">← 返回</a>
        </div>
      `;
    }
  }

  // ==================== 评论区功能 ====================

  // 初始化评论表单
  function initCommentForm() {
    const submitBtn = document.getElementById('comment-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitComment);
    }

    // 回车提交
    const nicknameInput = document.getElementById('comment-nickname');
    const commentText = document.getElementById('comment-text');
    
    if (nicknameInput) {
      nicknameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          submitComment();
        }
      });
    }
  }

  // 获取评论存储key
  function getCommentKey() {
    return `comments_${currentType}_${currentId}`;
  }

  // 加载并渲染评论
  function renderComments() {
    const comments = getComments(currentId);
    const listContainer = document.getElementById('comment-list');
    
    if (!listContainer) return;

    if (comments.length === 0) {
      listContainer.innerHTML = '<p class="no-comments">暂无留言，成为第一个留言者吧！</p>';
      return;
    }

    listContainer.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
  }

  // 创建单条评论HTML
  function createCommentHTML(comment) {
    const initial = comment.nickname ? comment.nickname.charAt(0).toUpperCase() : '?';
    return `
      <div class="comment-item">
        <div class="comment-avatar">${initial}</div>
        <div class="comment-body">
          <div>
            <span class="comment-name">${escapeHtml(comment.nickname)}</span>
            <span class="comment-time">${comment.time}</span>
          </div>
          <div class="comment-content">${escapeHtml(comment.content)}</div>
        </div>
      </div>
    `;
  }

  // 提交评论
  function submitComment() {
    const nicknameInput = document.getElementById('comment-nickname');
    const commentTextarea = document.getElementById('comment-text');

    if (!nicknameInput || !commentTextarea) return;

    const nickname = nicknameInput.value.trim();
    const content = commentTextarea.value.trim();

    // 验证
    if (!nickname) {
      alert('请输入昵称');
      nicknameInput.focus();
      return;
    }
    if (!content) {
      alert('请输入评论内容');
      commentTextarea.focus();
      return;
    }

    // 创建评论对象
    const comment = {
      nickname: nickname,
      content: content,
      time: formatTime(new Date())
    };

    // 保存到localStorage
    const key = getCommentKey();
    let comments = JSON.parse(localStorage.getItem(key) || '[]');
    comments.unshift(comment); // 新评论在前
    localStorage.setItem(key, JSON.stringify(comments));

    // 清空表单
    nicknameInput.value = '';
    commentTextarea.value = '';

    // 重新渲染评论
    renderComments();
  }

  // 从localStorage获取评论
  function getComments(contentId) {
    const key = `comments_${currentType}_${contentId}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      console.error('读取评论失败:', e);
      return [];
    }
  }

  // 格式化时间
  function formatTime(date) {
    const pad = n => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // HTML转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();

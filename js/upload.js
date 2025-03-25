// ==================== LeanCloud 初始化 ====================
if (!window.LEANCLOUD_CONFIG) {
  console.error('LeanCloud 配置未加载，请检查注入顺序！');
} else {
  AV.init({
    appId: window.LEANCLOUD_CONFIG.appId,
    appKey: window.LEANCLOUD_CONFIG.appKey,
    serverURLs: window.LEANCLOUD_CONFIG.serverURL
  });
}

// ==================== 类名映射 ====================
const classTypeMap = {
  AI_music: window.LEANCLOUD_CONFIG?.class_mapping?.AI_music || 'AI_Music',
  AI_Images: window.LEANCLOUD_CONFIG?.class_mapping?.AI_Images || 'AI_Images',
  AI_Videos: window.LEANCLOUD_CONFIG?.class_mapping?.AI_Videos || 'AI_Videos'
};

// ==================== 数据展示模块 ====================
async function renderGallery(category = 'gallery') {
  const targetDiv = document.getElementById('content-display');
  if (!targetDiv) return;

  targetDiv.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const query = new AV.Query(classTypeMap[category]);
    query.include('file'); // 关联文件对象
    query.descending('createdAt');

    // 修复API请求路径
    AV._config.APIServerURL = window.LEANCLOUD_CONFIG.serverURL;
    
    const results = await query.find();

    // 添加空数据检查
    if (!results || results.length === 0) {
      targetDiv.innerHTML = '<div class="empty">暂无数据</div>';
      return;
    }
    
    const html = results.map(item => {
      const file = item.get('file');
      if (!file) {
        console.warn('文件数据缺失:', item);
        return '';
      }

      const isImage = file.mime_type.startsWith('image/');
      const isAudio = file.mime_type.startsWith('audio/');
      const isVideo = file.mime_type.startsWith('video/');

      // 添加版权保护
      const protectedContent = `
        <div class="gallery-item" oncontextmenu="return false;">
          ${isImage ? 
            `<img src="${file.thumbnailURL(400, 400)}" alt="${item.get('title')}" class="protected-image">` : 
            isVideo ? 
            `<div class="video-container">
              <video controls width="100%" controlsList="nodownload" disablePictureInPicture>
                <source src="${file.url()}" type="${file.mime_type}">
              </video>
              <div class="overlay"></div>
            </div>` :
            isAudio ?
            `<audio controls controlsList="nodownload">
              <source src="${file.url()}" type="${file.mime_type}">
            </audio>` :
            `<div class="file-icon">📁</div>`
          }
          <div class="meta">
            <h3>${item.get('title') || '未命名'}</h3>
            <p>${new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      `;
      return protectedContent;
    }).join('');
    
    targetDiv.innerHTML = html || '<div class="empty">暂无数据</div>';
    
  } catch (error) {
    targetDiv.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
  }
}

// ==================== 自动渲染逻辑 ====================
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('ai-gallery')) renderGallery('AI_Images');
  if (path.includes('ai-music')) renderGallery('AI_music');
  if (path.includes('ai-video')) renderGallery('AI_Videos');
});
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('ai-gallery')) {
    // 默认加载图片
    renderGallery('AI_Images');
  }
  if (path.includes('ai-music')) {
    renderGallery('AI_music');
  }
  if (path.includes('ai-video')) {
    renderGallery('AI_Videos');
  }
});
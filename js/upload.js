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
    
    const results = await query.find();
    
    const html = results.map(item => {
      const file = item.get('file');
      const isImage = file.mime_type.startsWith('image/');
      const isAudio = file.mime_type.startsWith('audio/');
      const isVideo = file.mime_type.startsWith('video/');

      return `
        <div class="gallery-item">
          ${isImage ? 
            `<img src="${file.thumbnailURL(400, 400)}" alt="${item.get('title')}">` : 
            isVideo ? 
            `<video controls width="100%">
              <source src="${file.url()}" type="${file.mime_type}">
            </video>` :
            isAudio ?
            `<audio controls>
              <source src="${file.url()}" type="${file.mime_type}">
            </audio>` :
            `<div class="file-icon">📁</div>`
          }
          <div class="meta">
            <h3>${item.get('title') || '未命名'}</h3>
            <p>${new Date(item.createdAt).toLocaleDateString()}</p>
            <a href="${file.url()}" target="_blank">查看原文件</a>
          </div>
        </div>
      `;
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
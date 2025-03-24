// ==================== LeanCloud 初始化增强 ====================
// 增加配置安全检测
if (!window.LEANCLOUD_CONFIG) {
  console.error('LeanCloud 配置未加载，请检查注入顺序！');
} else {
  AV.init({
    appId: window.LEANCLOUD_CONFIG.appId,
    appKey: window.LEANCLOUD_CONFIG.appKey,
    serverURLs: window.LEANCLOUD_CONFIG.serverURL
  });
}

// ==================== 动态类名映射 ====================
const classTypeMap = {
  AI_music: window.LEANCLOUD_CONFIG?.class_mapping?.AI_music || 'AI_Music',
  AI_Images: window.LEANCLOUD_CONFIG?.class_mapping?.AI_Images || 'AI_Images',
  AI_Videos: window.LEANCLOUD_CONFIG?.class_mapping?.AI_Videos || 'AI_Videos'
};

// ==================== 上传函数增强 ====================
async function universalUpload(file, category, metadata) {
  try {
    // 获取动态类名
    const classType = classTypeMap[category];
    if (!classType) throw new Error('未知文件分类');

    // 上传主逻辑
    const avFile = new AV.File(file.name, file);
    const savedFile = await avFile.save();
    
    const DataClass = AV.Object.extend(classType);
    const entry = new DataClass();
    
    // 元数据智能处理
    const processedMetadata = {
      ...metadata,
      fileSize: file.size,
      mimeType: file.type,
      uploadTime: new Date().toISOString()
    };
    
    Object.entries(processedMetadata).forEach(([key, val]) => entry.set(key, val));
    entry.set('file', savedFile); // 统一字段名
    
    await entry.save();

    // 调试日志增强
    console.log('[Upload Success]', { 
      category,
      objectId: entry.id,
      fileURL: savedFile.url(),
      thumbnail: savedFile.thumbnailURL(200, 200) // 图片缩略图
    });

    // 实时预览扩展
    if (file.type.startsWith('image/')) {
      renderPreview(savedFile, 'image');
    } else if (file.type.startsWith('audio/')) {
      renderPreview(savedFile, 'audio');
    }
    
    return entry.id; // 返回数据库ID
    
  } catch (error) {
    console.error('[Upload Failed]', error);
    throw new Error(`上传失败: ${error.message}`);
  }
}

// ==================== 展示系统集成 ====================
// 通用渲染函数
function renderPreview(fileObj, type) {
  const container = document.getElementById('upload-preview') || createPreviewContainer();
  
  let element;
  switch(type) {
    case 'image':
      element = document.createElement('img');
      element.src = fileObj.thumbnailURL(400, 400);
      element.alt = '上传预览';
      break;
      
    case 'audio':
      element = document.createElement('audio');
      element.controls = true;
      element.src = fileObj.url();
      break;
      
    case 'video':
      element = document.createElement('video');
      element.controls = true;
      element.width = 640;
      element.src = fileObj.url();
      break;
  }
  
  if (element) {
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.appendChild(element);
    container.appendChild(card);
  }
}

function createPreviewContainer() {
  const div = document.createElement('div');
  div.id = 'upload-preview';
  div.style.position = 'fixed';
  div.style.bottom = '20px';
  div.style.right = '20px';
  div.style.zIndex = 9999;
  document.body.appendChild(div);
  return div;
}

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
    
    const html = results.map(item => `
      <div class="gallery-item">
        ${item.get('file').mime_type.startsWith('image/') ? 
          `<img src="${item.get('file').thumbnailURL(400, 400)}" alt="${item.get('title')}">` : 
          `<div class="file-icon">📁</div>`
        }
        <div class="meta">
          <h3>${item.get('title') || '未命名'}</h3>
          <p>${new Date(item.createdAt).toLocaleDateString()}</p>
          <a href="${item.get('file').url()}" target="_blank">查看原文件</a>
        </div>
      </div>
    `).join('');
    
    targetDiv.innerHTML = html || '<div class="empty">暂无数据</div>';
    
  } catch (error) {
    targetDiv.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
  }
}

// 自动渲染逻辑修正
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('ai-gallery')) renderGallery('AI_Images');
  if (path.includes('ai-music')) renderGallery('AI_music');
  if (path.includes('ai-video')) renderGallery('AI_Videos');
});

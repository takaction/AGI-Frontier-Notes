// 初始化 SDK
AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  serverURLs: process.env.LEANCLOUD_SERVER_URL
});

// 上传文件并关联元数据
// 通用上传函数（支持图片/视频/音乐）
async function universalUpload(file, classType, metadata) {
  const avFile = new AV.File(file.name, file);
  const savedFile = await avFile.save();

  const DataClass = AV.Object.extend(classType); // 动态指定 Class
  const entry = new DataClass();
  
  // 动态设置元数据字段
  Object.keys(metadata).forEach(key => {
    entry.set(key, metadata[key]);
  });
  entry.set('url', savedFile);

  await entry.save();
  return savedFile.url();
}

// 调用示例：上传音乐
universalUpload(
  audioFile, 
  'AI_Music', 
  { title: '交响曲', artist: '莫扎特', duration: 720 }
);
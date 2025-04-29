/**
 * 分享海报配置
 * 集中管理分享海报相关的配置项
 */

// 海报尺寸配置
export const POSTER_SIZE = {
  // 海报宽度（像素）
  WIDTH: 800,
  // 海报高度（像素）
  HEIGHT: 1200,
  // 海报内边距（像素）
  PADDING: 40
};

// 海报图片配置
export const POSTER_IMAGES = {
  // 顶部机构3D logo
  LOGO: {
    // 图片URL（占位符，后期替换）
    URL: '/images/logo-3d-placeholder.svg',
    // 图片宽度（像素）
    WIDTH: 200,
    // 图片高度（像素）
    HEIGHT: 200
  },

  // 底部二维码
  QR_CODE: {
    // 图片URL（占位符，后期替换）
    URL: '/images/qrcode-placeholder.svg',
    // 图片宽度（像素）
    WIDTH: 150,
    // 图片高度（像素）
    HEIGHT: 150
  }
};

// 海报文本配置
export const POSTER_TEXT = {
  // 机构名称
  INSTITUTION_NAME: '科晟智慧',
  // 机构小红书号
  XIAOHONGSHU_ID: '小红书账号  @科晟智慧金融',
  // 海报标题
  TITLE: '我的学习成果',
  // 海报副标题
  SUBTITLE: '坚持学习，成就未来',
  // 海报底部文本
  FOOTER: '专注高效率的金融硕士教育'
};

// 海报颜色配置
export const POSTER_COLORS = {
  // 背景颜色
  BACKGROUND: '#ffffff',
  // 主要文本颜色
  PRIMARY_TEXT: '#333333',
  // 次要文本颜色
  SECONDARY_TEXT: '#666666',
  // 强调色
  ACCENT: '#3498db',
  // 图表颜色
  CHART: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6']
};

// 海报字体配置
export const POSTER_FONTS = {
  // 标题字体
  TITLE: 'bold 36px Arial, sans-serif',
  // 副标题字体
  SUBTITLE: '24px Arial, sans-serif',
  // 正文字体
  BODY: '18px Arial, sans-serif',
  // 小文本字体
  SMALL: '14px Arial, sans-serif'
};

export default {
  SIZE: POSTER_SIZE,
  IMAGES: POSTER_IMAGES,
  TEXT: POSTER_TEXT,
  COLORS: POSTER_COLORS,
  FONTS: POSTER_FONTS
};

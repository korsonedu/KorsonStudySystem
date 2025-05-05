/**
 * 全局退出登录工具函数
 * 清除所有本地存储和会话存储，并重定向到登录页面
 */

// 退出登录函数
export const logout = () => {
  console.log('全局退出登录 - 开始退出登录');

  // 清除所有本地存储
  localStorage.clear();
  sessionStorage.clear();
  
  // 清除所有cookie
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  });
  
  console.log('全局退出登录 - 已清除本地存储和状态');
  
  // 强制刷新页面，确保所有状态都被重置
  console.log('全局退出登录 - 重定向到登录页并刷新页面');
  window.location.href = '/login';
};

export default logout;

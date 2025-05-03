// 在浏览器控制台中运行此脚本，以监控所有网络请求

// 保存原始的 XMLHttpRequest 和 fetch
const originalXHR = window.XMLHttpRequest;
const originalFetch = window.fetch;

// 重写 XMLHttpRequest
window.XMLHttpRequest = function() {
  const xhr = new originalXHR();
  
  // 保存原始的 open 和 send 方法
  const originalOpen = xhr.open;
  const originalSend = xhr.send;
  
  // 重写 open 方法
  xhr.open = function() {
    console.log('XHR 请求:', {
      method: arguments[0],
      url: arguments[1]
    });
    return originalOpen.apply(this, arguments);
  };
  
  // 重写 send 方法
  xhr.send = function(data) {
    console.log('XHR 发送数据:', data);
    
    // 监听 readystatechange 事件
    xhr.addEventListener('readystatechange', function() {
      if (xhr.readyState === 4) {
        console.log('XHR 响应:', {
          status: xhr.status,
          response: xhr.response
        });
      }
    });
    
    return originalSend.apply(this, arguments);
  };
  
  return xhr;
};

// 重写 fetch
window.fetch = function(url, options = {}) {
  console.log('Fetch 请求:', {
    url,
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body
  });
  
  return originalFetch.apply(this, arguments)
    .then(response => {
      // 克隆响应以便可以读取内容
      const clonedResponse = response.clone();
      
      // 尝试解析响应内容
      clonedResponse.text().then(text => {
        try {
          const json = JSON.parse(text);
          console.log('Fetch 响应:', {
            status: response.status,
            url: response.url,
            json
          });
        } catch (e) {
          console.log('Fetch 响应:', {
            status: response.status,
            url: response.url,
            text: text.substring(0, 500) // 限制长度
          });
        }
      });
      
      return response;
    })
    .catch(error => {
      console.error('Fetch 错误:', error);
      throw error;
    });
};

console.log('网络请求监控已启动');

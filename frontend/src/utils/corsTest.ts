/**
 * CORS测试工具
 * 用于测试CORS配置是否正确
 */

import axios from 'axios';
import { SERVER_CONFIG } from '../config';

/**
 * 测试CORS配置是否正确
 * @returns Promise<boolean> 是否成功
 */
export async function testCORS(): Promise<boolean> {
  try {
    console.log('Testing CORS configuration...');
    
    // 构建测试URL
    const testUrl = `${SERVER_CONFIG.BACKEND.URL}/api/cors-test`;
    console.log(`Testing URL: ${testUrl}`);
    
    // 发送测试请求
    const response = await axios.get(testUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: false
    });
    
    // 检查响应
    if (response.status === 200) {
      console.log('CORS test successful:', response.data);
      return true;
    } else {
      console.error('CORS test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('CORS test failed with error:', error);
    return false;
  }
}

/**
 * 测试API是否可用
 * @returns Promise<boolean> 是否成功
 */
export async function testAPI(): Promise<boolean> {
  try {
    console.log('Testing API availability...');
    
    // 构建测试URL
    const testUrl = `${SERVER_CONFIG.BACKEND.URL}/api/test`;
    console.log(`Testing URL: ${testUrl}`);
    
    // 发送测试请求
    const response = await axios.get(testUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: false
    });
    
    // 检查响应
    if (response.status === 200) {
      console.log('API test successful:', response.data);
      return true;
    } else {
      console.error('API test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('API test failed with error:', error);
    return false;
  }
}

export default {
  testCORS,
  testAPI
};

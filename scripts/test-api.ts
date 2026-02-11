 
 
import axios from 'axios';

async function testRolesAPI() {
  console.log('🧪 测试角色管理 API...\n');

  try {
    // 测试 1: 不带 token 访问
    console.log('1️⃣ 测试不带 token 访问:');
    try {
      await axios.get('http://localhost:3001/api/roles');
    } catch (error: any) {
      console.log(`   状态码: ${error.response?.status}`);
      console.log(`   错误信息: ${error.response?.data?.message}\n`);
    }

    // 测试 2: 带无效 token 访问
    console.log('2️⃣ 测试带无效 token 访问:');
    try {
      await axios.get('http://localhost:3001/api/roles', {
        headers: {
          Authorization: 'Bearer invalid_token_here'
        }
      });
    } catch (error: any) {
      console.log(`   状态码: ${error.response?.status}`);
      console.log(`   错误信息: ${error.response?.data?.message}\n`);
    }

    console.log('💡 提示:');
    console.log('   如果你已经登录，请检查浏览器开发者工具:');
    console.log('   1. 打开 Network 标签');
    console.log('   2. 刷新角色管理页面');
    console.log('   3. 找到 /api/roles 请求');
    console.log('   4. 查看 Request Headers 中是否有 Authorization 字段');
    console.log('   5. 检查 Authorization 的值是否为 "Bearer <token>"');
    console.log('\n   如果没有 Authorization 字段，说明前端没有正确发送 token。');

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
  }
}

testRolesAPI();

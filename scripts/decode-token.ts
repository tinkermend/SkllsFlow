// 解析 JWT Token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYTAwZjFhOC0xMmQyLTRmNzctODNiMy00MjRhMDRlMTlmMDEiLCJhY2NvdW50Tm8iOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYWlvcHMuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc2OTY4NDUyNSwiZXhwIjoxNzY5Njg4MTI1fQ.wLYBZJo52qMWye7nfNHMTKzgfFED3ECojc9pPaYp1fo";

// 解码 JWT payload
const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('📋 Token 信息:');
console.log('  用户ID:', payload.userId);
console.log('  账号:', payload.accountNo);
console.log('  邮箱:', payload.email);
console.log('  类型:', payload.type);
console.log('');

// 检查过期时间
const now = Math.floor(Date.now() / 1000);
const iat = payload.iat;
const exp = payload.exp;

console.log('⏰ 时间信息:');
console.log('  签发时间:', new Date(iat * 1000).toLocaleString('zh-CN'));
console.log('  过期时间:', new Date(exp * 1000).toLocaleString('zh-CN'));
console.log('  当前时间:', new Date(now * 1000).toLocaleString('zh-CN'));
console.log('');

const isExpired = now > exp;
const timeLeft = exp - now;

if (isExpired) {
  console.log('❌ Token 已过期！');
  console.log(`   过期了 ${Math.floor((now - exp) / 60)} 分钟`);
} else {
  console.log('✅ Token 有效');
  console.log(`   还剩 ${Math.floor(timeLeft / 60)} 分 ${timeLeft % 60} 秒`);
}

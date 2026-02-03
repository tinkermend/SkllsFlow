import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check proxy_host records
    const proxyHosts = await prisma.$queryRaw`
      SELECT id, host, port, created_by
      FROM aiops.proxy_host
      LIMIT 10
    `;
    console.log('Proxy hosts:', JSON.stringify(proxyHosts, null, 2));

    // Check if users exist
    const users = await prisma.$queryRaw`
      SELECT id, user_uuid, username
      FROM aiops.users
      LIMIT 5
    `;
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { faker } from "@faker-js/faker";

// Set a fixed seed for consistent data generation
faker.seed(67890);

const roles = ["superadmin", "admin", "cashier", "manager"] as const;

export const users = Array.from({ length: 500 }, () => {
  return {
    userId: faker.string.uuid(),
    accountNo: faker.string.numeric(10),
    email: faker.internet.email(),
    username: faker.internet.username().toLocaleLowerCase() || null,
    avatar: faker.image.avatar() || null,
    status: faker.helpers.arrayElement([
      "active",
      "inactive",
      "invited",
      "suspended",
    ]),
    lastLoginAt: faker.date.recent(),
    createdAt: faker.date.past(),
    userRoles: [
      {
        role: {
          name: faker.helpers.arrayElement(roles),
          code: faker.helpers.arrayElement(roles),
        },
      },
    ],
  };
});

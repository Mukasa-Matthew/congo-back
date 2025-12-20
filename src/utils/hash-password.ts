import bcrypt from 'bcryptjs';

// Utility to generate password hash
// Run: npx ts-node src/utils/hash-password.ts
const password = process.argv[2] || 'admin123';

const hash = bcrypt.hashSync(password, 10);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);


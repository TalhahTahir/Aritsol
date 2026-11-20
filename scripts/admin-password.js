// Creates the admin password settings.
//   npm run admin:password
// Type the password you want. If a .env file exists, ADMIN_PASSWORD_HASH (and JWT_SECRET, if it is
// still a placeholder) are written into it for you. Copy the printed values into Vercel too.
import crypto from 'node:crypto';
import fs from 'node:fs';
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = process.argv[2] || (await rl.question('New admin password (at least 12 characters): '));
rl.close();

if (!password || password.length < 12) {
  console.error('\nPlease use at least 12 characters (a short sentence is easy to remember and strong).');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const secret = crypto.randomBytes(48).toString('base64url');
const lines = { ADMIN_PASSWORD_HASH: hash };

if (fs.existsSync('.env')) {
  let text = fs.readFileSync('.env', 'utf8');
  const current = /^JWT_SECRET=(.*)$/m.exec(text)?.[1]?.trim() || '';
  if (!current || current.length < 32 || /YOUR_|CHANGE_ME/i.test(current)) lines.JWT_SECRET = secret;
  for (const [k, v] of Object.entries(lines)) {
    const re = new RegExp(`^${k}=.*$`, 'm');
    text = re.test(text) ? text.replace(re, () => `${k}=${v}`) : `${text.trimEnd()}\n${k}=${v}\n`;
  }
  fs.writeFileSync('.env', text);
  console.log(`\nSaved ${Object.keys(lines).join(' and ')} in .env.`);
} else {
  lines.JWT_SECRET = secret;
  console.log('\nNo .env file found. Add these lines to it:');
}

console.log('\nFor Vercel (Settings → Environment Variables), use:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
if (lines.JWT_SECRET) console.log(`JWT_SECRET=${lines.JWT_SECRET}`);
else console.log('JWT_SECRET=(the value already in your .env)');
console.log('\nThe password itself is not stored anywhere. Keep it in your password manager.');

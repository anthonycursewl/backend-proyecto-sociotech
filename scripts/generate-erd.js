const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');
const tmpSchemaPath = path.resolve(__dirname, '..', 'prisma', 'schema.erd.prisma');

const generatorBlock = `generator erd {
  provider = "prisma-erd-generator"
  output   = "prisma/ERD.svg"
}
`;

try {
  const original = fs.readFileSync(schemaPath, 'utf8');
  fs.writeFileSync(tmpSchemaPath, generatorBlock + '\n' + original, 'utf8');

  console.log('Generating ERD to prisma/ERD.svg...');
  execSync(`npx prisma generate --schema=${tmpSchemaPath}`, { stdio: 'inherit' });
  console.log('ERD generation completed.');
} catch (err) {
  console.error('ERD generation failed:', err);
  process.exit(1);
} finally {
  try {
    if (fs.existsSync(tmpSchemaPath)) fs.unlinkSync(tmpSchemaPath);
  } catch (e) {
    // ignore
  }
}

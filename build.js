import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Ensure dist directory exists
ensureDirectoryExists('./dist');
ensureDirectoryExists('./dist/public');

try {
  // Build client
  console.log('📦 Building client...');
  execSync('cd client && npx vite build', { stdio: 'inherit' });
  console.log('✅ Client build complete');
  
  // Copy client dist to our dist folder
  console.log('📂 Copying client build to dist/public...');
  const clientDistPath = path.resolve('./client/dist');
  const distPublicPath = path.resolve('./dist/public');
  
  if (fs.existsSync(clientDistPath)) {
    // Copy files
    fs.readdirSync(clientDistPath).forEach(file => {
      const srcFile = path.join(clientDistPath, file);
      const destFile = path.join(distPublicPath, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied: ${file}`);
    });
    console.log('✅ Copy complete');
  } else {
    console.error('❌ Client dist directory not found');
    process.exit(1);
  }
  
  // Build server
  console.log('📦 Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  console.log('✅ Server build complete');
  
  console.log('🎉 Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
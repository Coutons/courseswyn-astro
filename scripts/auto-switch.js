#!/usr/bin/env node

/**
 * Auto Switch Mode Script for CourseWyn Astro
 * Switches between development (server) and production (static) modes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DEV = path.join(__dirname, '..', 'astro.config.dev.mjs');
const CONFIG_PROD = path.join(__dirname, '..', 'astro.config.prod.mjs');
const CONFIG_MAIN = path.join(__dirname, '..', 'astro.config.mjs');
const CONFIG_BACKUP = path.join(__dirname, '..', 'astro.config.backup.mjs');

// Server routes that need to be disabled in production
const SERVER_ROUTES = [
  'src/pages/admin/index.astro',
  'src/pages/admin/coupons/create/index.astro',
  'src/pages/admin/coupons/edit/[id].astro',
  'src/pages/admin/blog/index.astro',
  'src/pages/admin/blog/create/index.astro',
  'src/pages/admin/blog/edit/[slug].astro',
  'src/pages/admin/instructors/index.astro'
];

function getCurrentMode() {
  try {
    const configContent = fs.readFileSync(CONFIG_MAIN, 'utf8');

    if (configContent.includes("output: 'server'")) {
      return 'development';
    } else if (configContent.includes("output: 'static'")) {
      return 'production';
    } else {
      return 'unknown';
    }
  } catch (error) {
    console.error('Error reading current config:', error.message);
    return 'unknown';
  }
}

function disableServerRoutes() {
  console.log('🔧 Disabling server routes for static deployment...');
  SERVER_ROUTES.forEach(route => {
    const routePath = path.join(__dirname, '..', route);
    const disabledPath = routePath + '.disabled';

    try {
      if (fs.existsSync(routePath)) {
        fs.renameSync(routePath, disabledPath);
        console.log(`   📁 Disabled: ${route}`);
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not disable ${route}:`, error.message);
    }
  });
}

function enableServerRoutes() {
  console.log('🔧 Enabling server routes for development...');
  SERVER_ROUTES.forEach(route => {
    const routePath = path.join(__dirname, '..', route);
    const disabledPath = routePath + '.disabled';

    try {
      if (fs.existsSync(disabledPath)) {
        fs.renameSync(disabledPath, routePath);
        console.log(`   📁 Enabled: ${route}`);
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not enable ${route}:`, error.message);
    }
  });
}

function switchToDev() {
  try {
    console.log('🔄 Switching to DEVELOPMENT MODE (Server)...');

    // Enable server routes first
    enableServerRoutes();

    // Copy dev config to main config
    const devConfig = fs.readFileSync(CONFIG_DEV, 'utf8');
    fs.writeFileSync(CONFIG_MAIN, devConfig);

    console.log('✅ Successfully switched to development mode');
    console.log('📝 Current mode: Server mode with @astrojs/node adapter');
    console.log('🚀 Run: npm run dev');
    console.log('🔧 Supports: API routes, dynamic GET functions, admin editing');

  } catch (error) {
    console.error('❌ Error switching to dev mode:', error.message);
    process.exit(1);
  }
}

function switchToProd() {
  try {
    console.log('🔄 Switching to PRODUCTION MODE (Static)...');

    // Disable server routes first
    disableServerRoutes();

    // Copy prod config to main config
    const prodConfig = fs.readFileSync(CONFIG_PROD, 'utf8');
    fs.writeFileSync(CONFIG_MAIN, prodConfig);

    console.log('✅ Successfully switched to production mode');
    console.log('📝 Current mode: Static mode for GitHub Pages');
    console.log('🚀 Run: npm run build && npm run preview');
    console.log('🔧 Optimized for: Static hosting, fast loading');
    console.log('⚠️  Note: Admin features disabled in production');

  } catch (error) {
    console.error('❌ Error switching to prod mode:', error.message);
    process.exit(1);
  }
}

function showStatus() {
  const mode = getCurrentMode();

  console.log('📊 Current Astro Mode Status:');

  if (mode === 'development') {
    console.log('   Mode: DEVELOPMENT');
    console.log('   Output: Server');
    console.log('   Adapter: @astrojs/node');
    console.log('   Use case: Development with full features');
  } else if (mode === 'production') {
    console.log('   Mode: PRODUCTION');
    console.log('   Output: Static');
    console.log('   Adapter: None');
    console.log('   Use case: Production deployment');
  } else {
    console.log('   Mode: UNKNOWN');
    console.log('   Status: Cannot determine current mode');
  }
}

function createBackup() {
  try {
    if (fs.existsSync(CONFIG_MAIN)) {
      fs.copyFileSync(CONFIG_MAIN, CONFIG_BACKUP);
      console.log('✅ Backup created: astro.config.backup.mjs');
    } else {
      console.log('❌ Main config file not found');
    }
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
  }
}

function restoreBackup() {
  try {
    if (fs.existsSync(CONFIG_BACKUP)) {
      fs.copyFileSync(CONFIG_BACKUP, CONFIG_MAIN);
      console.log('✅ Backup restored: astro.config.mjs');
    } else {
      console.log('❌ Backup file not found');
    }
  } catch (error) {
    console.error('❌ Error restoring backup:', error.message);
  }
}

function showHelp() {
  console.log('🔧 CourseWyn Astro Mode Switcher');
  console.log('');
  console.log('Usage: node scripts/auto-switch.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  dev      - Switch to development mode (server)');
  console.log('  prod     - Switch to production mode (static)');
  console.log('  status   - Show current mode status');
  console.log('  backup   - Create backup of current config');
  console.log('  restore  - Restore from backup');
  console.log('  help     - Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/auto-switch.js dev');
  console.log('  node scripts/auto-switch.js prod');
  console.log('  node scripts/auto-switch.js status');
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'dev':
    switchToDev();
    break;
  case 'prod':
    switchToProd();
    break;
  case 'status':
    showStatus();
    break;
  case 'backup':
    createBackup();
    break;
  case 'restore':
    restoreBackup();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (!command) {
      showHelp();
    } else {
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run "node scripts/auto-switch.js help" for available commands');
      process.exit(1);
    }
}

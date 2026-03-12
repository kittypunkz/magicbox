#!/usr/bin/env node

/**
 * MagicBox Deployment Trigger
 * 
 * Usage:
 *   node trigger-deploy.js                    # Deploy full
 *   node trigger-deploy.js backend            # Deploy backend only
 *   node trigger-deploy.js frontend           # Deploy frontend only
 *   node trigger-deploy.js migrate            # Run migrations
 *   node trigger-deploy.js --token=xxx        # Use custom GitHub token
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const CONFIG = {
  owner: null,  // Will be extracted from git remote
  repo: null,   // Will be extracted from git remote
  workflow: 'manual-deploy.yml',
  branch: 'main'
};

// Parse arguments
function parseArgs() {
  const args = {
    component: 'full',
    environment: 'production',
    skipTests: false,
    token: process.env.GITHUB_TOKEN
  };

  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--token=')) {
      args.token = arg.split('=')[1];
    } else if (arg.startsWith('--env=')) {
      args.environment = arg.split('=')[1];
    } else if (arg === '--skip-tests') {
      args.skipTests = true;
    } else if (!arg.startsWith('--')) {
      args.component = arg;
    }
  });

  return args;
}

// Get git remote info
function getGitInfo() {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec('git remote get-url origin', (error, stdout) => {
      if (error) {
        reject(new Error('Not a git repository or no remote origin'));
        return;
      }

      const url = stdout.trim();
      const match = url.match(/github\.com[:/](.+?)\/(.+?)\.git$/);
      
      if (match) {
        resolve({
          owner: match[1],
          repo: match[2]
        });
      } else {
        reject(new Error('Could not parse GitHub URL'));
      }
    });
  });
}

// Trigger workflow
function triggerWorkflow(token, owner, repo, inputs) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      ref: CONFIG.branch,
      inputs: inputs
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/actions/workflows/${CONFIG.workflow}/dispatches`,
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'magicbox-deploy'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204) {
          resolve({ success: true });
        } else if (res.statusCode === 401) {
          reject(new Error('Unauthorized: Invalid GitHub token'));
        } else if (res.statusCode === 404) {
          reject(new Error('Workflow not found. Make sure you have pushed the workflow file to GitHub.'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main
async function main() {
  console.log('🚀 MagicBox Deployment Trigger\n');

  try {
    // Parse arguments
    const args = parseArgs();
    
    // Get git info
    const gitInfo = await getGitInfo();
    CONFIG.owner = gitInfo.owner;
    CONFIG.repo = gitInfo.repo;
    
    console.log(`Repository: ${CONFIG.owner}/${CONFIG.repo}`);
    console.log(`Component: ${args.component}`);
    console.log(`Environment: ${args.environment}`);
    console.log('');

    // Check token
    if (!args.token) {
      console.error('❌ Error: GitHub token required');
      console.log('\nSet it via:');
      console.log('  1. Environment variable: export GITHUB_TOKEN=xxx');
      console.log('  2. Command argument: node trigger-deploy.js --token=xxx');
      console.log('\nGet your token from: https://github.com/settings/tokens');
      console.log('Required scopes: repo, workflow');
      process.exit(1);
    }

    // Confirm
    const confirm = await new Promise(resolve => {
      rl.question(`Trigger deployment? (yes/no): `, answer => {
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });

    if (!confirm) {
      console.log('Cancelled.');
      process.exit(0);
    }

    // Trigger workflow
    console.log('\n📤 Triggering deployment...\n');
    
    await triggerWorkflow(args.token, CONFIG.owner, CONFIG.repo, {
      component: args.component,
      environment: args.environment,
      skip_tests: args.skipTests ? 'true' : 'false'
    });

    console.log('✅ Deployment triggered successfully!');
    console.log('');
    console.log('📊 Check status at:');
    console.log(`  https://github.com/${CONFIG.owner}/${CONFIG.repo}/actions`);
    console.log('');
    console.log('🔗 Your app will be available at:');
    console.log('  https://magicbox.bankapirak.com');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

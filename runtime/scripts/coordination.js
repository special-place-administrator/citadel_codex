#!/usr/bin/env node

/**
 * File-based coordination for concurrent campaign and fleet work.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.CITADEL_PROJECT_DIR || process.cwd();
const STATE_DIR = path.join(ROOT, '.citadel');
const COORD_DIR = path.join(STATE_DIR, 'coordination');
const INSTANCES_DIR = path.join(COORD_DIR, 'instances');
const CLAIMS_DIR = path.join(COORD_DIR, 'claims');
const STALE_INSTANCE_MS = 2 * 60 * 60 * 1000;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function listJsonFiles(dir) {
  ensureDir(dir);
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.json') && !name.startsWith('.'))
    .map(name => ({
      name,
      path: path.join(dir, name),
      data: readJson(path.join(dir, name)),
    }))
    .filter(entry => entry.data !== null);
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function normalizeScopeEntry(entry) {
  return entry.replace(/\(read-only\)$/, '').trim();
}

function scopesOverlap(scopeA, scopeB) {
  for (const a of scopeA) {
    if (a.endsWith('(read-only)')) continue;
    const cleanA = normalizeScopeEntry(a);
    for (const b of scopeB) {
      if (b.endsWith('(read-only)')) continue;
      const cleanB = normalizeScopeEntry(b);
      if (cleanA.startsWith(cleanB) || cleanB.startsWith(cleanA)) return true;
    }
  }
  return false;
}

function generateId() {
  const id = `agent-${crypto.randomBytes(4).toString('hex')}`;
  console.log(id);
}

function register(id) {
  ensureDir(INSTANCES_DIR);
  const now = new Date().toISOString();
  writeJsonAtomic(path.join(INSTANCES_DIR, `${id}.json`), {
    instanceId: id,
    startedAt: now,
    lastSeen: now,
    status: 'active',
    pid: process.ppid || process.pid,
    sessionSlug: null,
  });
  console.log(`Registered instance: ${id}`);
}

function unregister(id) {
  const instanceFile = path.join(INSTANCES_DIR, `${id}.json`);
  if (fs.existsSync(instanceFile)) fs.unlinkSync(instanceFile);
  const claimFile = path.join(CLAIMS_DIR, `${id}.json`);
  if (fs.existsSync(claimFile)) fs.unlinkSync(claimFile);
  console.log(`Unregistered instance: ${id}`);
}

function heartbeat(id) {
  const file = path.join(INSTANCES_DIR, `${id}.json`);
  const data = readJson(file);
  if (!data) {
    console.error(`Instance not found: ${id}`);
    process.exit(1);
  }
  data.lastSeen = new Date().toISOString();
  writeJsonAtomic(file, data);
}

function claim(id, scope, type, desc) {
  ensureDir(CLAIMS_DIR);
  const existingClaims = listJsonFiles(CLAIMS_DIR);
  for (const existing of existingClaims) {
    if (existing.data.instanceId === id) continue;
    if (scopesOverlap(scope, existing.data.scope || [])) {
      console.error(`Scope overlap with ${existing.data.instanceId}: ${(existing.data.scope || []).join(', ')}`);
      process.exit(1);
    }
  }
  writeJsonAtomic(path.join(CLAIMS_DIR, `${id}.json`), {
    instanceId: id,
    type: type || 'unknown',
    scope,
    description: desc || '',
    claimedAt: new Date().toISOString(),
  });
  console.log(`Claimed scope: ${scope.join(', ')}`);
}

function release(id) {
  const file = path.join(CLAIMS_DIR, `${id}.json`);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Released claim for: ${id}`);
    return;
  }
  console.log(`No claim found for: ${id}`);
}

function checkOverlap(scope) {
  const existingClaims = listJsonFiles(CLAIMS_DIR);
  for (const existing of existingClaims) {
    if (scopesOverlap(scope, existing.data.scope || [])) {
      console.log(`OVERLAP with ${existing.data.instanceId}: ${(existing.data.scope || []).join(', ')}`);
      process.exit(1);
    }
  }
  console.log('No overlap detected');
}

function sweep() {
  const instances = listJsonFiles(INSTANCES_DIR);
  const now = Date.now();
  let cleaned = 0;

  for (const instance of instances) {
    const lastSeen = new Date(instance.data.lastSeen).getTime();
    const isStale = now - lastSeen > STALE_INSTANCE_MS;
    const isDead = instance.data.pid && !isProcessAlive(instance.data.pid);
    if (!isStale && !isDead) continue;

    fs.unlinkSync(instance.path);
    const claimFile = path.join(CLAIMS_DIR, instance.name);
    if (fs.existsSync(claimFile)) fs.unlinkSync(claimFile);
    cleaned += 1;
    console.log(`Swept: ${instance.data.instanceId} (${isDead ? 'dead process' : 'stale'})`);
  }

  console.log(`Sweep complete. Cleaned ${cleaned} instance(s).`);
}

function status() {
  const instances = listJsonFiles(INSTANCES_DIR);
  const claims = listJsonFiles(CLAIMS_DIR);

  console.log('\n=== Active Instances ===');
  if (instances.length === 0) console.log('  (none)');
  for (const instance of instances) {
    console.log(`  ${instance.data.instanceId} | status: ${instance.data.status} | since: ${instance.data.startedAt}`);
  }

  console.log('\n=== Active Claims ===');
  if (claims.length === 0) console.log('  (none)');
  for (const claimEntry of claims) {
    console.log(`  ${claimEntry.data.instanceId} | scope: ${(claimEntry.data.scope || []).join(', ')} | type: ${claimEntry.data.type}`);
  }
  console.log('');
}

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  args.command = argv[0];

  for (let i = 1; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--id') {
      args.id = value;
      i += 1;
    } else if (key === '--scope') {
      args.scope = value.split(',').map(entry => entry.trim());
      i += 1;
    } else if (key === '--type') {
      args.type = value;
      i += 1;
    } else if (key === '--desc') {
      args.desc = value;
      i += 1;
    }
  }

  return args;
}

const args = parseArgs();

switch (args.command) {
  case 'generate-id':
    generateId();
    break;
  case 'register':
    register(args.id);
    break;
  case 'unregister':
    unregister(args.id);
    break;
  case 'heartbeat':
    heartbeat(args.id);
    break;
  case 'claim':
    claim(args.id, args.scope || [], args.type, args.desc);
    break;
  case 'release':
    release(args.id);
    break;
  case 'check-overlap':
    checkOverlap(args.scope || []);
    break;
  case 'sweep':
    sweep();
    break;
  case 'status':
    status();
    break;
  default:
    console.log('Usage: node runtime/scripts/coordination.js <command> [options]');
    console.log('Commands: generate-id, register, unregister, heartbeat, claim, release, check-overlap, sweep, status');
    process.exit(1);
}

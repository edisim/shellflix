const fs = require('node:fs');
const path = require('node:path');

const lifecycleScripts = new Set(['preinstall', 'install', 'postinstall', 'prepare']);
let changed = 0;

function scrubPackageJson(file) {
  let pkg;

  try {
    pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return;
  }

  if (!pkg.scripts) {
    return;
  }

  let dirty = false;

  for (const scriptName of Object.keys(pkg.scripts)) {
    if (lifecycleScripts.has(scriptName)) {
      delete pkg.scripts[scriptName];
      dirty = true;
    }
  }

  if (!dirty) {
    return;
  }

  if (Object.keys(pkg.scripts).length === 0) {
    delete pkg.scripts;
  }

  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  changed += 1;
}

function walkNodeModules(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, entry);

    if (!fs.lstatSync(fullPath).isDirectory()) {
      continue;
    }

    if (entry.startsWith('@')) {
      walkNodeModules(fullPath);
      continue;
    }

    const packageFile = path.join(fullPath, 'package.json');

    if (fs.existsSync(packageFile)) {
      scrubPackageJson(packageFile);
    }

    walkNodeModules(path.join(fullPath, 'node_modules'));
  }
}

walkNodeModules(path.resolve('node_modules'));

for (const optionalNative of [
  'node_modules/bufferutil',
  'node_modules/utf-8-validate',
  'node_modules/shellflix-webtorrent-cli/node_modules/bufferutil',
  'node_modules/shellflix-webtorrent-cli/node_modules/utf-8-validate'
]) {
  fs.rmSync(optionalNative, {recursive: true, force: true});
}

console.log(`Scrubbed lifecycle scripts in ${changed} bundled package.json files.`);

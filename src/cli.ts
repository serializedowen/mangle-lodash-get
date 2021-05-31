#!/usr/bin/env node

import path from 'path';
import execa from 'execa';

const jscodeshiftExecutable = require.resolve('.bin/jscodeshift');

process.argv.shift();
process.argv.shift();

const args = [
  ...process.argv,
  '-t',
  path.resolve(__dirname, './transformer.js'),
  '--parser',
  'babylon',
  '--parser-config',
  path.resolve(__dirname, '../babylon.config.json'),
];

console.log(`Running jscodeshift with: ${args.join(' ')}`);

execa(jscodeshiftExecutable, args, {
  stdio: 'inherit',
}).catch((err) => console.error(err));

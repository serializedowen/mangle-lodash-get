#!/usr/bin/env node

import path from 'path';
import execa from 'execa';
import isGitClean from 'is-git-clean';
import { exit } from 'process';
import { green, red, yellow } from 'chalk';
const jscodeshiftExecutable = require.resolve('.bin/jscodeshift');

process.argv.shift();
process.argv.shift();

let target = process.argv.shift();

if (!target) {
  console.log(
    yellow(`======== Warning ========
Directory or file not provided, running mangle-lodash-get in current working directory.`)
  );

  target = process.cwd();
}

isGitClean(target).then(() => {
  const args = [
    '-t',
    path.resolve(__dirname, './transformer.js'),
    '--parser',
    'babylon',
    '--parser-config',
    path.resolve(__dirname, '../babylon.config.json'),
    '--extensions=tsx,ts,jsx,js',

    target,
  ];

  console.log(green(`Running jscodeshift with: ${args.join(' ')}`));

  execa(jscodeshiftExecutable, args, {
    stdio: 'inherit',
  }).catch((err) => console.error(err));
});

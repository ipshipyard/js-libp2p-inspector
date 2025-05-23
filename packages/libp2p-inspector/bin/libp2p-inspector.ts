#! /usr/bin/env node

import { execSync } from 'node:child_process'

execSync('npx electron ./dist/src/main/index.js')

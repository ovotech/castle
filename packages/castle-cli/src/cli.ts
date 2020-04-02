#!/usr/bin/env node

import { castle } from './commands/castle';

castle().parse(process.argv);

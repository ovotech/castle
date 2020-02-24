#!/usr/bin/env node

import * as command from 'commander';
import { convert } from './convert';

convert(command).parse(process.argv);

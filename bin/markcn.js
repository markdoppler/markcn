#!/usr/bin/env node
import { program } from 'commander';
import initCommand from './commands/init.js';
import addCommand from './commands/add/index.js';

process.noDeprecation = true;

// CLI version configuration and description
program
  .version('1.0.0')
  .description('CLI to initialize and add basic configurations');

program
  .command('test')
  .description('Initialize a project with Express and create app.js')
  .action(async () => {
    console.log("test2")
  });

// Define the "init" command
program
  .command('init')
  .description('Initialize a project with Express and create app.js')
  .action(initCommand);

// Define the "add <module>" command
program
  .command('add <module>')
  .description('Add a module to the project (for example: db)')
  .action(addCommand);

// If the command is not recognized
program.on('command:*', () => {
  console.error('Invalid command. Use "init" or "add <module>".');
  process.exit(1);
});

// Parse CLI arguments
program.parse(process.argv);

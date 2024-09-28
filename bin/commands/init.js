import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import fs from 'fs/promises'; // Use fs promises for asynchronous file system operations
import path from 'path';
import { __dirname, readTemplateFile } from '../util/util.js'; // Import the __dirname variable
import inquirer from 'inquirer';
import { logMessage } from '../libs/chalk.js';

const exec = promisify(execCallback); // Promisify the exec function to use it with async/await

async function initScript({ moduleType }) {

    console.log({ moduleType })

    try {
      logMessage('Running the "init" command...', 'cyan');
  
      // Step 1: Initialize npm
      await exec('npm init -y');
      logMessage('npm initialized.', 'green');
  
      // Step 2: Install Express
      await exec('npm install express');
      logMessage('Express installed.', 'green');
  
      // Install dotenv package for environment variables management
      await exec('npm install dotenv');
      logMessage('DotEnv installed.', 'green');
  
      // **Additional Step: Install nodemon as a development dependency**
      await exec('npm install nodemon --save-dev');
      logMessage('nodemon installed as a development dependency.', 'green');
  
      // Step 3: Create necessary directories
      await fs.mkdir(path.join('src', 'libs'), { recursive: true });
      logMessage('Directory src/libs created.', 'green');
  
      await fs.mkdir(path.join('src', 'services'), { recursive: true });
      logMessage('Directory src/services created.', 'green');
  
      await fs.mkdir(path.join('src', 'controllers'), { recursive: true });
      logMessage('Directory src/controllers created.', 'green');
  
      // Adjust the path to the templates folder
      const templatesDir = path.join(__dirname, '../templates/init');
      logMessage(`Templates directory: ${templatesDir}`, 'blue');
  
      // Step 4: Read and write src/libs/express.js from the template
      const expressLibTemplate = await readTemplateFile('express', moduleType, templatesDir);
      await fs.writeFile(path.join('src', 'libs', 'express.js'), expressLibTemplate);
      logMessage('File src/libs/express.js created from the template.', 'green');
  
      // Step 6: Read and write app.js from the template
      const appTemplate = await readTemplateFile('app', moduleType, templatesDir);
      await fs.writeFile('app.js', appTemplate);
      logMessage('File app.js created from the template.', 'green');
  
      // Agregar service y controller
      const serviceTemplate = await readTemplateFile('service', moduleType, templatesDir);
      await fs.writeFile(path.join('src', 'services', 'test.service.js'), serviceTemplate);
  
      const controllerTemplate = await readTemplateFile('controller', moduleType, templatesDir);
      await fs.writeFile(path.join('src', 'controllers', 'test.controller.js'), controllerTemplate);
  
      // Add the .env file from the template
      const envTemplatePath = path.join(templatesDir, 'env');
      const envTemplate = await fs.readFile(envTemplatePath, 'utf8');
      await fs.writeFile('.env', envTemplate);
  
      // **Step 7: Modify package.json to add the "dev" script**
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonData);
  
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.dev = 'nodemon --require dotenv/config app.js';
      packageJson.type = moduleType === 'ESM' ? 'module' : 'commonjs';
  
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      logMessage('Script "dev" added to package.json.', 'green');
  
      // **Step 8: Initialize a Git repository**
      await exec('git init');
      logMessage('Git repository initialized.', 'green');
  
      // **Step 9: Copy .gitignore from templates**
      const gitignoreTemplatePath = path.join(templatesDir, 'gitignore');
      const gitignoreTemplate = await fs.readFile(gitignoreTemplatePath, 'utf8');
      await fs.writeFile('.gitignore', gitignoreTemplate);
      logMessage('.gitignore file created from the template.', 'green');
  
      logMessage('Project initialized successfully!', 'green');
    } catch (error) {
      logMessage(`Error during initialization: ${error.message}`, 'red');
    }
  }
  

async function initCommand({ str, options }) {

    inquirer
        .prompt([
            {
                type: 'list',
                name: 'moduleType',
                message: 'Which module type will you use?',
                choices: ['ESM', 'CommonJS'],
            },
            // {
            //     type: 'list', 
            //     name: 'selection', 
            //     message: 'Please select an option:', 
            //     choices: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            // },
        ])
        .then((answers) => {

            // Here you can handle the selected options
            console.log(`Selected module type: ${answers.moduleType}`);

            initScript(answers);

        })
        .catch((error) => {
            console.error('An error occurred:', error);
        });

    console.log({ str, options });

    return;


}

export default initCommand;

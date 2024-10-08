import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import fs from 'fs/promises'; // Use fs promises for asynchronous file system operations
import path from 'path';
import { __dirname, readTemplateFile, addEnvVariable } from '../util/util.js'; // Import the __dirname variable
import inquirer from 'inquirer';
import { logMessage } from '../libs/chalk.js';

const exec = promisify(execCallback); // Promisify the exec function to use it with async/await

async function initScript({ moduleType, openAiApiKey }) {

    try {
        logMessage('Running the "init" command...', null, 'cyan');

        // Step 1: Initialize npm
        await exec('npm init -y');
        logMessage('NPM initialized.');

        // Step 2: Install Express
        await exec('npm install express');
        logMessage('express installed.', 'npm');

        // Install dotenv package for environment variables management
        await exec('npm install dotenv');
        logMessage('dotenv installed.', 'npm');

        // **Additional Step: Install nodemon as a development dependency**
        await exec('npm install nodemon --save-dev');
        logMessage('nodemon installed as a development dependency.', 'npm');

        // Step 3: Create necessary directories
        await fs.mkdir(path.join('src', 'libs'), { recursive: true });
        logMessage('Directory src/libs created.', 'write');

        await fs.mkdir(path.join('src', 'services'), { recursive: true });
        logMessage('Directory src/services created.', 'write');

        await fs.mkdir(path.join('src', 'controllers'), { recursive: true });
        logMessage('Directory src/controllers created.', 'write');

        // Adjust the path to the templates folder
        const templatesDir = path.join(__dirname, '../templates/init');

        // Step 4: Read and write src/libs/express.js from the template
        const expressLibTemplate = await readTemplateFile('express', moduleType, templatesDir);
        await fs.writeFile(path.join('src', 'libs', 'express.js'), expressLibTemplate);
        logMessage('File src/libs/express.js created.', 'write');

        // Step 6: Read and write app.js from the template
        const appTemplate = await readTemplateFile('app', moduleType, templatesDir);
        await fs.writeFile('app.js', appTemplate);
        logMessage('File app.js created.', 'write');

        // Agregar service y controller
        const serviceTemplate = await readTemplateFile('service', moduleType, templatesDir);
        await fs.writeFile(path.join('src', 'services', 'test.service.js'), serviceTemplate);

        const controllerTemplate = await readTemplateFile('controller', moduleType, templatesDir);
        await fs.writeFile(path.join('src', 'controllers', 'test.controller.js'), controllerTemplate);

        // Add the .env file from the template
        const envTemplatePath = path.join(templatesDir, 'env');
        const envTemplate = await fs.readFile(envTemplatePath, 'utf8');
        await fs.writeFile('.env', envTemplate);

        // Add the OpenAI API_KEY to the .env file
        if (openAiApiKey) {
            await addEnvVariable('MARKCN_OPENAI_API_KEY', openAiApiKey);
        }

        // **Step 7: Modify package.json to add the "dev" script**
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonData);

        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts.dev = 'nodemon --require dotenv/config app.js';
        packageJson.type = moduleType === 'ESM' ? 'module' : 'commonjs';

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        logMessage('Script "dev" added to package.json.', "write");

        // **Step 8: Initialize a Git repository**
        await exec('git init');
        logMessage('Git repository initialized.');

        // **Step 9: Copy .gitignore from templates**
        const gitignoreTemplatePath = path.join(templatesDir, 'gitignore');
        const gitignoreTemplate = await fs.readFile(gitignoreTemplatePath, 'utf8');
        await fs.writeFile('.gitignore', gitignoreTemplate);
        logMessage('.gitignore file created from the template.', "write");

        logMessage('Project initialized successfully!');

    } catch (error) {
        logMessage(`Error during initialization: ${error.message}`, "error");
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
            {
                type: 'input',
                name: 'openAiApiKey',
                message: 'Please enter your OpenAI API_KEY (leave blank to skip AI options):',
                default: '',
            }
        ])
        .then((answers) => {

            // Here you can handle the selected options
            console.log(`Selected module type: ${answers.moduleType}`);

            initScript(answers);

        })
        .catch((error) => {
            console.error('An error occurred:', error);
        });

}

export default initCommand;

import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logMessage } from '../../libs/chalk.js'; // Adjust the path as necessary
import { __dirname, getModuleType, getRootPath, fileExists, addImport, capitalize } from '../../util/util.js'; // Reuse fileExists from util.js

const addController = async () => {

  try {
    // Step 1: Ask the user for the controller name
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'controllerName',
        message: 'Please enter the name of the controller:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Controller name cannot be empty.';
          }
          return true;
        },
      },
    ]);

    const controllerName = answers.controllerName.trim();
    const moduleType = await getModuleType();

    // Step 2: Define the file name and path
    const fileName = `${controllerName}.controller.js`;
    const rootPath = await getRootPath();
    const filePath = path.join(rootPath, 'src', 'controllers', fileName);

    // Step 3: Check if the file already exists using fileExists
    const fileAlreadyExists = await fileExists(filePath);
    if (fileAlreadyExists) {
      logMessage(`Error: Controller file already exists at ${filePath}. Operation aborted.`, 'red');
      return; // Stop execution if the file already exists
    }

    // Step 4: Create the /src/controllers folder if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Step 5: Prepare the template content

    const esmTemplateContent = `import { app } from "../libs/express.js";

app.get('/${controllerName}', (req, res) => {
    res.send('${capitalize(controllerName)} controller');
});`;

    const commonJsTemplateContent = `const { app } = require('../libs/express.js');

app.get('/${controllerName}', (req, res) => {
    res.send('${capitalize(controllerName)} controller');
});`;

    // Step 6: Write the template content to the controller file
    await fs.writeFile(filePath, moduleType === 'ESM' ? esmTemplateContent : commonJsTemplateContent);
    logMessage(`Controller file created at ${filePath}`, 'green');

    // Step 7: Import the new controller in app.js
    const importPath = `./src/controllers/${fileName}`;
    await addImport(importPath);
    logMessage(`Controller imported in app.js`, 'green');
  } catch (error) {
    logMessage(`Error creating controller: ${error.message}`, 'red');
  }
};

export { addController };
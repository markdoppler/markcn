import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logMessage } from '../../libs/chalk.js'; // Ajusta la ruta según sea necesario
import { __dirname, getModuleType, getRootPath, fileExists } from '../../util/util.js'; // Reutiliza fileExists de util.js

const addController = async () => {

  try {
    // Step 1: Solicitar el nombre del controller al usuario
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

    // Step 2: Definir el nombre del archivo y la ruta
    const fileName = `${controllerName}.controller.js`;
    const rootPath = await getRootPath();
    const filePath = path.join(rootPath, 'src', 'controllers', fileName);

    // Step 3: Verificar si el archivo ya existe utilizando fileExists
    const fileAlreadyExists = await fileExists(filePath);
    if (fileAlreadyExists) {
      logMessage(`Error: Controller file already exists at ${filePath}. Operation aborted.`, 'red');
      return; // Detener ejecución si el archivo ya existe
    }

    // Step 4: Crear la carpeta /src/controllers si no existe
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Step 5: Preparar el contenido de la plantilla
    const controllerVariableName = `${controllerName}Controller`;

    const esmTemplateContent = `const ${controllerVariableName} = {};

${controllerVariableName}.helloWorld = (req, res) => {
    res.send('Hello World from ${controllerName} controller!');
};

export default ${controllerVariableName};
`;

    const commonJsTemplateContent = `const ${controllerVariableName} = {};

${controllerVariableName}.helloWorld = (req, res) => {
    res.send('Hello World from ${controllerName} controller!');
}

module.exports = ${controllerVariableName};
`;

    // Step 6: Escribir el contenido de la plantilla en el archivo del controller
    await fs.writeFile(filePath, moduleType === 'ESM' ? esmTemplateContent : commonJsTemplateContent);
    logMessage(`Controller file created at ${filePath}`, 'green');
  } catch (error) {
    logMessage(`Error creating controller: ${error.message}`, 'red');
  }
};

export { addController };

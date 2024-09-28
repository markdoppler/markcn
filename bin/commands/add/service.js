import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logMessage } from '../../libs/chalk.js'; // Ajusta la ruta según sea necesario
import { __dirname, getModuleType, getRootPath, fileExists } from '../../util/util.js'; // Reutiliza fileExists de util.js

const addService = async () => {

  try {
    // Step 1: Solicitar el nombre del servicio al usuario
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serviceName',
        message: 'Please enter the name of the service:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Service name cannot be empty.';
          }
          return true;
        },
      },
    ]);

    const serviceName = answers.serviceName.trim();
    const moduleType = await getModuleType();

    // Step 2: Definir el nombre del archivo y la ruta
    const fileName = `${serviceName}.service.js`;
    const rootPath = await getRootPath();
    const filePath = path.join(rootPath, 'src', 'services', fileName);

    // Step 3: Verificar si el archivo ya existe utilizando fileExists
    const fileAlreadyExists = await fileExists(filePath);
    if (fileAlreadyExists) {
      logMessage(`Error: Service file already exists at ${filePath}. Operation aborted.`, 'red');
      return; // Detener ejecución si el archivo ya existe
    }

    // Step 4: Crear la carpeta /src/services si no existe
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Step 5: Preparar el contenido de la plantilla
    const serviceVariableName = `${serviceName}Service`;

    const esmTemplateContent = `const ${serviceVariableName} = {};

${serviceVariableName}.helloWorld = () => {
    return 'Hello World!';
};

export default ${serviceVariableName};
`;

    const commonJsTemplateContent = `const ${serviceVariableName} = {};

${serviceVariableName}.helloWorld = () => {
    return 'Hello World!';
}

module.exports = ${serviceVariableName};
`;

    // Step 6: Escribir el contenido de la plantilla en el archivo del servicio
    await fs.writeFile(filePath, moduleType === 'ESM' ? esmTemplateContent : commonJsTemplateContent);
    logMessage(`Service file created at ${filePath}`, 'green');
  } catch (error) {
    logMessage(`Error creating service: ${error.message}`, 'red');
  }
};

export { addService };

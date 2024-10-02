import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logMessage } from '../../libs/chalk.js';
import { __dirname, getModuleType, getRootPath, fileExists, openaiResponseFormat, getEnvVariable, capitalize } from '../../util/util.js';
import { z } from 'zod';

const generateServiceFunctions = async (serviceName, prompt) => {

  logMessage('Generating functions using AI...');

  const serviceFunctionsSchema = z.object({
    functions: z.array(
      z.object({
        functionName: z.string(),
        parameters: z.array(z.object({
          name: z.string(),
        }))
      })
    )
  });

  const { functions } = await openaiResponseFormat({
    schema: serviceFunctionsSchema,
    prompt: `Create a service with functions for ${serviceName}, ${prompt}`,
    instruction: `
      You are a NodeJS Express service function generator AI. Convert the user input into a function, or generate a basic crud if none were provided.
      
      Don't use these words: if, else, switch, case, break, continue, function, var, let, const, this, new, delete, try, catch, finally, throw, async, await, import, export, from, as, default, extends, super, static, get, set, yield, with, do, implements, interface, package, private, protected, public

      The parameters of the function cannot be req, res, request, response

      The parameters of the function must be named in camelCase

      Function parameters should be clear and descriptive, not mixed with direct controller functions.

      The function name should be short and descriptive.
      `,
    zodName: 'serviceFunctions',
  });

  // logMessage for
  functions.forEach(({ functionName, parameters }) => {
    logMessage(`Function: ${functionName}({ ${parameters.map(({ name }) => name).join(', ')} })`, "write");
  });

  return functions;

};

const generateServiceTemplate = (serviceName, functions, moduleType) => {

  const commonJsTemplateContent = `const ${serviceName}Service = {};

${functions ? functions.map(({ functionName, parameters }) => {
    return `${serviceName}Service.${functionName} = ({ ${parameters.map(({ name }) => name).join(', ')} }) => {
  // Implement the ${functionName} function here
};`;
  }).join('\n\n') : ""} 

export default ${serviceName}Service;`;

  const esmTemplateContent = `const ${serviceName}Service = {};

${functions ? functions.map(({ functionName, parameters }) => `${serviceName}Service.${functionName} = ({ ${parameters.map(({ name }) => name).join(', ')} }) => {
  // Implement the ${functionName} function here
};`).join('\n\n') : `${serviceName}Service.get${capitalize(serviceName)} = async () => {
  // Implement the get${serviceName} function here
};`}

export default ${serviceName}Service;`;

  return moduleType === 'ESM' ? esmTemplateContent : commonJsTemplateContent;

};

const addService = async () => {
  try {

    const { value: MARKCN_OPENAI_API_KEY } = await getEnvVariable('MARKCN_OPENAI_API_KEY');

    // Step 1: Request the service name and if a prompt is desired
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serviceName',
        message: 'Please enter the name of the service:',
        parse: (input) => input.toLowerCase(),
        validate: (input) => {
          if (!input.trim()) {
            return 'Service name cannot be empty.';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'prompt',
        message: 'Please enter a prompt for the OpenAI API to generate functions (leave blank for automatic generation):',
        when: () => !!MARKCN_OPENAI_API_KEY
      },
    ]);

    const serviceName = answers.serviceName.trim();
    const moduleType = await getModuleType();

    // Step 2: Define the file name and path
    const rootPath = await getRootPath();

    const filePath = path.join(rootPath, 'src', 'services', `${serviceName}.service.js`);

    // Step 3: Check if the file already exists
    const fileAlreadyExists = await fileExists(filePath);

    if (fileAlreadyExists) {
      logMessage(`Error: Service file already exists at ${filePath}. Operation aborted.`, "error");
      return;
    }

    // Step 4: Create the /src/services folder if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Generate functions using OpenAI if a prompt is provided
    let functions;
    
    if(MARKCN_OPENAI_API_KEY){
      functions = await generateServiceFunctions(serviceName, answers.prompt);
    }

    const fileContent = generateServiceTemplate(serviceName, functions, moduleType);

    // Step 6: Write the generated content to the service file
    await fs.writeFile(filePath, fileContent);

    logMessage(`Service file created at ${filePath}`, 'write');

  } catch (error) {
    logMessage(`Error creating service: ${error.message}`, 'error');
  }
};

export { addService };
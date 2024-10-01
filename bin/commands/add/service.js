import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logMessage } from '../../libs/chalk.js';
import { __dirname, getModuleType, getRootPath, fileExists, openaiResponseFormat } from '../../util/util.js';
import { z } from 'zod';

const functionSchema = z.object({
  functions: z.array(
    z.object({
      functionName: z.string(),
      parameters: z.array(z.object({
        name: z.string(),
      }))
    })
  )
});

const addService = async () => {
  try {
    // Step 1: Request the service name and if a prompt is desired
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
      {
        type: 'input',
        name: 'prompt',
        message: 'Please enter a prompt for the OpenAI API to generate functions (leave blank for automatic generation):',
      },
    ]);

    const serviceName = answers.serviceName.trim();
    const prompt = `Create a service with functions for ${serviceName}, ${answers.prompt}`;
    const moduleType = await getModuleType();

    // Step 2: Define the file name and path
    const fileName = `${serviceName}.service.js`;
    const rootPath = await getRootPath();
    const filePath = path.join(rootPath, 'src', 'services', fileName);

    // Step 3: Check if the file already exists
    const fileAlreadyExists = await fileExists(filePath);
    if (fileAlreadyExists) {
      logMessage(`Error: Service file already exists at ${filePath}. Operation aborted.`, 'red');
      return;
    }

    // Step 4: Create the /src/services folder if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Step 5: Generate the service content
    let functionContent;

    // Generate functions using OpenAI if a prompt is provided
    const { functions } = await openaiResponseFormat({
      schema: functionSchema, // Define el esquema si es necesario
      prompt,
      instruction: `
        You are a NodeJS Express service function generator AI. Convert the user input into a function, or generate a basic crud if none were provided.
        
        Don't use these words: if, else, switch, case, break, continue, function, var, let, const, this, new, delete, try, catch, finally, throw, async, await, import, export, from, as, default, extends, super, static, get, set, yield, with, do, implements, interface, package, private, protected, public

        The parameters of the function cannot be req, res, request, response

        The parameters of the function must be named in camelCase

        Function parameters should be clear and descriptive, not mixed with direct controller functions
        `,
      zodName: 'serviceFunctions',
    });

    const commonJsTemplateContent = `const ${serviceName}Service = {};

    ${functions.map(({ functionName, parameters }) => {
      return `
        ${serviceName}Service.${functionName} = (${parameters.map(({ name }) => name).join('\n')}) => {
          // Implement the ${functionName} function here
        }
        `;
    })
      } 

    export default ${serviceName}Service;`;

    const esmTemplateContent = `const ${serviceName}Service = {};

${functions.map(({ functionName, parameters }) => `${serviceName}Service.${functionName} = ({ ${parameters.map(({ name }) => name).join(', ')} }) => {
  // Implement the ${functionName} function here
};`).join('\n\n')}

export default ${serviceName}Service;`;

    // Step 6: Write the generated content to the service file
    await fs.writeFile(filePath, moduleType === 'ESM' ? esmTemplateContent : commonJsTemplateContent);

    logMessage(`Service file created at ${filePath}`, 'green');

  } catch (error) {
    logMessage(`Error creating service: ${error.message}`, 'red');
  }
};

export { addService };
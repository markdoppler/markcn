import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import path from 'path';
import { logMessage } from '../libs/chalk.js';
import { zodResponseFormat } from "openai/helpers/zod";
import initOpenAI from '../libs/openai.js';

export const __filename = fileURLToPath(import.meta.url);

export const __dirname = dirname(__filename);

// Function to read a template file based on the module type and templates directory
export const readTemplateFile = async (filename, moduleType, templatesDir) => {
    const extension = moduleType === 'CommonJS' ? '.cjs' : '.js';
    const filePath = path.join(templatesDir, `${filename}${extension}`);
    return await fs.readFile(filePath, 'utf8');
};

// Function to determine the module type from package.json
export const getModuleType = async () => {
    try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonData);

        return packageJson.type === 'module' ? 'ESM' : 'CommonJS';
    } catch (error) {
        logMessage('Error reading package.json or determining module type. Defaulting to CommonJS.', 'yellow');
        return 'CommonJS'; // Default to CommonJS if there's an error
    }
};

// Function to get an environment variable from the .env file
export const getEnvVariable = async (key) => {
    const rootPath = await getRootPath(); // Use the getRootPath function to find the project root
    const envPath = path.join(rootPath, '.env');

    try {
        // Read the content of the .env file
        const envContent = await fs.readFile(envPath, 'utf8');

        // Split the content by lines
        const lines = envContent.split('\n');

        // Find the line that contains the variable
        const line = lines.find((line) => line.startsWith(`${key}=`));

        if (!line) {
            throw new Error(`Environment variable ${key} not found in .env file.`);
        }

        // Extract the value of the variable (after the "=")
        const value = line.split('=')[1]?.trim();

        if (!value) {
            throw new Error(`No value assigned to the environment variable ${key} in .env file.`);
        }

        return value;

    } catch (error) {
        logMessage(`Error reading environment variable ${key}: ${error.message}`, 'red');
        throw error;
    }
};

// Function to add an import statement to app.js based on the module type
export const addImport = async (importPath) => {
    try {
        const moduleType = await getModuleType();
        const rootPath = await getRootPath();

        // Define the path to app.js in the project root
        const appJsPath = path.join(rootPath, 'app.js');

        // Read the content of app.js
        let appJsContent = await fs.readFile(appJsPath, 'utf8');

        // Depending on the module type, check and add the import
        if (moduleType === 'ESM') {
            const esmImportStatement = `import '${importPath}';`;

            // Check if the import already exists
            if (!appJsContent.includes(esmImportStatement)) {
                // If it doesn't exist, add the import
                appJsContent += `\n${esmImportStatement}`;
                await fs.writeFile(appJsPath, appJsContent);
                logMessage(`${importPath} import added to app.js for ESM.`, 'green');
            } else {
                logMessage(`${importPath} import already exists in app.js for ESM.`, 'yellow');
            }
        } else if (moduleType === 'CommonJS') {
            const cjsRequireStatement = `require('${importPath}');`;

            // Check if the require already exists
            if (!appJsContent.includes(cjsRequireStatement)) {
                // If it doesn't exist, add the require
                appJsContent += `\n${cjsRequireStatement}`;
                await fs.writeFile(appJsPath, appJsContent);
                logMessage(`${importPath} import added to app.js for CommonJS.`, 'green');
            } else {
                logMessage(`${importPath} import already exists in app.js for CommonJS.`, 'yellow');
            }
        }
    } catch (error) {
        logMessage(`Error adding import to app.js: ${error.message}`, 'red');
    }
};

// Function to check if a file exists
export const fileExists = async (filePath) => {
    try {
        await fs.access(filePath); // Check if the file is accessible
        return true;
    } catch {
        return false;
    }
};

// Function to get the root path of the project
export const getRootPath = async (currentDir = process.cwd()) => {
    let dir = currentDir;
    while (!(await fileExists(path.join(dir, 'package.json')))) {
        const parentDir = path.dirname(dir);

        // Stop searching if we reach the root of the file system
        if (parentDir === dir) {
            throw new Error('No package.json found. Are you in the correct directory?');
        }

        // Check if we have reached a folder that contains node_modules, indicating the project root
        if (await fileExists(path.join(dir, 'node_modules'))) {
            throw new Error('Reached the boundary of your project (node_modules found).');
        }

        dir = parentDir;
    }

    return dir;
};

// Function to add a new environment variable to the .env file
export const addEnvVariable = async (key, value) => {
    const rootPath = await getRootPath();
    const envPath = path.join(rootPath, '.env');

    let envContent = '';

    try {
        // Read the existing content of the .env file
        envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
        logMessage('.env file does not exist. Creating a new one...', 'yellow');
    }

    // Check if the variable already exists in the .env file
    const variableExists = envContent.includes(`${key}=`);
    if (variableExists) {
        throw new Error(`The environment variable ${key} already exists in the .env file. It cannot be overwritten.`);
    }

    // Add the new environment variable
    envContent += `\n${key}=${value}`;

    // Write the updated content to the .env file
    await fs.writeFile(envPath, envContent);
    logMessage(`${key} added to .env file.`, 'green');
};

// Define the function that accepts the schema and prompt
export const openaiResponseFormat = async ({ schema, prompt, instruction, zodName }) => {

    const openai = await initOpenAI()

    const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: [
            {
                role: "system",
                content: instruction
            },
            { role: "user", content: prompt },
        ],
        response_format: zodResponseFormat(schema, zodName),
    });

    return completion.choices[0].message.parsed;

}

export const capitalize = (str) => {
    if (typeof str !== 'string' || str.length === 0) {
        return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
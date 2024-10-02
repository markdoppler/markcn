import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import mongoose from 'mongoose'; // Import mongoose for test connection
import { logMessage } from '../../libs/chalk.js'; // Ensure chalk is in libs
import { __dirname, addEnvVariable, addImport, getModuleType, getRootPath, readTemplateFile } from '../../util/util.js'; // Ensure __dirname and readTemplateFile are available

const exec = promisify(execCallback); // Promisify the exec function to use it with async/await

// Function to test MongoDB connection
const testMongoDBConnection = async (uri) => {
  try {
    logMessage('Testing MongoDB connection...');
    await mongoose.connect(uri, { });
    logMessage('MongoDB connection successful.');
    mongoose.connection.close();
    return true;
  } catch (error) {
    logMessage('MongoDB connection failed: ' + error.message, 'error');
    return false;
  }
};

// Function to install MongoDB using Mongoose
const installMongoDB = async (uri) => {
  try {
    
    logMessage('Installing MongoDB (Mongoose)...', 'npm');
    await exec('npm install mongoose'); // Install Mongoose for MongoDB

    // Read the module type (ESM or CommonJS) from package.json
    const moduleType = await getModuleType();

    // Define the templates directory
    const templatesDir = path.join(__dirname, '../templates/add/db');
    
    // Read the MongoDB configuration template using readTemplateFile
    const mongodbTemplate = await readTemplateFile('mongodb', moduleType, templatesDir); // Use the detected module type
    
    // Save the configuration file to src/libs/mongodb.js
    const rootPath = await getRootPath();
    await fs.writeFile(path.join(rootPath, 'src', 'libs', 'mongodb.js'), mongodbTemplate);
    logMessage('MongoDB configuration file created at src/libs/mongodb.js.', 'write');

    // Add the MongoDB import in app.js using the addImport function
    await addImport('./src/libs/mongodb.js'); // Call the generic function to add the import

    // Add the MONGODB_URI variable to the .env file
    await addEnvVariable('MONGODB_URI', uri); // Call the generic function to add the environment variable

  } catch (error) {
    logMessage(`Error during MongoDB installation: ${error.message}`, 'error');
  }
};

// Function that shows the database selection menu and requests credentials
const addDb = async () => {
  try {
    // Interactive menu to select the database
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'dbType',
        message: 'Which database would you like to add?',
        choices: ['MongoDB', 'MySQL'],
      },
    ]);

    // If MongoDB is selected, request connection details
    if (answers.dbType === 'MongoDB') {

      const mongoCredentials = await inquirer.prompt([
        { type: 'input', name: 'host', message: 'MongoDB Host (e.g., localhost):', default: 'localhost' },
        { type: 'input', name: 'port', message: 'MongoDB Port (e.g., 27017):', default: '27017' },
        { type: 'input', name: 'dbName', message: 'MongoDB Database Name:', default: 'test' },
        { type: 'input', name: 'user', message: 'MongoDB Username (leave empty if none):', default: '' },
        { type: 'password', name: 'password', message: 'MongoDB Password (leave empty if none):', mask: '*' },
      ]);

      // Build the MongoDB URI
      const uri = `mongodb://${mongoCredentials.user ? `${mongoCredentials.user}:${mongoCredentials.password}@` : ''}${mongoCredentials.host}:${mongoCredentials.port}/${mongoCredentials.dbName}`;

      // Test the connection with the provided details
      const connectionSuccess = await testMongoDBConnection(uri);

      if (connectionSuccess) {
        // If the connection is successful, proceed with installation
        await installMongoDB(uri);
      } else {
        logMessage('MongoDB setup aborted due to failed connection.', 'error');
      }
    } else if (answers.dbType === 'MySQL') {
      console.log('MySQL installation is not yet implemented.');
    }
  } catch (error) {
    logMessage(`Error: ${error.message}`, 'error');
  }
};

export { addDb };

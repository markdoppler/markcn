import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logMessage } from '../../libs/chalk.js'; // Adjust the path as needed
import { __dirname, getModuleType, getRootPath, fileExists, openaiResponseFormat, capitalize, getEnvVariable } from '../../util/util.js';
import { z } from 'zod';

const generateMongooseSchema = async (modelName, fields) => {

  logMessage('Generating fields using AI...');

  const prompt = fields.trim() ? `Create a ${modelName} Mongoose schema with fields: ${fields}`
    : `Create a ${modelName} Mongoose schema with appropriate fields for this type of model. Generate between 3 and 6 fields.`;

  const MongooseModelSchema = z.object({
    name: z.string(),
    fields: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["String", "Number", "Date", "Boolean"]),
      })
    ),
  });

  const mongooseSchema = await openaiResponseFormat({
    schema: MongooseModelSchema,
    prompt,
    instruction: "You are a Mongoose schema generator AI. Convert the user input into a Mongoose schema, or generate appropriate fields if none were provided.",
    zodName: 'mongooseModel',
  });

  return mongooseSchema;

};

const generateMongooseTemplate = (modelName, mongooseSchema, modelType) => {

  // Step 7: Prepare the model template based on the generated schema
  const esmTemplateContent = `import mongoose from 'mongoose';
const { Schema } = mongoose;
      
const ${modelName}Schema = new Schema({
  ${mongooseSchema ? mongooseSchema.fields.map(({ name, type }) => `${name}: { type: ${type} }`).join(',\n  ') : ""}
});
      
const ${capitalize(modelName)} = mongoose.model('${capitalize(modelName)}', ${modelName}Schema);
      
export default ${capitalize(modelName)};`;

  const commonJsTemplateContent = `const mongoose = require('mongoose');
const { Schema } = mongoose;
      
const ${modelName}Schema = new Schema({
  ${mongooseSchema ? mongooseSchema.fields.map(({ name, type }) => `${name}: { type: ${type} }`).join(',\n  ') : ""}
});
      
const ${capitalize(modelName)} = mongoose.model('${capitalize(modelName)}', ${modelName}Schema);
      
module.exports = ${capitalize(modelName)};`;

  return modelType === 'ESM' ? esmTemplateContent : commonJsTemplateContent;

}



// Define the function to create a Mongoose model
const addMongooseModel = async () => {

  try {

    
    const { value: MARKCN_OPENAI_API_KEY } = await getEnvVariable('MARKCN_OPENAI_API_KEY');

    // Step 1: Ask the user for the model name and fields
    let { modelName, fields } = await inquirer.prompt([
      {
        type: 'input',
        name: 'modelName',
        message: 'Please enter the name of the model:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Model name cannot be empty.';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'fields',
        message: 'Please enter the fields for the model (comma-separated), or leave blank for AI-generated fields:',
        when: () => !!MARKCN_OPENAI_API_KEY,
      },
    ]);

    let mongooseSchema;
    modelName = modelName.toLowerCase();

    if (MARKCN_OPENAI_API_KEY) {

      mongooseSchema = await generateMongooseSchema(modelName, fields);

      mongooseSchema.fields.forEach(({ name, type }) => {
        logMessage(`${name}: ${type}`, 'write');
      });

    }

    // Step 4: Define the file path and name
    const rootPath = await getRootPath();

    const filePath = path.join(rootPath, 'src', 'models', `${modelName}.model.js`);

    // Step 5: Check if the file already exists
    const fileAlreadyExists = await fileExists(filePath);

    if (fileAlreadyExists) {
      logMessage(`Error: Model file already exists at ${filePath}. Operation aborted.`, 'error');
      return;
    }

    // Step 6: Create the /src/models folder if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const moduleType = await getModuleType();

    const fileContent = generateMongooseTemplate(modelName, mongooseSchema, moduleType);

    // Step 8: Write the model file based on module type (ESM or CommonJS)
    await fs.writeFile(filePath, fileContent);

    logMessage(`Model file created at ${filePath}`, 'write');
    
  } catch (error) {
    logMessage(`Error creating model: ${error.message}`, 'error');
  }
};

export { addMongooseModel };

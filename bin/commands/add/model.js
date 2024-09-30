import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logMessage } from '../../libs/chalk.js'; // Adjust the path as needed
import { __dirname, getModuleType, getRootPath, fileExists, openaiResponseFormat, capitalize, getEnvVariable } from '../../util/util.js';
import { z } from 'zod';

// Define the function to create a Mongoose model
const addMongooseModel = async () => {

  try {

    const answerList = [
      {
        type: 'input',
        name: 'modelName',
        message: 'Please enter the name of the model:',
        parse: (input) => input.toLowerCase(),
        validate: (input) => {
          if (!input.trim()) {
            return 'Model name cannot be empty.';
          }
          return true;
        },
      },
    ];

    const { value: MARKCN_OPENAI_API_KEY } = await getEnvVariable('MARKCN_OPENAI_API_KEY');

    if (MARKCN_OPENAI_API_KEY) {
      answerList.push({
        type: 'input',
        name: 'fields',
        message: 'Please enter the fields for the model (comma-separated), or leave blank for AI-generated fields:',
      });
    }

    // Step 1: Ask the user for the model name and fields
    const answers = await inquirer.prompt(answerList);

    const { modelName, fields } = answers;
    let prompt;
    let mongooseSchema;

    if (MARKCN_OPENAI_API_KEY) {

      if (fields.trim()) {
        prompt = `Create a ${modelName} Mongoose schema with fields: ${fields}`;
      } else {
        logMessage('Generating fields using AI...', 'yellow');
        prompt = `Create a ${modelName} Mongoose schema with appropriate fields for this type of model. Generate between 3 and 6 fields.`;
      }

      // Step 2: Define the Zod schema to validate the Mongoose model
      const MongooseModelSchema = z.object({
        name: z.string(),
        fields: z.array(
          z.object({
            name: z.string(),
            type: z.enum(["String", "Number", "Date", "Boolean"]),
          })
        ),
      });

      // Step 3: Use OpenAI to generate the Mongoose schema
      mongooseSchema = await openaiResponseFormat({
        schema: MongooseModelSchema,
        prompt,
        instruction: "You are a Mongoose schema generator AI. Convert the user input into a Mongoose schema, or generate appropriate fields if none were provided.",
        zodName: 'mongooseModel',
      });

    }



    logMessage('Generated schema:', 'cyan');

    const moduleType = await getModuleType();

    // Step 4: Define the file path and name
    const fileName = `${modelName}.model.js`;
    const rootPath = await getRootPath();
    const filePath = path.join(rootPath, 'src', 'models', fileName);

    // Step 5: Check if the file already exists
    const fileAlreadyExists = await fileExists(filePath);
    if (fileAlreadyExists) {
      logMessage(`Error: Model file already exists at ${filePath}. Operation aborted.`, 'red');
      return; // Stop if the file already exists
    }

    // Step 6: Create the /src/models folder if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    console.log({ mongooseSchema })

    // Step 7: Prepare the model template based on the generated schema
    const esmTemplateContent = `
import mongoose from 'mongoose';
const { Schema } = mongoose;

const ${modelName}Schema = new Schema({
  ${mongooseSchema ? mongooseSchema.fields.map(({ name, type }) => `${name}: { type: ${type} }`).join(',\n  ') : ""}
});

const ${capitalize(modelName)} = mongoose.model('${capitalize(modelName)}', ${modelName}Schema);

export default ${capitalize(modelName)};`;

    const commonJsTemplateContent = `
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ${modelName}Schema = new Schema({
  ${mongooseSchema ? mongooseSchema.fields.map(({ name, type }) => `${name}: { type: ${type} }`).join(',\n  ') : ""}
});

const ${capitalize(modelName)} = mongoose.model('${capitalize(modelName)}', ${modelName}Schema);

module.exports = ${capitalize(modelName)};`;

    // Step 8: Write the model file based on module type (ESM or CommonJS)
    await fs.writeFile(filePath, moduleType === 'ESM' ? esmTemplateContent : commonJsTemplateContent);
    logMessage(`Model file created at ${filePath}`, 'green');
  } catch (error) {
    logMessage(`Error creating model: ${error.message}`, 'red');
  }
};

export { addMongooseModel };

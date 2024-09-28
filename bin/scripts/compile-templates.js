import fs from 'fs/promises';
import path from 'path';
import { __dirname } from '../util/util.js'; // Adjust this path according to your structure

// Recursive function to read all subfolders and files
async function readFilesRecursively(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }); // Read directory content
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // If it's a directory, call readFilesRecursively
      const subFiles = await readFilesRecursively(fullPath);
      files.push(...subFiles); // Add files from the subfolder
    } else if (entry.isFile() && path.extname(entry.name) === '.js') {
      // Only process .js files
      files.push(fullPath);
    }
  }

  return files;
}

async function convertImportsAndExportsToRequire() {
  try {
    const templatesDir = path.join(__dirname, '../templates'); // Process the templates folder and its subfolders

    // Read all .js files in the templates folder and its subfolders
    const jsFiles = await readFilesRecursively(templatesDir);

    for (const filePath of jsFiles) {
      const fileExtension = path.extname(filePath);

      // Read the original file content
      let content = await fs.readFile(filePath, 'utf8');

      // Replace imports with require
      content = content
        .replace(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"];/g, "const {$1} = require('$2');") // Named imports
        .replace(/import\s+([^\s,]+)\s+from\s+['"]([^'"]+)['"];/g, "const $1 = require('$2');") // Default imports
        .replace(/import\s+['"]([^'"]+)['"];/g, "require('$1');"); // Imports without assignment

      // Replace exports with module.exports
      content = content
        .replace(/export\s*{\s*([^}\s]+)\s*};/g, "module.exports = { $1 };") // Named exports
        .replace(/export\s+default\s+([^;]+);/g, "module.exports = $1;"); // Default exports

      // Define output path for the CommonJS file
      const outputFilePath = path.join(path.dirname(filePath), `${path.basename(filePath, fileExtension)}.cjs`);

      // Write the modified file with .cjs extension
      await fs.writeFile(outputFilePath, content);
      console.log(`Created ${outputFilePath}`);
    }

    console.log('All .js files have been successfully converted from import/export to require/module.exports.');
  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

convertImportsAndExportsToRequire();

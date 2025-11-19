#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

import type { SanitizedConfig } from 'payload';
import payload from 'payload';

export const script = async (config: SanitizedConfig) => {
  await payload.init({config})

  main()
}

interface JsonConfig {
  [key: string]: any;
}

function mergeJsonConfigs(configPath: string): JsonConfig | null {
  const baseConfig: JsonConfig | null = null;
  const visited = new Set<string>();

  function loadAndMerge(filePath: string): JsonConfig | null {
    if (visited.has(filePath)) {
      return null; // Prevent circular dependencies
    }

    visited.add(filePath);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      let config: JsonConfig = JSON.parse(fileContent);

      if (config.inherits) {
        const parentFilePath = path.resolve(path.dirname(filePath), `${config.inherits}.json`);
        const parentConfig = loadAndMerge(parentFilePath);

        if (parentConfig) {
          config = { ...parentConfig, ...config };
        }
      }

      // Remove the 'inherits' key from the config
      delete config.inherits;

      return config;
    } catch (error) {
      console.error(`Error loading or merging ${filePath}:`, error);
      return null;
    }
  }

  return loadAndMerge(configPath);
}

function printHelp() {
  console.log(`
Usage: json-merge <path_to_json_file> [output_file]

Merges JSON files linked by 'inherits' fields.

Example:
  json-merge specific.json output.json
  json-merge specific.json  # Prints to console
`);
}

function main() {
  //const args = process.argv.slice(2);
  const args = process.argv.slice(3);

  console.log(process.argv)

  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    printHelp();
    return;
  }

  const configPath = args[0]!;
  const outputFile = args[1];

  const mergedConfig = mergeJsonConfigs(configPath);

  if (mergedConfig) {
    if (outputFile) {
      try {
        fs.writeFileSync(outputFile, JSON.stringify(mergedConfig, null, 2));
        console.log(`Merged config written to ${outputFile}`);
      } catch (error) {
        console.error(`Error writing to file ${outputFile}:`, error);
        process.exit(1);
      }
    } else {
      console.log(JSON.stringify(mergedConfig, null, 2));
    }
  } else {
    process.exit(1); // Exit with an error code if merging failed
  }
}

//main();
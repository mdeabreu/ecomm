#!/usr/bin/env node

import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const usage = `Usage: extract-3mf <path-to-file.3mf> [output-directory]

Extracts a .3mf archive (ZIP) using the system unzip utility.
If no output directory is provided, a folder named after the 3mf file will be created alongside it.`

const resolvePaths = (input: string, outputArg?: string) => {
  const inputPath = path.resolve(input)
  const outputDir =
    outputArg && outputArg.trim().length > 0
      ? path.resolve(outputArg)
      : path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)))

  return { inputPath, outputDir }
}

const ensureFileExists = async (filePath: string) => {
  try {
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) {
      throw new Error(`${filePath} is not a file`)
    }
  } catch (error) {
    throw new Error(`Input file not found or unreadable: ${filePath} (${(error as Error).message})`)
  }
}

const extract3mf = async (inputPath: string, outputDir: string) => {
  await fs.mkdir(outputDir, { recursive: true })
  const args = ['-o', inputPath, '-d', outputDir]
  await execFileAsync('unzip', args)
}

const main = async () => {
  const [inputArg, outputArg] = process.argv.slice(2)

  if (!inputArg || inputArg === '-h' || inputArg === '--help') {
    console.log(usage)
    process.exit(inputArg ? 0 : 1)
  }

  const { inputPath, outputDir } = resolvePaths(inputArg, outputArg)

  if (path.extname(inputPath).toLowerCase() !== '.3mf') {
    console.warn('Warning: input file does not end with .3mf; continuing anyway.')
  }

  await ensureFileExists(inputPath)

  try {
    await extract3mf(inputPath, outputDir)
    console.log(`Extracted ${inputPath} to ${outputDir}`)
  } catch (error) {
    console.error(`Failed to extract ${inputPath}:`, error)
    process.exit(1)
  }
}

void main()

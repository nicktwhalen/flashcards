#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Types from shared module
interface CreateDeckDto {
  name: string;
  description?: string;
}

interface CreateFlashcardDto {
  birdName: string;
  imageUrl: string;
  fileId?: string;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  userId: string;
}

interface UploadResponse {
  fileId: string;
  url: string;
}

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
const log = {
  info: (message: string) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  success: (message: string) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warning: (message: string) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
};

// HTTP request helper
async function makeRequest(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any, headers: Record<string, string> = {}, formData?: FormData): Promise<{ status: number; data: any }> {
  const options: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (formData) {
    delete options.headers['Content-Type']; // Let FormData set the boundary
    options.body = formData;
  } else if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    return { status: response.status, data: responseData };
  } catch (error) {
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// File utility functions
function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
}

function getBirdName(filename: string): string {
  // Remove extension
  const nameWithoutExt = path.parse(filename).name;

  // Replace underscores with spaces
  let birdName = nameWithoutExt.replace(/[_]/g, ' ');

  // Convert to title case
  birdName = birdName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  return birdName;
}

async function getImageFiles(directoryPath: string): Promise<string[]> {
  const readdir = promisify(fs.readdir);
  const stat = promisify(fs.stat);

  const files = await readdir(directoryPath);
  const imageFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const fileStat = await stat(filePath);

    if (fileStat.isFile() && isImageFile(file)) {
      imageFiles.push(filePath);
    }
  }

  return imageFiles;
}

// API functions
async function createDeck(deckName: string, authToken: string): Promise<Deck> {
  log.info(`Creating deck: ${deckName}`);

  const createDeckDto: CreateDeckDto = {
    name: deckName,
  };

  const response = await makeRequest(`${API_BASE_URL}/decks`, 'POST', createDeckDto, { Authorization: `Bearer ${authToken}` });

  if (response.status === 201) {
    log.success(`Deck created successfully with ID: ${response.data.id}`);
    return response.data;
  } else {
    throw new Error(`Failed to create deck. Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
  }
}

async function uploadImage(deckId: string, imagePath: string, authToken: string): Promise<UploadResponse> {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));

  const response = await makeRequest(`${API_BASE_URL}/uploads/flashcards/${deckId}`, 'POST', undefined, { Authorization: `Bearer ${authToken}` }, form);

  if (response.status === 201) {
    return response.data;
  } else {
    throw new Error(`Failed to upload image. Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
  }
}

async function createFlashcard(deckId: string, birdName: string, imageUrl: string, fileId: string, authToken: string): Promise<void> {
  const createFlashcardDto: CreateFlashcardDto = {
    birdName,
    imageUrl,
    fileId,
  };

  const response = await makeRequest(`${API_BASE_URL}/decks/${deckId}/flashcards`, 'POST', createFlashcardDto, { Authorization: `Bearer ${authToken}` });

  if (response.status !== 201) {
    throw new Error(`Failed to create flashcard. Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
  }
}

async function uploadFlashcard(deckId: string, imagePath: string, authToken: string): Promise<{ success: boolean; birdName: string; error?: string }> {
  const filename = path.basename(imagePath);
  const birdName = getBirdName(filename);

  try {
    log.info(`Uploading flashcard: ${birdName}`);

    // Upload the image
    const uploadResponse = await uploadImage(deckId, imagePath, authToken);

    // Create the flashcard
    await createFlashcard(deckId, birdName, uploadResponse.url, uploadResponse.fileId, authToken);

    log.success(`Flashcard created: ${birdName}`);
    return { success: true, birdName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Failed to upload flashcard ${birdName}: ${errorMessage}`);
    return { success: false, birdName, error: errorMessage };
  }
}

// Main function
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
      log.error('Usage: yarn ts-node scripts/upload_deck.ts <directory_path> <auth_token>');
      process.exit(1);
    }

    const [directoryPath, authToken] = args;
    const expandedPath = expandTilde(directoryPath);

    // Validate directory exists
    if (!fs.existsSync(expandedPath)) {
      log.error(`Directory does not exist: ${expandedPath}`);
      process.exit(1);
    }

    const stat = promisify(fs.stat);
    const dirStat = await stat(expandedPath);
    if (!dirStat.isDirectory()) {
      log.error(`Path is not a directory: ${expandedPath}`);
      process.exit(1);
    }

    // Get deck name from directory
    const deckName = getBirdName(path.basename(expandedPath));

    log.info(`Starting upload process for deck: ${deckName}`);
    log.info(`Directory: ${expandedPath}`);

    // Get all image files
    const imageFiles = await getImageFiles(expandedPath);

    if (imageFiles.length === 0) {
      log.warning(`No image files found in ${expandedPath}`);
      log.warning(`Supported formats: ${SUPPORTED_IMAGE_EXTENSIONS.join(', ')}`);
      process.exit(1);
    }

    log.info(`Found ${imageFiles.length} image files to upload`);

    // Create the deck
    const deck = await createDeck(deckName, authToken);

    // Upload each image as a flashcard
    let successCount = 0;
    let failureCount = 0;
    const results: Array<{ success: boolean; birdName: string; error?: string }> = [];

    for (const imagePath of imageFiles) {
      const result = await uploadFlashcard(deck.id, imagePath, authToken);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // Print summary
    console.log('');
    log.success('Upload completed!');
    log.success(`Deck ID: ${deck.id}`);
    log.success(`Successfully uploaded: ${successCount} flashcards`);

    if (failureCount > 0) {
      log.warning(`Failed uploads: ${failureCount} flashcards`);
      console.log('\nFailed uploads:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.birdName}: ${r.error}`);
        });
    }

    log.info(`You can view your deck at: http://localhost:3000/decks/${deck.id}`);
  } catch (error) {
    log.error(`Script failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  log.error(`Unhandled error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});

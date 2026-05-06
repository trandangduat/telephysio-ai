import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env BEFORE any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { seedMockData } from '../src/services/firebase/seedService';

async function run() {
  console.log('--- Terminal Seed Runner ---');
  try {
    const success = await seedMockData();
    if (success) {
      console.log('SUCCESS: Mock data seeded successfully.');
      process.exit(0);
    } else {
      console.error('FAILED: Seed process returned false.');
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR: An unexpected error occurred during seeding:', error);
    process.exit(1);
  }
}

run();

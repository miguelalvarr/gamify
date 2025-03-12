// Script to run the profiles storage bucket setup
import { setupProfilesStorageBucket } from './setupProfilesStorage.js';

// This script is meant to be run directly to set up the profiles storage bucket
// and fix Row Level Security (RLS) policy violations when uploading profile pictures

console.log('Starting profiles storage bucket setup...');

// Run the setup function
setupProfilesStorageBucket().then(() => {
  console.log('\nProfiles storage setup process completed');
  console.log('If you encountered any errors, please follow the instructions provided above to resolve them.');
  console.log('\nIf the setup was successful, you should now be able to upload profile pictures without RLS policy violations.');
});
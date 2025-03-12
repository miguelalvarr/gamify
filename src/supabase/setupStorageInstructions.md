# Supabase Storage Setup Instructions

## Problem
You're encountering permission issues with Supabase storage. The error message indicates that you need to be authenticated to manage storage buckets.

## Solution
To fix this issue, you need to:

1. **Authenticate with Supabase**
   - Make sure you're signed in to your Supabase account before running the storage setup script
   - You can sign in using `supabase.auth.signInWithPassword()` with your credentials

2. **Set up proper RLS (Row Level Security) policies**
   - We've created a SQL script (`setupStoragePolicies.sql`) with the necessary policies
   - These policies need to be executed in the Supabase SQL Editor

## How to Apply the Policies

1. Go to [https://app.supabase.io](https://app.supabase.io)
2. Select your project (the one with URL: `https://cqslequjbhzpqbdnftam.supabase.co`)
3. Navigate to the SQL Editor (in the left sidebar)
4. Open the file `src/supabase/setupStoragePolicies.sql` in your project
5. Copy the entire contents of this file
6. Paste it into the SQL Editor in Supabase
7. Click "Run" to execute the policies

## What These Policies Do

- Allow authenticated users to upload files to the media bucket
- Allow users to update and delete their own files
- Allow public access to read files in the media bucket

## Testing the Configuration

After applying the policies:

1. Make sure you're signed in to your application
2. Run the `setupStorage.js` script again
3. It should now be able to create and configure the media bucket

## Authentication Example

```javascript
// Example of how to sign in before running the storage setup
import { supabase } from './config.js';

async function setupStorage() {
  // First authenticate
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'your-email@example.com',
    password: 'your-password'
  });
  
  if (error) {
    console.error('Authentication failed:', error);
    return;
  }
  
  console.log('Authentication successful');
  
  // Now run the storage setup
  // Import and run the setupStorageBuckets function
  const { setupStorageBuckets } = await import('./setupStorage.js');
  await setupStorageBuckets();
}

setupStorage();
```

## Need More Help?

If you continue to experience issues after applying these policies:

1. Check the Supabase dashboard for any error messages
2. Verify that your user has the necessary permissions in Supabase
3. Ensure that the RLS policies were successfully applied
4. Consider creating the bucket manually through the Supabase dashboard if needed
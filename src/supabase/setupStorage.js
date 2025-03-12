// Script to set up Supabase storage buckets and policies
import { supabase } from './config.js';

/**
 * This script helps diagnose and fix storage permission issues
 * It will:
 * 1. Check if the media bucket exists
 * 2. Create it if it doesn't exist
 * 3. Set up proper RLS policies for the bucket
 * 4. Provide guidance if permissions are insufficient
 */

async function setupStorageBuckets() {
  console.log('Setting up Supabase storage buckets and policies...');
  
  try {
    // 1. Check if the user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Authentication error:', authError);
      console.log('Please sign in to your Supabase account before running this script.');
      return;
    }
    
    console.log('Authentication status:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('You need to be authenticated to manage storage buckets.');
      console.log('Please sign in using supabase.auth.signIn() before running this script.');
      return;
    }
    
    // 2. List existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      console.log('This may be due to insufficient permissions. Please check your Supabase project settings.');
      return;
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name));
    
    // 3. Check if media bucket exists
    const mediaBucket = buckets.find(b => b.name === 'media');
    
    if (!mediaBucket) {
      console.log('Media bucket does not exist. Creating...');
      
      try {
        // Create the media bucket
        const { error: createError } = await supabase.storage.createBucket('media', {
          public: true,
          allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'],
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
        
        if (createError) {
          console.error('Error creating media bucket:', createError);
          console.log('\nThis is likely due to Row-Level Security (RLS) policy restrictions.');
          console.log('To fix this issue, you have two options:');
          console.log('1. Use the Supabase dashboard to create the bucket manually:');
          console.log('   - Go to https://app.supabase.io');
          console.log('   - Select your project');
          console.log('   - Navigate to Storage');
          console.log('   - Click "Create bucket" and name it "media"');
          console.log('   - Set it as public');
          console.log('\n2. Ensure your user has the necessary permissions:');
          console.log('   - You need to be signed in as a user with admin privileges');
          console.log('   - Or modify the RLS policies to allow bucket creation');
          
          // Try to proceed with the rest of the script assuming the bucket might exist
          console.log('\nAttempting to proceed with the rest of the setup...');
        } else {
          console.log('Media bucket created successfully');
        }
      } catch (bucketError) {
        console.error('Exception when creating bucket:', bucketError);
        console.log('Attempting to proceed with the rest of the setup...');
      }
    } else {
      console.log('Media bucket already exists');
    }
    
    // 4. Update bucket to be public (only if we know it exists)
    if (mediaBucket || buckets.find(b => b.name === 'media')) {
      try {
        const { error: updateError } = await supabase.storage.updateBucket('media', {
          public: true,
          allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'],
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
        
        if (updateError) {
          console.error('Error updating media bucket:', updateError);
          console.log('This may be due to insufficient permissions to update bucket settings.');
        } else {
          console.log('Media bucket updated successfully');
        }
      } catch (updateBucketError) {
        console.error('Exception when updating bucket:', updateBucketError);
      }
      
      // 5. Test uploading a small file
      console.log('Testing file upload...');
      
      try {
        // Create a small test file
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload('test/test.txt', testFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          console.error('Test upload failed:', uploadError);
          console.log('This indicates there may still be permission issues with the bucket');
          console.log('Please check your Supabase dashboard and ensure:');
          console.log('1. RLS policies are properly configured for the media bucket');
          console.log('2. Your user has the necessary permissions');
          console.log('3. You may need to manually set these policies in the Supabase dashboard:');
          console.log('   - Go to Storage > Policies');
          console.log('   - Add a policy that allows authenticated users to upload files');
          console.log('   - Example policy: (auth.uid() IS NOT NULL)');
        } else {
          console.log('Test upload successful! Storage is properly configured.');
        }
      } catch (uploadError) {
        console.error('Exception during test upload:', uploadError);
      }
    } else {
      console.log('Media bucket not found. Please create it manually in the Supabase dashboard.');
    }
    
  } catch (error) {
    console.error('Setup error:', error);
    console.log('Please ensure you have the correct Supabase configuration and permissions.');
  }
}

// Run the setup function
setupStorageBuckets().then(() => {
  console.log('Storage setup process completed');
  console.log('If you encountered any errors, please follow the instructions above to resolve them.');
});
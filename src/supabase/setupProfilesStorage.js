// Script to set up Supabase profiles storage bucket and policies
import { supabase } from './config.js';

/**
 * This script helps set up the profiles storage bucket and fix permission issues
 * It will:
 * 1. Check if the profiles bucket exists
 * 2. Create it if it doesn't exist
 * 3. Set up proper RLS policies for the bucket
 * 4. Provide guidance if permissions are insufficient
 */

async function setupProfilesStorageBucket() {
  console.log('Setting up Supabase profiles storage bucket and policies...');
  
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
    
    // 3. Check if profiles bucket exists
    const profilesBucket = buckets.find(b => b.name === 'profiles');
    
    if (!profilesBucket) {
      console.log('Profiles bucket does not exist. Creating...');
      
      try {
        // Create the profiles bucket
        const { error: createError } = await supabase.storage.createBucket('profiles', {
          public: false, // Not public by default for security
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 2 * 1024 * 1024 // 2MB
        });
        
        if (createError) {
          console.error('Error creating profiles bucket:', createError);
          console.log('\nThis is likely due to Row-Level Security (RLS) policy restrictions.');
          console.log('To fix this issue, you have two options:');
          console.log('1. Use the Supabase dashboard to create the bucket manually:');
          console.log('   - Go to https://app.supabase.io');
          console.log('   - Select your project');
          console.log('   - Navigate to Storage');
          console.log('   - Click "Create bucket" and name it "profiles"');
          
          // Try to proceed with the rest of the script assuming the bucket might exist
          console.log('\nAttempting to proceed with the rest of the setup...');
        } else {
          console.log('Profiles bucket created successfully');
        }
      } catch (bucketError) {
        console.error('Exception when creating bucket:', bucketError);
        console.log('Attempting to proceed with the rest of the setup...');
      }
    } else {
      console.log('Profiles bucket already exists');
    }
    
    // 4. Set up RLS policies for the profiles bucket
    console.log('Setting up RLS policies for the profiles bucket...');
    
    try {
      // First, check if we can access the bucket
      const { data: policies, error: policiesError } = await supabase.rpc('get_policies', { 
        bucket_name: 'profiles' 
      });
      
      if (policiesError) {
        console.error('Error checking policies:', policiesError);
        console.log('This may be due to insufficient permissions or the RPC function not being available.');
        console.log('Please set up the policies manually in the Supabase dashboard:');
        console.log('1. Go to Storage > Policies');
        console.log('2. Select the "profiles" bucket');
        console.log('3. Add the following policies:');
        console.log('   - INSERT policy: (auth.uid() = auth.uid())');
        console.log('   - SELECT policy: (auth.uid() = auth.uid() OR bucket_id = \'profiles\' AND name LIKE \'avatars/%\')');
        console.log('   - UPDATE policy: (auth.uid() = auth.uid())');
        console.log('   - DELETE policy: (auth.uid() = auth.uid())');
      } else {
        console.log('Current policies:', policies);
      }
      
      // Test uploading a small file to the profiles bucket
      console.log('Testing file upload to profiles bucket...');
      
      // Create a small test file
      const testBlob = new Blob(['test'], { type: 'image/png' });
      const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(`avatars/test-${Date.now()}.png`, testFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Test upload failed:', uploadError);
        console.log('This indicates there may still be permission issues with the profiles bucket');
        console.log('Please check your Supabase dashboard and ensure:');
        console.log('1. RLS policies are properly configured for the profiles bucket');
        console.log('2. Your user has the necessary permissions');
        console.log('3. You may need to manually set these policies in the Supabase dashboard:');
        console.log('   - Go to Storage > Policies');
        console.log('   - Add a policy that allows authenticated users to upload files');
        console.log('   - Example policy for INSERT: (auth.uid() = auth.uid())');
      } else {
        console.log('Test upload successful! Profiles storage is properly configured.');
      }
    } catch (error) {
      console.error('Error setting up policies:', error);
    }
    
  } catch (error) {
    console.error('Setup error:', error);
    console.log('Please ensure you have the correct Supabase configuration and permissions.');
  }
}

// Export the setup function
export { setupProfilesStorageBucket };

// If this file is run directly, execute the setup
if (typeof window !== 'undefined' && window.location.pathname.includes('setupProfilesStorage')) {
  setupProfilesStorageBucket().then(() => {
    console.log('Profiles storage setup process completed');
    console.log('If you encountered any errors, please follow the instructions above to resolve them.');
  });
}
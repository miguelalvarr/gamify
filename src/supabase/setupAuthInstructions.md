# Supabase Authentication Setup Instructions

## Problem

You're encountering an authentication error when trying to register new users:

```
Authentication error: AuthApiError: Database error saving new user
```

This error occurs because the necessary Row Level Security (RLS) policies for the authentication schema are not properly configured in your Supabase project.

## Solution

To fix this issue, you need to apply proper RLS policies for the authentication system. We've created a SQL script (`setupAuthPolicies.sql`) with the necessary policies.

## How to Apply the Authentication Policies

1. Go to [https://app.supabase.io](https://app.supabase.io)
2. Select your project (the one with URL: `https://cqslequjbhzpqbdnftam.supabase.co`)
3. Navigate to the SQL Editor (in the left sidebar)
4. Open the file `src/supabase/setupAuthPolicies.sql` in your project
5. Copy the entire contents of this file
6. Paste it into the SQL Editor in Supabase
7. Click "Run" to execute the policies

## What These Policies Do

- Enable Row Level Security on the auth.users table
- Allow the service role to manage all users
- Allow authenticated users to read and update their own data
- Set up proper permissions for the auth schema and related tables

## Testing the Configuration

After applying the policies:

1. Wait a few minutes for the changes to take effect
2. Try registering a new user in your application
3. If you still encounter issues, try restarting the Supabase Auth service from your Supabase dashboard

## Authentication Example

```javascript
// Example of how to register a new user
import { supabase } from './config.js';

async function registerUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Registration failed:', error);
      return { success: false, error };
    }
    
    console.log('Registration successful');
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error during registration:', error);
    return { success: false, error };
  }
}
```

## Need More Help?

If you continue to experience issues after applying these policies:

1. Check the Supabase dashboard for any error messages
2. Verify that your user has the necessary permissions in Supabase
3. Ensure that the RLS policies were successfully applied
4. Consider checking the Supabase logs for more detailed error information
5. Make sure both the authentication policies AND storage policies are applied

## Important Note

Remember that you need to apply BOTH the authentication policies (`setupAuthPolicies.sql`) and the storage policies (`setupStoragePolicies.sql`) for your application to work correctly. The storage policies allow file operations, while the authentication policies allow user registration and management.
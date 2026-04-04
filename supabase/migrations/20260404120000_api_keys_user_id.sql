-- Add user_id to api_keys table, linking keys to authenticated users
ALTER TABLE api_keys
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for looking up keys by user
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- RLS policy: users can read their own keys
CREATE POLICY "Users can read own api_keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policy: users can insert their own keys
CREATE POLICY "Users can insert own api_keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can delete their own keys
CREATE POLICY "Users can delete own api_keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

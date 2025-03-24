-- Add new columns to forum_tags table
ALTER TABLE forum_tags
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Add index on category for faster filtering
CREATE INDEX IF NOT EXISTS forum_tags_category_idx ON forum_tags(category);

-- Add index on user_id for faster filtering of custom tags
CREATE INDEX IF NOT EXISTS forum_tags_user_id_idx ON forum_tags(user_id);

-- Update existing tags to have categories
UPDATE forum_tags SET category = 'Perfume Type' WHERE name IN ('Citrus', 'Floral', 'Woody', 'Oriental', 'Fresh');
UPDATE forum_tags SET category = 'Occasion' WHERE name IN ('Casual', 'Formal', 'Office', 'Date Night', 'Special Event');
UPDATE forum_tags SET category = 'Season' WHERE name IN ('Summer', 'Winter', 'Spring', 'Fall');
UPDATE forum_tags SET category = 'Price Range' WHERE name IN ('Budget', 'Mid-range', 'Luxury', 'Ultra Luxury');
UPDATE forum_tags SET category = 'Gender' WHERE name IN ('Masculine', 'Feminine', 'Unisex');
UPDATE forum_tags SET category = 'General' WHERE category IS NULL;

-- Add descriptions to some tags
UPDATE forum_tags SET description = 'Fresh, zesty scents with citrus notes' WHERE name = 'Citrus';
UPDATE forum_tags SET description = 'Scents dominated by floral notes' WHERE name = 'Floral';
UPDATE forum_tags SET description = 'Scents with prominent wood notes' WHERE name = 'Woody';
UPDATE forum_tags SET description = 'Rich, spicy, and exotic fragrances' WHERE name = 'Oriental';
UPDATE forum_tags SET description = 'Clean, airy, and refreshing scents' WHERE name = 'Fresh';

-- Create function to update tag usage count in a materialized view or trigger
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- This function would be used with a trigger to maintain tag usage counts
  -- For now we'll use a query to count directly from forum_thread_tags
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for forum_tags
ALTER PUBLICATION supabase_realtime ADD TABLE forum_tags;

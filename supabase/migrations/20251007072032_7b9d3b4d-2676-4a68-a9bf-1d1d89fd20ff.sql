-- Update all profiles with their current ratings based on existing reviews
UPDATE profiles
SET 
  rating = COALESCE((
    SELECT AVG(rating)
    FROM reviews
    WHERE reviewed_id = profiles.user_id
  ), 0),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews
    WHERE reviewed_id = profiles.user_id
  )
WHERE user_id IN (
  SELECT DISTINCT reviewed_id FROM reviews
);
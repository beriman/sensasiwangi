-- Create a function to calculate average rating and review count for a product
CREATE OR REPLACE FUNCTION get_product_rating(product_id UUID)
RETURNS TABLE (avg_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::NUMERIC, 0) as avg_rating,
    COUNT(*) as review_count
  FROM marketplace_reviews
  WHERE product_id = $1;
END;
$$ LANGUAGE plpgsql;

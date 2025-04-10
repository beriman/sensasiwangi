-- Add fields to track shipping optimization choices in sambatan_participants table
ALTER TABLE sambatan_participants
ADD COLUMN IF NOT EXISTS used_optimized_shipping BOOLEAN,
ADD COLUMN IF NOT EXISTS shipping_provider_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_rate_id TEXT;

-- Add field to marketplace_transactions to track if optimized shipping was used
ALTER TABLE marketplace_transactions
ADD COLUMN IF NOT EXISTS sambatan_id UUID REFERENCES sambatan(id),
ADD COLUMN IF NOT EXISTS used_optimized_shipping BOOLEAN;

-- Create a view to help analyze shipping optimization savings
CREATE OR REPLACE VIEW sambatan_shipping_savings AS
SELECT 
  s.id as sambatan_id,
  s.product_id,
  COUNT(sp.id) as participant_count,
  SUM(CASE WHEN sp.used_optimized_shipping = true THEN 1 ELSE 0 END) as optimized_count,
  STRING_AGG(DISTINCT sp.shipping_provider_code, ', ') as providers_used
FROM sambatan s
JOIN sambatan_participants sp ON s.id = sp.sambatan_id
WHERE sp.shipping_provider_code IS NOT NULL
GROUP BY s.id, s.product_id;

-- Add function to calculate potential shipping savings for a sambatan
CREATE OR REPLACE FUNCTION calculate_sambatan_shipping_savings(sambatan_id UUID)
RETURNS TABLE (
  total_individual_cost NUMERIC,
  total_optimized_cost NUMERIC,
  total_savings NUMERIC,
  actual_savings NUMERIC,
  optimization_rate NUMERIC
) AS $$
DECLARE
  individual_cost NUMERIC := 0;
  optimized_cost NUMERIC := 0;
  actual_cost NUMERIC := 0;
  participant_count INTEGER := 0;
  optimized_count INTEGER := 0;
BEGIN
  -- This is a placeholder function that would be implemented with actual data
  -- In a real implementation, this would query shipping_rates and calculate actual savings
  
  SELECT 
    COUNT(sp.id),
    SUM(CASE WHEN sp.used_optimized_shipping = true THEN 1 ELSE 0 END)
  INTO participant_count, optimized_count
  FROM sambatan_participants sp
  WHERE sp.sambatan_id = calculate_sambatan_shipping_savings.sambatan_id;
  
  -- Placeholder values - in real implementation these would be calculated from actual rates
  individual_cost := participant_count * 20000; -- Assume average individual shipping is 20,000
  optimized_cost := participant_count * 15000; -- Assume average optimized shipping is 15,000
  actual_cost := (optimized_count * 15000) + ((participant_count - optimized_count) * 20000);
  
  RETURN QUERY SELECT 
    individual_cost as total_individual_cost,
    optimized_cost as total_optimized_cost,
    (individual_cost - optimized_cost) as total_savings,
    (individual_cost - actual_cost) as actual_savings,
    CASE WHEN participant_count > 0 THEN (optimized_count::NUMERIC / participant_count::NUMERIC) ELSE 0 END as optimization_rate;
  
END;
$$ LANGUAGE plpgsql;

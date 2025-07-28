-- Add message column to orders table
ALTER TABLE orders ADD COLUMN message TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN orders.message IS 'Optional message from customer to shop with order instructions or notes';
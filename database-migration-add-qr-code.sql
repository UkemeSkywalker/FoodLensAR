-- Add QR code URL field to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_qr_code_url ON restaurants(qr_code_url);
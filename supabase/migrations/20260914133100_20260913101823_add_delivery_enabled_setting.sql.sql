INSERT INTO site_settings (key, value)
VALUES ('delivery_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
CREATE TABLE IF NOT EXISTS admins (
  admin_id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  client_id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  project_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  client_id INTEGER REFERENCES clients(client_id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES admins(admin_id) ON DELETE CASCADE,
  type VARCHAR(20),
  status VARCHAR(30) DEFAULT 'draft',
  tags TEXT,
  start_date DATE,
  deadline DATE,
  budget NUMERIC(12, 2),
  budget_currency VARCHAR(10) DEFAULT 'EUR',
  cover_image_url TEXT,
  brief TEXT,
  remaining_amount NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_logs (
  log_id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  pending_amount NUMERIC(12, 2) GENERATED ALWAYS AS (
    COALESCE(total_amount, 0) - COALESCE(paid_amount, 0)
  ) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice (
  invoice_id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(client_id) ON DELETE CASCADE,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  payment_date TIMESTAMP DEFAULT NOW()
);

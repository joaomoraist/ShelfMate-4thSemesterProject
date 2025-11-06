DROP DATABASE shelfmate_database;
CREATE DATABASE shelfmate_database;

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,             
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    reports_exported INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,                 
    name VARCHAR(100) NOT NULL,            
    email VARCHAR(150) UNIQUE NOT NULL,    
    recovery_code VARCHAR(50),             
    user_level INT DEFAULT 1,              
    company_id INT REFERENCES companies(id) NOT NULL,
    accesses INT DEFAULT 0,
    downloads INT DEFAULT 0,
    changes INT DEFAULT 0,
    password VARCHAR(100),
    image VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE products_type_enum AS ENUM ('Disponível', 'Estoque Baixo','Estoque Alto','Indisponível');
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(10,2),
    inventory FLOAT DEFAULT 0,
    status ENUM('Disponível', 'Estoque Baixo','Estoque Alto','Indisponível') 
            DEFAULT 'Disponível',
    company_id INT REFERENCES companies(id) NOT NULL
);

CREATE TYPE alerts_type_enum AS ENUM ('Disponível', 'Estoque Baixo','Estoque Alto','Estoque Zerado');
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_type alerts_type_enum DEFAULT 'Disponível' NOT NULL,
    product_id INT REFERENCES products(id) NOT NULL,
    company_id INT REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) NOT NULL, 
    qntd FLOAT NOT NULL CHECK (qntd > 0),
    value FLOAT NOT NULL CHECK (value > 0),
    company_id INT REFERENCES companies(id)
);

----------------------- TRIGGERS -------------------------

-- Função para preencher automaticamente o company_id
CREATE OR REPLACE FUNCTION set_company_id()
RETURNS TRIGGER AS $$
BEGIN
    
    IF NEW.product_id IS NOT NULL THEN
        SELECT company_id INTO NEW.company_id
        FROM products
        WHERE id = NEW.product_id;
    END IF;

    IF (TG_ARGV[0] = 'user') THEN
        SELECT company_id INTO NEW.company_id
        FROM users
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers Alerts
CREATE TRIGGER trg_set_company_alerts
BEFORE INSERT ON alerts
FOR EACH ROW
EXECUTE FUNCTION set_company_id();

-- Triggers Sales
CREATE TRIGGER trg_set_company_sales
BEFORE INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION set_company_id();

-- Triggers Products
CREATE TRIGGER trg_set_company_products
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION set_company_id();

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
    image VARCHAR(200);
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
    product_id INT REFERENCES products(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) NOT NULL, 
    qntd FLOAT NOT NULL CHECK (qntd > 0),
    value FLOAT NOT NULL CHECK (value > 0)
);

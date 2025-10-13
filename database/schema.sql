DROP DATABASE shelfmate_database;
CREATE DATABASE shelfmate_database;

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,             
    name VARCHAR(150) NOT NULL,        
    cnpj VARCHAR(20) NOT NULL UNIQUE   
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,                 
    name VARCHAR(100) NOT NULL,            
    email VARCHAR(150) UNIQUE NOT NULL,    
    recovery_code VARCHAR(50),             
    user_level INT DEFAULT 1,              
    company_id INT REFERENCES companies(id),
    accesses INT DEFAULT 0,
    downloads INT DEFAULT 0,
    changes INT DEFAULT 0,
    password VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(10,2),
    inventory FLOAT DEFAULT 0,
    status VARCHAR(100) DEFAULT 'Disponível',
    company_id INT REFERENCES companies(id) 
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(100),
    product_id INT REFERENCES products(id)  
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id), 
    qntd FLOAT NOT NULL,
    value FLOAT NOT NULL
);

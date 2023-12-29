DROP DATABASE IF EXISTS obreiro_digital;

CREATE DATABASE obreiro_digital;

USE obreiro_digital;

CREATE TABLE user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    cod_membro TEXT UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(16) NOT NULL,
    birth DATE NOT NULL,
    cargo ENUM('Pastor', 'Obreiro') NOT NULL
);

CREATE TABLE departamentos (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    birth DATE NOT NULL,
    data_congresso DATE
);

CREATE TABLE membro (
    id_membro INT AUTO_INCREMENT PRIMARY KEY,
    cod_membro TEXT UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    numero INT(20),
    birth DATE NOT NULL,
    novo_convertido ENUM('Sim', 'Não') NOT NULL,
    id_departamento INT,
    
    FOREIGN KEY (id_departamento) REFERENCES departamentos (id_departamento)
);

CREATE TABLE visitante (
    id_visitante INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,    
    cristao ENUM('Sim', 'Não'),
    data_visita DATE NOT NULL,
    congregacao VARCHAR(200),
    ministerio VARCHAR(150),
    id_membro INT,
    
    FOREIGN KEY (id_membro) REFERENCES membro (id_membro)
);

CREATE TABLE eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    data_inicio DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    data_fim DATE NOT NULL,
    horario_fim TIME NOT NULL,
    local VARCHAR(150) NOT NULL
);

CREATE TABLE saldo (
    id_saldo INT AUTO_INCREMENT PRIMARY KEY,
    saldo_atual DECIMAL(10, 2) NOT NULL,
    data_atualizacao DATE NOT NULL
);

CREATE TABLE financas (
	id_financas INT AUTO_INCREMENT PRIMARY KEY,    
    tipo ENUM('Entrada', 'Saída'),
    categoria ENUM('OFerta Simples', 'Dízimo', 'Oferta Especial', 'Contribuição para Missões', 'Contribuição para Obras') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    descricao TEXT NOT NULL,
    data DATE NOT NULL,
    id_saldo INT,
    
    FOREIGN KEY (id_saldo) REFERENCES saldo (id_saldo)
);

CREATE TABLE estoque (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    cod_produto TEXT,
    categoria ENUM('Cozinha', 'Limpeza', 'Materiais de Construção') NOT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade INT NOT NULL,
    validade DATE NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL   
);

CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    nome_produto VARCHAR(150) NOT NULL,
    categoria_produto VARCHAR(100) NOT NULL,
    quantidade INT NOT NULL,
    data_pedido DATE NOT NULL,
    status_pedido ENUM('Em Andamento', 'Entregue', 'Recusado') DEFAULT ('Em Andamento'),
    motivo_recusa TEXT,
    data_entrega DATE,
    respondido BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO user (cod_membro, nome, email, senha, birth, cargo) 
	VALUES ('1', 'Adilson', 'pastor@gmail.com', '123', '2004-10-23', 'Pastor');
    
INSERT INTO user (cod_membro, nome, email, senha, birth, cargo) 
	VALUES ('2', 'Samuel', 'obreiro@gmail.com', '123', '2004-10-23', 'Obreiro');
    
INSERT INTO departamentos(nome, birth, data_congresso)
	VALUES ('Missões', '1978-11-03', '2024-10-10'); 
    
INSERT INTO membro(cod_membro, nome, numero, birth, novo_convertido, id_departamento) 
	VALUES ('1', 'Lucas', '11998520702', '2004-10-23', 'Não', 1);

INSERT INTO saldo (saldo_atual, data_atualizacao) VALUES (0, CURDATE());

select * from eventos;
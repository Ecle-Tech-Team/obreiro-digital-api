DROP DATABASE IF EXISTS obreiro_digital;	

CREATE DATABASE obreiro_digital;

USE obreiro_digital;

CREATE TABLE igreja (
	id_igreja INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,    
    data_fundacao DATE,
    setor VARCHAR(200),
    ministerio VARCHAR(150),
    cep VARCHAR(19) NOT NULL,
    endereco VARCHAR(150) NOT NULL,
    bairro VARCHAR(150) NOT NULL,
    cidade VARCHAR(150) NOT NULL
);

CREATE TABLE user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    cod_membro VARCHAR(16) UNIQUE NOT NULL,
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
    cod_membro VARCHAR(16) UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    numero INT(25),
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

ALTER TABLE membro
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_membros_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE departamentos
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_departamentos_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE eventos
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_eventos_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE user
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_users_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE pedidos
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_pedidos_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE estoque
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_estoque_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE financas
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_financas_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE visitante
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_visitantes_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

ALTER TABLE saldo
ADD COLUMN id_igreja INT,
ADD CONSTRAINT fk_saldo_igrejas FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja);

INSERT INTO igreja (nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade)
VALUES ('Igreja Exemplo', '12345678901234', '2022-01-01', 'Setor Exemplo', 'Ministério Exemplo', '12345010', 'Rua Exemplo, 123', 'Bairro Exemplo', 'Cidade Exemplo');

INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('1', 'Adilson', 'pastor@gmail.com', '123', '2004-10-23', 'Pastor', 1);
    
INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('2', 'Samuel', 'obreiro@gmail.com', '123', '2004-10-23', 'Obreiro', 1);
    
INSERT INTO departamentos(nome, birth, data_congresso)
	VALUES ('Missões', '1978-11-03', '2024-10-10'); 
    
INSERT INTO saldo (saldo_atual, data_atualizacao) VALUES (0, CURDATE());

select * from user;
SELECT * FROM user WHERE id_igreja = 1;
SELECT * FROM membro WHERE id_igreja = 1;
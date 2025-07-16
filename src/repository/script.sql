DROP DATABASE IF EXISTS obreiro_digital;
CREATE DATABASE obreiro_digital;
USE obreiro_digital;

-- IGREJA COM SUPORTE À MATRIZ
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
    cidade VARCHAR(150) NOT NULL,
    id_matriz INT DEFAULT NULL,
    FOREIGN KEY (id_matriz) REFERENCES igreja(id_igreja) ON DELETE SET NULL
);

-- USUÁRIOS DA IGREJA (PASTORES, OBREIROS)
CREATE TABLE user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    cod_membro VARCHAR(16) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    birth DATE NOT NULL,
    cargo ENUM('Pastor', 'Obreiro', 'Pastor Matriz', 'Obreiro Matriz') NOT NULL,
    id_igreja INT,
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja)
);

-- DEPARTAMENTOS
CREATE TABLE departamentos (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    birth DATE NOT NULL,
    data_congresso DATE,
    id_igreja INT,
    is_global BOOLEAN DEFAULT FALSE,
    id_matriz INT DEFAULT NULL,
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja),
    FOREIGN KEY (id_matriz) REFERENCES igreja(id_igreja)
);

-- MEMBROS
CREATE TABLE membro (
    id_membro INT AUTO_INCREMENT PRIMARY KEY,
    cod_membro VARCHAR(16) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    numero INT(25),
    birth DATE NOT NULL,
    novo_convertido ENUM('Sim', 'Não') NOT NULL,
    id_departamento INT,
    id_igreja INT,
    FOREIGN KEY (id_departamento) REFERENCES departamentos (id_departamento),
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja)
);

-- VISITANTES
CREATE TABLE visitante (
    id_visitante INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cristao ENUM('Sim', 'Não'),
    data_visita DATE NOT NULL,
    congregacao VARCHAR(200),
    ministerio VARCHAR(150),
    id_membro INT,
    id_igreja INT,
    FOREIGN KEY (id_membro) REFERENCES membro(id_membro),
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja)
);

-- EVENTOS
CREATE TABLE eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    data_inicio DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    data_fim DATE NOT NULL,
    horario_fim TIME NOT NULL,
    local VARCHAR(150) NOT NULL,
    id_igreja INT,
    is_global BOOLEAN DEFAULT FALSE,
    id_matriz INT DEFAULT NULL,
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja),
    FOREIGN KEY (id_matriz) REFERENCES igreja(id_igreja)
);

-- SALDO
CREATE TABLE saldo (
    id_saldo INT AUTO_INCREMENT PRIMARY KEY,
    saldo_atual DECIMAL(10, 2) NOT NULL,
    data_atualizacao DATE NOT NULL,
    id_igreja INT,
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja)
);

-- FINANÇAS
CREATE TABLE financas (
    id_financas INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Entrada', 'Saída'),
    categoria ENUM('Oferta Simples', 'Dízimo', 'Oferta Especial', 'Contribuição para Missões', 'Contribuição para Obras') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    descricao TEXT NOT NULL,
    data DATE NOT NULL,
    id_saldo INT,
    id_igreja INT,
    FOREIGN KEY (id_saldo) REFERENCES saldo (id_saldo),
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja)
);

-- ESTOQUE
CREATE TABLE estoque (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    cod_produto TEXT,
    categoria ENUM('Cozinha', 'Limpeza', 'Materiais de Construção') NOT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade INT NOT NULL,
    validade DATE NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    id_igreja INT,
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja)
);

-- PEDIDOS
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    nome_produto VARCHAR(150) NOT NULL,
    categoria_produto VARCHAR(100) NOT NULL,
    quantidade INT NOT NULL,
    data_pedido DATE NOT NULL,
    status_pedido ENUM('Em Andamento', 'Entregue', 'Recusado') DEFAULT 'Em Andamento',
    motivo_recusa TEXT,
    data_entrega DATE,
    respondido BOOLEAN NOT NULL DEFAULT false,
    id_igreja INT,
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja)
);

-- AVISOS
CREATE TABLE avisos (
    id_aviso INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    conteudo TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_igreja INT,
    is_global BOOLEAN DEFAULT FALSE,
    id_matriz INT DEFAULT NULL,
    FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja),
    FOREIGN KEY (id_matriz) REFERENCES igreja(id_igreja)
);

-- BUG REPORTS
CREATE TABLE bug_reports (
    id_report INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    data_criacao DATETIME NOT NULL,
    FOREIGN KEY (id_user) REFERENCES user(id_user)
);

-- TRIGGER PARA CRIAR SALDO AUTOMÁTICO
-- DELIMITER //
-- CREATE TRIGGER AfterIgrejaInsert
-- AFTER INSERT ON igreja
-- FOR EACH ROW
-- BEGIN
--     INSERT INTO saldo (saldo_atual, data_atualizacao, id_igreja)
--     VALUES (0, CURDATE(), NEW.id_igreja);
-- END //
-- DELIMITER ;

INSERT INTO igreja (nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz)
	VALUES ('Assembléia de Deus Jardim São Marcos', '12345678901234', '2022-01-01', '47', 'Ministério do Belém', '06814165', 'Rua Augusto de Almeida Batista', 'Jardim São Marcos', 'Embu das Artes', 1);
	
INSERT INTO igreja (nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz)
	VALUES ('Assembléia de Deus Jardim São Francisco', '12345678901234', '2022-01-01', '47', 'Ministério do Belém', '06814165', 'Rua Augusto de Almeida Batista', 'Jardim São Marcos', 'Embu das Artes', null);

INSERT INTO igreja (nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz)
	VALUES ('Assembléia de Deus Jardim São Vicente', '12345678901234', '2022-01-01', '47', 'Ministério do Belém', '06814165', 'Rua Augusto de Almeida Batista', 'Jardim São Marcos', 'Embu das Artes', null);

INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('1', 'Adilson', 'pastor@gmail.com', '123', '2004-10-23', 'Pastor', 1);

INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('11', 'Carlos', 'pastorM@gmail.com', '123', '2004-10-23', 'Pastor Matriz', 2);

INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('2', 'Samuel', 'obreiro@gmail.com', '123', '2004-10-23', 'Obreiro', 1);
	
INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('22', 'Geraldo', 'obreiroM@gmail.com', '123', '2004-10-23', 'Obreiro Matriz', 2);
    
INSERT INTO departamentos(nome, birth, data_congresso, id_igreja, id_matriz)
	VALUES ('Missões', '1978-11-03', '2024-10-10', 1, null);

SELECT * FROM igreja WHERE id_matriz IS NULL;
SELECT * FROM igreja WHERE id_matriz = 1;

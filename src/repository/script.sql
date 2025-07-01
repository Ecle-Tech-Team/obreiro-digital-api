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
    cod_membro VARCHAR(16) NOT NULL,
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
    cod_membro VARCHAR(16) NOT NULL,
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

CREATE TABLE bug_reports (
    id_report INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    data_criacao DATETIME NOT NULL,
    
    FOREIGN KEY (id_user) REFERENCES user(id_user)
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
    
DELIMITER //

CREATE TRIGGER AfterIgrejaInsert
AFTER INSERT ON igreja
FOR EACH ROW
BEGIN
    INSERT INTO saldo (saldo_atual, data_atualizacao, id_igreja)
    VALUES (0, CURDATE(), NEW.id_igreja);
END //

DELIMITER ;


INSERT INTO igreja (nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade)
	VALUES ('Assembléia de Deus Jardim São Marcos', '12345678901234', '2022-01-01', '47', 'Ministério do Belém', '06814165', 'Rua Augusto de Almeida Batista', 'Jardim São Marcos', 'Embu das Artes');

INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('1', 'Adilson', 'pastor@gmail.com', '123', '2004-10-23', 'Pastor', 1);
    
INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) 
	VALUES ('2', 'Samuel', 'obreiro@gmail.com', '123', '2004-10-23', 'Obreiro', 1);
    
INSERT INTO departamentos(nome, birth, data_congresso, id_igreja)
	VALUES ('Missões', '1978-11-03', '2024-10-10', 1);

SELECT * FROM saldo; 
SELECT COUNT(*) as total_visitantes FROM visitante WHERE id_igreja = 1 AND WEEK(data_visita) = WEEK(NOW()) GROUP BY DATE(data_visita)
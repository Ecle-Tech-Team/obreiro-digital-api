-- Convites de uso único para o pastor de uma filial criar a própria conta.
-- Só o hash SHA-256 do código é guardado; datas em UTC.
CREATE TABLE IF NOT EXISTS convites (
  id_convite INT AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  id_igreja INT NOT NULL,
  criado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em DATETIME NOT NULL,
  usado_em DATETIME NULL,
  revogado_em DATETIME NULL,
  INDEX idx_convites_igreja (id_igreja),
  FOREIGN KEY (id_igreja) REFERENCES igreja(id_igreja),
  FOREIGN KEY (criado_por) REFERENCES user(id_user) ON DELETE SET NULL
);

-- Códigos de 6 dígitos para recuperar a senha. Só o HMAC do código é guardado; datas em UTC.
-- "tentativas" conta erros na janela de 1 hora e não zera ao pedir outro código,
-- para que pedir códigos novos não renove as chances de adivinhar.
CREATE TABLE IF NOT EXISTS password_resets (
  id_user INT PRIMARY KEY,
  code_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,
  tentativas TINYINT UNSIGNED NOT NULL DEFAULT 0,
  janela_inicio DATETIME NOT NULL,
  FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE
);

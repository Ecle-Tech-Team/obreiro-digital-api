-- Execute uma vez no banco existente antes de liberar novos lançamentos.
-- Preserva saldos existentes; igrejas sem linha de saldo recebem zero.
INSERT INTO saldo (saldo_atual, data_atualizacao, id_igreja)
SELECT 0.00, CURDATE(), i.id_igreja
FROM igreja AS i
WHERE NOT EXISTS (SELECT 1 FROM saldo AS s WHERE s.id_igreja = i.id_igreja);

-- Revise qualquer resultado desta consulta antes de adicionar um índice único.
SELECT id_igreja, COUNT(*) AS quantidade
FROM saldo
GROUP BY id_igreja
HAVING COUNT(*) > 1;

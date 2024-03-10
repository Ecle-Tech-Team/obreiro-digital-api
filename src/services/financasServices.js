import banco from '../repository/connection.js';

async function createFinancas(tipo, categoria, valor, descricao, data, id_igreja) {
    const sql = 'INSERT INTO financas (tipo, categoria, valor, descricao, data, id_igreja, id_saldo) VALUES (?, ?, ?, ?, ?, ?, 1)';

    const values = [tipo, categoria, valor, descricao, data, id_igreja];

    const conn = await banco.connect();
    const [result] = await conn.query(sql, values);
    const financasId = result.insertId; 
    if (tipo === 'Entrada') {
        await updateSaldoEntrada(valor, id_igreja);
    } else if (tipo === 'Saída') {
        await updateSaldoSaida(valor, id_igreja);
    }

    conn.end();

    return financasId;
}

async function updateSaldoEntrada(valor, id_igreja) {
    const sql = 'UPDATE saldo SET saldo_atual = saldo_atual + ? WHERE id_igreja = ?';

    const values = [valor, id_igreja];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();
}

async function updateSaldoSaida(valor, id_igreja) {
    const sql = 'UPDATE saldo SET saldo_atual = saldo_atual - ? WHERE id_igreja = ?';

    const values = [valor, id_igreja];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();
}

async function getFinancas(id_igreja) {
    const sql = "SELECT * FROM financas WHERE id_igreja = ?";
  
    const conn = await banco.connect();
    const [rows] = await conn.query(sql, [id_igreja]);
    conn.end();
  
    return rows;
}

async function getSaldo(id_igreja) {
    const sql = "SELECT saldo_atual FROM saldo WHERE id_igreja = ? ORDER BY id_saldo DESC LIMIT 1";

    const conn = await banco.connect();
    const [rows] = await conn.query(sql, [id_igreja]);
    conn.end();

    if (rows.length > 0) {
        return rows[0].saldo_atual;
    } else {
        return 0;
    }
}
  
async function updateFinancas(id_financas, tipo, categoria, valor, descricao, data, id_igreja) {
    const sql = "UPDATE financas SET tipo = ?, categoria = ?, valor = ?, descricao = ?, data = ?, id_igreja = ? WHERE id_financas = ?";
    
    const values = [tipo, categoria, valor, descricao, data, id_financas, id_igreja];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();      
}

export default { createFinancas, getFinancas, getSaldo, updateFinancas, updateSaldoEntrada, updateSaldoSaida };

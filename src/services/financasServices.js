import banco from '../repository/connection.js';

async function createFinancas(tipo, categoria, valor, descricao, data) {
    const sql = 'INSERT INTO financas (tipo, categoria, valor, descricao, data) VALUES (?, ?, ?, ?, ?)';

    const values = [tipo, categoria, valor, descricao, data];

    const conn = await banco.connect();
    const [result] = await conn.query(sql, values);
    const financasId = result.insertId; 
    if (tipo === 'Entrada') {
        await updateSaldoEntrada(valor);
    } else if (tipo === 'Saída') {
        await updateSaldoSaida(valor);
    }

    conn.end();

    return financasId;
}

async function updateSaldoEntrada(valor) {
    const sql = 'UPDATE saldo SET saldo_atual = saldo_atual + ? WHERE id_saldo = 1';

    const values = [valor];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();
}

async function updateSaldoSaida(valor) {
    const sql = 'UPDATE saldo SET saldo_atual = saldo_atual - ? WHERE id_saldo = 1';

    const values = [valor];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();
}

async function getFinancas() {
    const sql = "SELECT * FROM financas";
  
    const conn = await banco.connect();
    const [rows] = await conn.query(sql);
    conn.end();
  
    return rows;
}

async function getSaldo() {
    const sql = "SELECT saldo_atual FROM saldo ORDER BY id_saldo DESC LIMIT 1";

    const conn = await banco.connect();
    const [rows] = await conn.query(sql);
    conn.end();

    if (rows.length > 0) {
        return rows[0].saldo_atual;
    } else {
        return 0;
    }
}
  
async function updateFinancas(id_financas, tipo, categoria, valor, descricao, data) {
    const sql = "UPDATE financas SET tipo = ?, categoria = ?, valor = ?, descricao = ?, data = ? WHERE id_financas = ?";
    
    const values = [tipo, categoria, valor, descricao, data, id_financas];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();      
}

export default { createFinancas, getFinancas, getSaldo, updateFinancas, updateSaldoEntrada, updateSaldoSaida };

import banco from '../repository/connection.js';

async function createProduto(cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja) {
    const sql = "INSERT INTO estoque (cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja) VALUES (?, ?, ?, ?, ?, ?, ?)";

    const values = [cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja];

    const conn = await banco.connect();
  try {
    await conn.query(sql, values);


  } finally { await conn.end(); }
}

async function updateEstoque(id_produto, cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja) {
    const sql = "UPDATE estoque SET cod_produto = ?, categoria = ?, nome_produto = ?, quantidade = ?, validade = ?, preco_unitario = ? WHERE id_produto = ? AND id_igreja = ?";

    const values = [cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_produto, id_igreja];

    const conn = await banco.connect();
    try { const [result] = await conn.query(sql, values); if (result.affectedRows !== 1) throw new Error('Produto não encontrado.'); }
    finally { await conn.end(); }
}

async function getIgrejas() {
    const sql = "SELECT * FROM igreja";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
}

async function selectEstoque(id_igreja) {
    const sql = "SELECT * FROM estoque WHERE id_igreja = ?";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    };
};

async function searchProdutos(termoPesquisa, id_igreja) {
    const sql = "SELECT * FROM estoque WHERE id_igreja = ? AND (cod_produto = ? OR nome_produto LIKE ?)";

    const values = [id_igreja, termoPesquisa, `%${termoPesquisa}%`];

    const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, values);


    return rows;

  } finally { await conn.end(); }
}

async function deleteProduto(id_produto, id_igreja) {
    const sql = "DELETE FROM estoque WHERE id_produto = ? AND id_igreja = ?";
    const conn = await banco.connect();
    try {
        const [result] = await conn.query(sql, [id_produto, id_igreja]);
        if (result.affectedRows !== 1) throw new Error('Produto não encontrado.');
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
}

export default { createProduto, updateEstoque, getIgrejas, selectEstoque, searchProdutos, deleteProduto };

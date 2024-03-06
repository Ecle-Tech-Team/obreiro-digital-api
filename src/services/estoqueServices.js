import banco from '../repository/connection.js';

async function createProduto(cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja) {
    const sql = "INSERT INTO estoque (cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    const values = [cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();
}

async function updateEstoque(id_produto, cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja) {
    const sql = "UPDATE estoque SET cod_produto = ?, categoria = ?, nome_produto = ?, quantidade = ?, validade = ?, preco_unitario = ?, id_igreja = ? WHERE id_produto = ?";
    
    const values = [cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja, id_produto];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();      
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
        conn.end();
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
        conn.end();
    };
};

async function searchProdutos(termoPesquisa) {
    const sql = "SELECT * FROM estoque WHERE cod_produto = ? OR nome_produto LIKE ?";
    
    const values = [termoPesquisa, `%${termoPesquisa}%`];

    const conn = await banco.connect();
    const [rows] = await conn.query(sql, values);
    conn.end();

    return rows;
}

export default { createProduto, updateEstoque, getIgrejas, selectEstoque, searchProdutos };
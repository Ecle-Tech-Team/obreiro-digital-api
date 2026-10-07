import banco from '../repository/connection.js';

async function createPedido(nome_produto, categoria_produto, quantidade, data_pedido, id_igreja) {
    const sql = "INSERT INTO pedidos(nome_produto, categoria_produto, quantidade, data_pedido, respondido, id_igreja) VALUES (?, ?, ?, ?, false, ?)";

    const values = [nome_produto, categoria_produto, quantidade, data_pedido, id_igreja];

    const conn = await banco.connect();
  try {
    await conn.query(sql, values);


  } finally { await conn.end(); }
};

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

async function responderPedido(id_pedido, status_pedido, data_entrega, motivo_recusa, id_igreja) {
    const conn = await banco.connect();

    try {
        const [rows] = await conn.query('SELECT respondido FROM pedidos WHERE id_pedido = ? AND id_igreja = ?', [id_pedido, id_igreja]);

        if (rows.length === 0) {
            throw new Error("Pedido não encontrado");
        }

        if (rows[0].respondido) {
            throw new Error("Este pedido já foi respondido e não pode ser atualizado.");
        }

        let sql = "";
        let values = [];

        if (status_pedido === 'Entregue') {
            sql = "UPDATE pedidos SET status_pedido = ?, data_entrega = ?, respondido = true WHERE id_pedido = ? AND id_igreja = ? AND respondido = false";
            values = [status_pedido, data_entrega, id_pedido, id_igreja];
        } else if (status_pedido === 'Recusado') {
            sql = "UPDATE pedidos SET status_pedido = ?, motivo_recusa = ?, respondido = true WHERE id_pedido = ? AND id_igreja = ? AND respondido = false";
            values = [status_pedido, motivo_recusa, id_pedido, id_igreja];
        } else {
            throw new Error("Status de pedido inválido");
        }

        const [result] = await conn.query(sql, values);
        if (result.affectedRows !== 1) throw new Error('Pedido já respondido.');
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
};

async function selectPedidos(id_igreja) {
    const sql = "SELECT * FROM pedidos WHERE id_igreja = ?";

    const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, [id_igreja]);


    return rows;

  } finally { await conn.end(); }
};

async function updatePedidos(id_pedido, nome_produto, categoria_produto, quantidade, data_pedido, status_pedido, id_igreja) {
    const sql = "UPDATE pedidos SET nome_produto = ?, categoria_produto = ?, quantidade = ?, data_pedido = ?, status_pedido = ?, respondido = CASE WHEN ? IN ('Entregue', 'Recusado') THEN true ELSE respondido END WHERE id_pedido = ? AND id_igreja = ? AND respondido = false";

    const values = [nome_produto, categoria_produto, quantidade, data_pedido, status_pedido, status_pedido, id_pedido, id_igreja];

    const conn = await banco.connect();
  try {
    const [result] = await conn.query(sql, values);
    if (result.affectedRows !== 1) throw new Error('Pedido não encontrado ou já respondido.');


  } finally { await conn.end(); }
};

async function countPedidosEntregues(id_igreja) {
    const sql = "SELECT COUNT(*) as total FROM pedidos WHERE id_igreja = ? AND status_pedido = 'Entregue'";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows[0].total;
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
};

async function countPedidosEmAndamento(id_igreja) {
    const sql = "SELECT COUNT(*) as total FROM pedidos WHERE id_igreja = ? AND status_pedido = 'Em Andamento'";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows[0].total;
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
};

async function countPedidosRecusados(id_igreja) {
    const sql = "SELECT COUNT(*) as total FROM pedidos WHERE id_igreja = ? AND status_pedido = 'Recusado'";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows[0].total;
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
};

async function countPedidosTotais(id_igreja) {
    const sql = "SELECT COUNT(*) as total FROM pedidos WHERE id_igreja = ?";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows[0].total;
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
}


async function deletePedido(id_pedido, id_igreja) {
    const sql = "DELETE FROM pedidos WHERE id_pedido = ? AND id_igreja = ?";
    const conn = await banco.connect();
    try {
        const [result] = await conn.query(sql, [id_pedido, id_igreja]);
        if (result.affectedRows !== 1) throw new Error('Pedido não encontrado.');
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
    }
}


export default { createPedido, getIgrejas, responderPedido, selectPedidos, updatePedidos, countPedidosEntregues, countPedidosEmAndamento, countPedidosRecusados, countPedidosTotais, deletePedido };

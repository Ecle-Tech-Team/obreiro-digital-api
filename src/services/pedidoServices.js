import banco from '../repository/connection.js';

export class PedidoError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

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

// A autorização (igreja responsável e cargo) é feita no middleware de segurança.
async function responderPedido(id_pedido, status_pedido, data_entrega, motivo_recusa) {
    let sql;
    let values;
    if (status_pedido === 'Entregue') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data_entrega || ''))) throw new PedidoError('Informe a data de entrega.');
        sql = "UPDATE pedidos SET status_pedido = 'Entregue', data_entrega = ?, motivo_recusa = NULL, respondido = true WHERE id_pedido = ? AND respondido = false";
        values = [data_entrega, id_pedido];
    } else if (status_pedido === 'Recusado') {
        const motivo = String(motivo_recusa || '').trim();
        if (!motivo) throw new PedidoError('Informe o motivo da recusa.');
        if (motivo.length > 1000) throw new PedidoError('Motivo da recusa muito longo.');
        sql = "UPDATE pedidos SET status_pedido = 'Recusado', motivo_recusa = ?, data_entrega = NULL, respondido = true WHERE id_pedido = ? AND respondido = false";
        values = [motivo, id_pedido];
    } else {
        throw new PedidoError('Resposta inválida: use Entregue ou Recusado.');
    }

    const conn = await banco.connect();
    try {
        const [result] = await conn.query(sql, values);
        if (result.affectedRows !== 1) throw new PedidoError('Este pedido já foi respondido.', 409);
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

// Quem pediu só altera os dados do pedido; o status é definido por quem responde.
async function updatePedidos(id_pedido, nome_produto, categoria_produto, quantidade, data_pedido, id_igreja) {
    const sql = "UPDATE pedidos SET nome_produto = ?, categoria_produto = ?, quantidade = ?, data_pedido = ? WHERE id_pedido = ? AND id_igreja = ? AND respondido = false";

    const values = [nome_produto, categoria_produto, quantidade, data_pedido, id_pedido, id_igreja];

    const conn = await banco.connect();
  try {
    const [result] = await conn.query(sql, values);
    if (result.affectedRows !== 1) throw new PedidoError('Pedido já respondido não pode ser editado.', 409);


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


// Pedidos que a igreja do usuário deve responder: os próprios (se ela não tiver matriz) e os das filiais.
async function selectPedidosRecebidos(id_igreja) {
    const sql = `SELECT p.*, i.nome AS nome_igreja FROM pedidos p
        JOIN igreja i ON i.id_igreja = p.id_igreja
        WHERE COALESCE(i.id_matriz, i.id_igreja) = ?
        ORDER BY p.respondido ASC, p.data_pedido DESC, p.id_pedido DESC`;
    const conn = await banco.connect();
    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows;
    } finally { await conn.end(); }
}

export default { selectPedidosRecebidos, createPedido, getIgrejas, responderPedido, selectPedidos, updatePedidos, countPedidosEntregues, countPedidosEmAndamento, countPedidosRecusados, countPedidosTotais, deletePedido };

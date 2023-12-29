import banco from '../repository/connection.js';

async function selectEmployee(id_employee) {

    const sql = "SELECT name_employee, cpf_employee, birth_employee, gender, email, password_employee, name_office, name_sector, registration, admission_employee, type_user FROM employee INNER JOIN offices ON employee.id_office = offices.id_office LEFT JOIN sectors ON employee.id_sector = sectors.id_sector WHERE employee.id_employee = ?";

    const conn = await banco.connect();
    const [row] = await conn.query(sql, id_employee);
    conn.end();

    if (row.length > 0) {
        return row[0];
    }

    else {
        return false;
    }
}

async function updateEmployee(id, password) {

    const sql = "UPDATE employee SET password_employee = ? WHERE id_employee = ?";

    const values = [password, id];

    const conn = await banco.connect();
    const query = await conn.query(sql, values);
    const [consult] = await conn.query("SELECT password_employee FROM employee WHERE id_employee = ?", id)
    conn.end();

    if (consult[0].password_employee == password) {
        return true;
    }

    else {
        return false;
    }
}

export default {selectEmployee, updateEmployee};
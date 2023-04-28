const mysql = require("../dbconnectionPromise")
const proyMenuModel = {

    guardar: async function (menu) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("insert into proy_menu(Menu) values(?)", [menu.Menu]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    editar: async function (menu) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update proy_menu set Menu=? where idMenu=?", [menu.Menu, menu.idMenu]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    listar: async function () {
        const connection = await mysql.connection();
        try {
            const menus = await connection.query("select * from proy_menu");
            return menus;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }
}
module.exports = proyMenuModel;
const mysqlClass = require("../dbConnectionClass");
const estadisticaModelo = {
    traerDataEstadistica: async function () {
        const data = await mysqlClass.ejecutarQueryPreparado(`select * from ve_resumenlotes`, {})
        return data
    }

}

module.exports = estadisticaModelo

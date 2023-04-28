const { poolPromise } = require('../dbconnectionMSSQL')
const DBCostsSG = require('./DBCostsSG')

var Clientes = {
    getClientes_Trabajadores : async function() {
        let json = {}
        try {
            let resDBCostsSG = await DBCostsSG.getClientes()
            let terceros = resDBCostsSG.result
            let resTrabajadores = await this.getTrabajadores()
            let trabajadores = resTrabajadores.rows
            let clientes = [];
            terceros.forEach(e => { 
                e.TipoCliente = "C"
                clientes.push(e) 
            })
            trabajadores.forEach(e => { 
                e.TipoCliente = "T"
                clientes.push(e) 
            })
            json = {
                success : true,
                message : "Extracción de clientes realizada satisfactoriamente.",
                rows : clientes
            }            
        } catch (error) {
            json = {
                success : false,
                message : "Error en la ruta clientes/getClientes_Trabajadores",
                error : error.code
            }
        }
        return json
    },
    getTrabajadores : async function(){
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(`SELECT P010_CODIG CL_CCODCLI,P010_LIBEL CL_CNUMRUC, P010_NOMBR CL_CNOMCLI FROM RSPLACAR.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020' 
                UNION ALL
                SELECT P010_CODIG CL_CCODCLI,P010_LIBEL CL_CNUMRUC, P010_NOMBR CL_CNOMCLI FROM RSPLACAR_01.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020'`)
            json = {
                success : true,
                message : "Extracción de clientes realizada satisfactoriamente.",
                rows : result.recordset
            }            
        } catch (error) {
            json = {
                success : false,
                message : "Error en la ruta clientes/getTrabajadores",
                error : error.code,
                rows : []
            }
        }
        return json
    }
}
module.exports = Clientes;
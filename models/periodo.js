var db=require('../dbconnection');

var Periodo = {
    getAllPeriodos: async function() {
        return await db.query("SELECT * FROM periodo pe INNER JOIN usuario us ON us.idUsuario = pe.idUsuario");  
    },
    getPeriodosEstado1: async function() {
        return await db.query("SELECT * FROM periodo WHERE Estado = 1");
    },
    addPeriodo: async function(Periodo) {
        let YearMonth = Periodo.Year + Periodo.Month;
        console.log(Periodo)
        let rows = await db.query("INSERT INTO periodo(YearMonth, Year, Month, Estado, idUsuario, FechaModificar, FechaInicio, FechaFin) VALUES (?,?,?,?,?,?,?,?)",
        [YearMonth, Periodo.Year, Periodo.Month, 1, Periodo.userId, new Date(Periodo.fecModi), Periodo.FechaInicio, Periodo.FechaFin])
        let json = {
            success : true,
            message : 'Se registró correctamente'
        }
        return json;
    },
    Getperiodo: async function() {
        let rows = await db.query("SELECT * FROM periodo GROUP BY Year ORDER BY Year");
        return rows;
    },
    getPeriodosByPeriodo: async function(Periodo) {
        let rows = await db.query("SELECT * FROM periodo WHERE YearMonth = ?",[Periodo]);
        return rows[0];
    }
}
module.exports=Periodo;
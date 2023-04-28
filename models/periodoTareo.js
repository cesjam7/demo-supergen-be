var db=require('../dbconnection');

var Periodo = {
    getAllPeriodos: async function() {
        return await db.query("SELECT * FROM periodo_tareo pe INNER JOIN usuario us ON us.idUsuario = pe.idUsuario");  
    },
    getPeriodosEstado1: async function() {
        return await db.query("SELECT * FROM periodo_tareo WHERE Estado = 1");
    },
    addPeriodo: async function(Periodo) {
        let YearMonth = Periodo.Year + Periodo.Month;
        console.log(Periodo)
        let rows = await db.query("INSERT INTO periodo_tareo(YearMonth, Year, Month, Estado, idUsuario, FechaModificar, FechaInicio, FechaFin) VALUES (?,?,?,?,?,?,?,?)",
        [YearMonth, Periodo.Year, Periodo.Month, 1, Periodo.userId, new Date(Periodo.fecModi), Periodo.FechaInicio, Periodo.FechaFin])
        let json = {
            success : true,
            message : 'Se registró correctamente'
        }
        return json;
    },
    Getperiodo: async function() {
        let rows = await db.query("SELECT * FROM periodo_tareo GROUP BY Year ORDER BY Year");
        return rows;
    },
    desactivatePeriodos: async function(Periodo) {
        await db.query("UPDATE periodo_tareo SET Estado = ?, FechaModificar = ? WHERE YearMonth = ?", [0, new Date(), Periodo.YearMonth]);
    },
    activarPeriodo: async function(Periodo) {
      
        await db.query("UPDATE periodo_tareo SET Estado = ?, FechaModificar = ? WHERE YearMonth = ?", [1, new Date(), Periodo.YearMonth]);

    },
    getPeriodosByPeriodo: async function(Periodo) {
        let rows = await db.query("SELECT * FROM periodo_tareo WHERE YearMonth = ?",[Periodo]);
        return rows[0];
    }
}
module.exports=Periodo;
var db = require('../dbconnection');
const produccionMortalidad = require('./produccionMortalidad');
var Nacimientos_reportes = {
    formatDate : function(params) {
        if (typeof params == "undefined") {
            var hoy = new Date();
        } else {
            var hoy = new Date(params);
        }
        var dd = hoy.getDate();
        var mm = hoy.getMonth() + 1;
        var yyyy = hoy.getFullYear();

        if (dd < 10) {
            dd = '0' + dd;
        }

        if (mm < 10) {
            mm = '0' + mm;
        }
        hoy = yyyy+ '-' + mm + '-' + dd;
        return hoy;
    },
    getAllCargos: async function() {
        return await db.query("SELECT * FROM cargas WHERE Estado = 0");
    },
    getAllNacimientosReportes: async function name() {
        let _this = this;
        let rows = await db.query(`SELECT * 
        FROM nacimiento_reporte
        ORDER BY Fecha_Nacimiento DESC`);
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
        
            e.cerrado = await produccionMortalidad.verifyPeriodo({fecha: _this.formatDate(e.Fecha_Nacimiento)})
            if(e.cerrado == true){
                e.style = {
                    "opacity" : "0.8"
                }
            }
        }
        return rows
    },
    getNacimientosReportesById: async function(idNacimientoReporte) {
        let cabecera = await db.query("SELECT * FROM nacimiento_reporte WHERE idNacimientoReporte = ?", [idNacimientoReporte])
        let detalle = await db.query(`SELECT * FROM nacimiento_reporte_det nd 
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE idNacimientoReporte = ?
        ORDER BY lo.lote_str`, [idNacimientoReporte]);
        let json = {
            cabecera,
            detalle
        }
        return json;
    },
    deleteNacimientosReportesById: async function(id) {

        let rows = await db.query("SELECT CodCarga FROM nacimiento_reporte WHERE idNacimientoReporte = ?", [id]);
        let codCarga = rows[0].CodCarga;
        let updateEstado = await db.query("UPDATE nacimiento SET Estado = '0' WHERE CodCarga = ?", [codCarga]);
        let cabecera = await db.query("DELETE FROM nacimiento_reporte WHERE idNacimientoReporte = ?", [id])
        let detalle = await db.query("DELETE FROM nacimiento_reporte_det WHERE idNacimientoReporte = ?", [id]);

        let json = {
            cabecera,
            detalle,
            updateEstado
        }
        return json;
    },
    selectMaxId: async function() {
        return await db.query("SELECT MAX(idNacimientoReporte) as maxId FROM nacimiento_reporte");
    },
    addNacimientoReporte: async function(Nacimiento) {
        function getYear(params) {
            var hoy = new Date(params);
            var yyyy = hoy.getFullYear();
            return yyyy;
        }
        let carga = await db.query("SELECT * FROM cargas WHERE idCargas = ?", [Nacimiento.idCarga]);
        let CodCarga = carga[0].CodCarga;
        let Fecha_Transferencia = getYear(carga[0].Fecha_Transferencia);
        let rows = await db.query(`INSERT INTO nacimiento_reporte (
        idNacimientoReporte, idNacimiento, idCarga, CodCarga, Cliente, RUC, Cliente2, RUC2, Fecha_Nacimiento,
        Fecha_Carga ) VALUES (?,?,?,?,?,?,?,?,?,?)`, [Nacimiento.idNacRep, Nacimiento.idNac, Nacimiento.idCarga, Fecha_Transferencia + '-' + CodCarga,
            Nacimiento.Cliente, Nacimiento.RUC, Nacimiento.Cliente2, Nacimiento.RUC2, new Date(Nacimiento.fecNac), new Date(Nacimiento.fecCarga)
        ])
        for (let i = 0; i < Nacimiento.detalle.length; i++) {
            const c = Nacimiento.detalle[i];
            let query = `INSERT INTO nacimiento_reporte_det 
                (idNacimientoReporte, idLote, CodigoLote, huevoCargado, prodVendido, prodNoVendido, subProducto, 
                sinSexar, Otros, totalPollo1ra, porcPollo1ra, descarteSaca, descarteRecuperacion, descarteSexado, 
                descarteVacunacion, descarteDesunado, descarteTotal, porcDescarteTotal, totalPolloNacido, porcTotalPolloNacido,carneNoVendida)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
            await db.query(query, [Nacimiento.idNacRep, c.idLote, c.CodigoLote, c.HI, c.Ventas, c.Estimadas, c.subProductoReal,
                c.sinSexar, c.Otros, c.pollos1ra, c.porc1ra, c.Saca, c.Recuperacion, c.Sexado,
                c.Vacunacion, c.Desunado, c.descartes, c.porcDescartes, c.totalNacidos, c.porcNacidoReal,c.carneNoVendida
            ])

        }
        await db.query("UPDATE nacimiento SET Estado = '1' WHERE idNacimiento = ?", [Nacimiento.idNac]);
        let json = {
            success: true,
            message: 'Se registró correctamente.'
        }
        return json;
    },
    getNacimientoById: async function(idLote) {
        return await db.query("SELECT * FROM nacimiento_det nd INNER JOIN lotes lo on lo.idLote = nd.idLote WHERE nd.idLote = ?", [idLote]);
    }
}
module.exports = Nacimientos_reportes;
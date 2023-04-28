var db=require('../dbconnection');
const axios = require('axios');

var produccionDespacho = {
    getStockHI:async () => {
        let rows = await db.query("SELECT * FROM stock_diario_hi s INNER JOIN lotes lo on lo.idLote = s.idLote WHERE numeroGuia = 0 ORDER BY lo.lote_str, s.Edad")
        return rows;
    },
    getStockHC:async () => {
        let rows = await db.query("SELECT MAX(idStockMensualHC), s.idProduccion, s.idLote, MAX(year), MAX(month), SUM(saldoFinTipoNormal) as saldoFinTipoNormal, SUM(saldoFinTipoDY) as saldoFinTipoDY,lo.* FROM `stock_mensual_hc` s INNER JOIN lotes lo on lo.idLote = s.idLote GROUP BY lo.idLote")
        return rows;
    },
    getPF:async (IdLote) => {
        let rows = await db.query("SELECT * FROM produccion_huevos_det WHERE IdLote = ?",[IdLote])
        return rows;
    },
    updateHuevos:async (Stock) => {
        let rows = await db.query("SELECT semana_prod,TotalDiarioProd_Huevo FROM produccion_huevos_det WHERE IdLote = "+Stock.idLote+" and fechaRegistro LIKE '%"+Stock.fecha+"%'");
        if(typeof rows[0] == "undefined"){
            let json = {
                success : false,
                message : 'No hay registros en esta fecha'
            }
            return json;
        }else{
            let semana = rows[0].semana_prod;
            let TotalDiarioProd_Huevo_ant = rows[0].TotalDiarioProd_Huevo;
            if(TotalDiarioProd_Huevo_ant != 0){
                let TotalDiario_Contable = parseInt(TotalDiarioProd_Huevo_ant) - parseInt(Stock.cantidad)
                let rows2 = await db.query("UPDATE produccion_huevos_det SET HNI_PruebaFert = '"+Stock.cantidad+"' , TotalDiario_Contable = '"+ TotalDiario_Contable +"' WHERE IdLote = "+Stock.idLote+" and fechaRegistro LIKE '%"+Stock.fecha+"%'");
                let rows3 = await db.query("SELECT SUM(HNI_PruebaFert) as HNI_PruebaFert, SUM(TotalDiario_Contable) as TotalSem_Contable FROM produccion_huevos_det WHERE IdLote = ? and semana_prod = ?",
                [Stock.idLote, semana]);
                let HNI_PruebaFert = rows3[0].HNI_PruebaFert
                let TotalSem_Contable = rows3[0].TotalSem_Contable
                let rows4 = await db.query("UPDATE produccion_huevos_sem set HNI_PruebaFert = ?, TotalSem_Contable = ? WHERE IdLote = ? and semana_prod = ?",
                [HNI_PruebaFert, TotalSem_Contable, Stock.idLote, semana])
                let json = {
                    success : true,
                    message : 'Se Registró correctamente la Prueba de Fertilidad'
                }
                return json;
            }else{
                let json = {
                    success : false,
                    message : 'No hay Stock'
                }
                return json;
            }
        }
    },
    updateStockHI: async (Stock) => {
        for (let i = 0; i < Stock.ids.length; i++) {
            const element = Stock.ids[i];
            let div = element.split("-");
            let idLote = div[0];
            let Edad = div[1];
            let rows1 = await db.query("call refreshStockDiarioHI(?,?,?)",[idLote, Edad,Stock.guia])
            console.log("rows1",rows1);
            let rows2 = await db.query("call refreshStockMensualHI(?,?)",[idLote, Edad])
            console.log("rows2",rows2);
        }
        let json = {
            success : true,
            message : 'Se registró correctamente',
        }
        return json;
    },
    updateStockHC: async (Stock) => {
        let arrayErrors = [];
        for (let i = 0; i < Stock.data.length; i++) {
            const element = Stock.data[i];
            if(element != null){
                if(element.cantidadNormal == 0 && element.cantidadDY == 0){
                    arrayErrors.push(element.lote);
                }else{
                    let rows1 = await db.query("INSERT INTO stock_diario_hc (idProduccion , idLote , cantidadTipoNormal, cantidadTipoDY, tipoMovimiento, numeroGuia) values(?,?,?,?,?,?)",
                    [element.idProduccion, element.idLote, element.cantidadNormal, element.cantidadDY, 'S', Stock.guiaVenta])
                    let id = rows1.insertId;
                    let rows = await db.query("SELECT * FROM stock_diario_hc WHERE idStockDiarioHC = ?",[id])
                    let fecha = new Date(rows[0].fechaRegistro);
                    var dd = fecha.getDate();
                    var mm = fecha.getMonth()+1; 
                    var yyyy = fecha.getFullYear();
                    if(dd<10) {
                    dd='0'+dd
                    }
                    if(mm<10) {
                    mm='0'+mm
                    }
                    let fechaCompleta = yyyy+'-'+mm;
                    let rows3 = await db.query("call refreshStockMensualHC(?,?,?,?,?,?)",[element.idLote, yyyy, mm, fechaCompleta, element.cantidadNormal, element.cantidadDY])
                    console.log("rows3",rows3);
                }
            }
        }
        if(arrayErrors.length == 0){
            let json = {
                success : true,
                message : 'Se registró correctamente',
            }
            return json;
        }else{
            let json = {
                success : false,
                message : arrayErrors.join(' / '),
            }
            return json;
        }
    }
}
module.exports=produccionDespacho;
var db=require('../dbconnection');
const produccionMortalidad = require('./produccionMortalidad');

var Cargos = {
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
    getAllCargos:async function(){
        let _this = this;
        let rows = await db.query("SELECT * FROM cargas ORDER BY Fecha_Transferencia DESC ");
        
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            if(e.RUC == '20221084684'){
                e.Style = {
                    'color' : 'white',
                    'background' : '#e2231a'
                }
            }else if(e.RUC == "20131589086" ){
                e.Style = {
                    'color' : 'white',
                    'background' : '#199ff7'
                }
            }else if(e.RUC == "20155261570" ){
                e.Style = {
                    'color' : 'white',
                    'background' : '#e44761'
                }
            }else if(e.RUC == "20132100552" ){
                e.Style = {
                    'color' : 'white',
                    'background' : '#dede31'
                }
            }else{
                e.Style = {
                    'color' : 'white',
                    'background' : 'green'
                }
            }

            if(e.RUC2 == '20221084684'){
                e.Style2 = {
                    'color' : 'white',
                    'background' : '#e2231a'
                }
            }else if(e.RUC2 == "20131589086" ){
                e.Style2 = {
                    'color' : 'white',
                    'background' : '#199ff7'
                }
            }else if(e.RUC2 == "20155261570" ){
                e.Style2 = {
                    'color' : 'white',
                    'background' : '#e44761'
                }
            }else if(e.RUC2 == "20132100552" ){
                e.Style2 = {
                    'color' : 'white',
                    'background' : '#dede31'
                }
            }else{
                e.Style2 = {
                    'color' : 'white',
                    'background' : 'green'
                }
            }

            e.cerrado = await produccionMortalidad.verifyPeriodo({fecha: _this.formatDate(e.Fecha_Carga)})

            if(e.cerrado == true){
                e.style = {
                    "opacity" : "0.8"
                }
            }
        }
        return rows;
    },
    getCargoById:function(id,callback){
        return db.query("SELECT * FROM cargas WHERE idCargas=?",[id],callback);
    },
    getCargodetById:async function(id){
        let rows1 = await db.query("SELECT * FROM cargas_det WHERE idCargas = ?",[id]);
        let rows2 = await db.query("SELECT Lote FROM cargas_det WHERE idCargas = ? GROUP BY Lote",[id]);
        let json = {
            data : rows1,
            lotes : rows2
        }
        console.log(json);
        return json;
    },
    addCargo: async function(Cargo){
        return await db.query("INSERT INTO cargas (CodCarga, Cliente, RUC, Cliente2, RUC2,Fecha_Carga,Fecha_Transferencia, Fecha_Nacimiento,Pedido_Hembras,Pedido_Machos,Total) values(?,?,?,?,?,?,?,?,?,?,?)",
        [Cargo.CodCarga, Cargo.cliente, Cargo.RUC, Cargo.cliente2, Cargo.RUC2, Cargo.fecCarga,Cargo.fecTransfer,Cargo.fecNac,Cargo.pedHembras,Cargo.pedMachos,Cargo.total]);
    },
    addDetalleCargo: async function(Cargo, idCargo){
        let arrayView = [];
        for (let i = 0; i < Cargo.detalle.length; i++) {
            const element = Cargo.detalle[i];
            arrayView[element.NombreLote] = {
                Lote : element.Lote,
                NombreLote : element.NombreLote,
                CodigoLote : element.NombreLote,
                TipoA : 0,
                TipoB : 0,
                TipoB1 : 0,
                TipoC : 0,
                Total : 0,
                DiasAlm: element.DiasAlm,
                HC : element.Mermas,
                Semana : element.Edad
            }
            await db.query("INSERT INTO cargas_det (CodigoLote,Num_incubadora,Coche,Lote, Tipo_HI,Fecha_Postura_Inicio, Fecha_Postura_Fin,Bandeja,Unidades,Cantidad,FechaHora_Precalentamiento,Semana,Merma_HC,idCargas,DiasAlm) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [element.NombreLote,element.numIncubadora,element.Coche,element.Lote,element.tipoHI,element.fecPostura,element.fecPosturafin,element.numBandeja,element.unidades,element.cantidad,element.fecHoraPrecal,element.Edad,element.Mermas,idCargo,element.DiasAlm]);
        }

        for (let j = 0; j < Cargo.detalle.length; j++) {
            const element = Cargo.detalle[j];
            let CodigoLote = element.NombreLote;
            if(typeof arrayView[CodigoLote] != "undefined"){
                if(element.tipoHI == "A"){
                    arrayView[CodigoLote].TipoA = arrayView[CodigoLote].TipoA + element.cantidad
                }else if(element.tipoHI == "B"){
                    arrayView[CodigoLote].TipoB = arrayView[CodigoLote].TipoB + element.cantidad
                }else if(element.tipoHI == "B1"){
                    arrayView[CodigoLote].TipoB1 = arrayView[CodigoLote].TipoB1 + element.cantidad
                }else if(element.tipoHI == "C"){
                    arrayView[CodigoLote].TipoC = arrayView[CodigoLote].TipoC + element.cantidad
                }

                arrayView[CodigoLote].Total = arrayView[CodigoLote].Total + element.cantidad

                arrayView[CodigoLote].HC = element.Mermas

                arrayView[CodigoLote].Semana = element.Edad;

                arrayView[CodigoLote].DiasAlm = element.DiasAlm;
                
                if(typeof arrayView[CodigoLote].fecPostura == "undefined"){
                    arrayView[CodigoLote].fecPostura = element.fecPostura;
                }else{
                    let fpi1 = new Date(arrayView[CodigoLote].fecPostura);
                    let fpi2 = new Date(element.fecPostura);
                    if(fpi2 < fpi1){
                        arrayView[CodigoLote].fecPostura = element.fecPostura;
                    }
                }

                if(typeof arrayView[CodigoLote].fecPosturafin == "undefined"){
                    arrayView[CodigoLote].fecPosturafin = element.fecPosturafin;
                }else{
                    let fpf1 = new Date(arrayView[CodigoLote].fecPosturafin);
                    let fpf2 = new Date(element.fecPosturafin);
                    if(fpf2 > fpf1){
                        arrayView[CodigoLote].fecPosturafin = element.fecPosturafin;
                    }
                }
            }
        }
        
        let array = [];
    
        for (var i in arrayView) {
            if(arrayView.hasOwnProperty(i)){
                array.push(arrayView[i])
            }
        }

        for (let l = 0; l < array.length; l++) {
            const c = array[l];
            await db.query("INSERT INTO cargas_resumen (idCargas, CodigoLote, Lote, Semana, TipoA, TipoB, TipoB1, TipoC, Total, HC, Fecha_Postura_Inicio, Fecha_Postura_Fin, DiasAlm,Fecha_Carga) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [idCargo, c.NombreLote, c.Lote, c.Semana, c.TipoA, c.TipoB, c.TipoB1, c.TipoC, c.Total, c.HC , c.fecPostura, c.fecPosturafin, c.DiasAlm, Cargo.fecCarga])
        }
        let json = {
            success : true,
            message: 'Se registró correctamente'
        }
        return json;
    },
    deleteCargoById: async function(id){
       let rows=await db.query("select idNacimiento,Cliente,RUC from nacimiento where idCarga in(?)",[id]);
       
       if(rows){
         if(rows.length==0){
          await db.query("delete from cargas where idCargas=?",[id]);
          await db.query("delete from cargas_det where idCargas=?",[id]);
          await db.query("delete from cargas_resumen where idCargas=?",[id]);
          return {
              state:true,
              message:'La carga se ha eliminado correctamente!'
          };
         }
         return  {
            state:false,
            message:`No es posible eliminar la carga porque está asociado a un nacimiento.
                    <ul>
                    <li>ID: ${rows[0].idNacimiento}</li>
                    <li>Cliente: ${rows[0].Cliente}</li>
                    <li>RUC: ${rows[0].RUC}</li>
                    </ul>`
           };
       }
       return {state:false,message:"Ocurrió un error inesperado!"};
       
        //return db.query("DELETE FROM cargas WHERE idCargas=? ",[id],callback);
    },
    selectMaxId:function(callback) {
        return db.query("SELECT MAX(CodCarga) as maxId FROM cargas", callback);  
    },
    selectLotexidcargas:function (idLote,idCargas,callback){
        return db.query("SELECT * FROM cargas_det  WHERE Lote = ? and idCargasDet = ?", [idLote],[idCargas],callback);
    },
    selectResumenById: async function (idCargas){
        return await db.query(`SELECT * FROM cargas_resumen cr 
        INNER JOIN lotes lo ON lo.idLote = cr.Lote 
        WHERE idCargas = ?
        ORDER BY CodigoLote`, [idCargas]);
    } ,
    UpdateCargo: async function(Cargo){
        await db.query("UPDATE cargas set Cliente = ?, RUC = ?, Cliente2 = ?, RUC2 = ?, Fecha_Carga = ?,Fecha_Transferencia = ?, Fecha_Nacimiento = ?,Pedido_Hembras = ?, Pedido_Machos = ?, Total = ? WHERE idCargas = ?",
        [Cargo.cliente, Cargo.RUC, Cargo.cliente2, Cargo.RUC2, Cargo.fecCarga, Cargo.fecTransfer, Cargo.fecNac, Cargo.pedHembras, Cargo.pedMachos, Cargo.total, Cargo.idCargo]);
        await db.query("DELETE FROM cargas_det WHERE idCargas = ?", [Cargo.idCargo]);
        await db.query("DELETE FROM cargas_resumen  WHERE idCargas = ?", [Cargo.idCargo]);
        let arrayView = [];
        for (let i = 0; i < Cargo.detalle.length; i++) {
            const element = Cargo.detalle[i];
            arrayView[element.CodigoLote] = {
                Lote : element.Lote,
                NombreLote : element.NombreLote,
                CodigoLote : element.CodigoLote,
                TipoA : 0,
                TipoB : 0,
                TipoB1 : 0,
                TipoC : 0,
                Total : 0,
                DiasAlm: element.DiasAlm,
                HC : element.Mermas,
                Semana : element.Edad
            }
            if(typeof element.numIncubadora == "undefined"){
                element.numIncubadora = element.Num_incubadora
                element.tipoHI = element.Tipo_HI
                element.fecPostura = element.Fecha_Postura_Inicio
                element.fecPosturafin = element.Fecha_Postura_Fin
                element.numBandeja = element.Bandeja
                element.unidades = element.Unidades
                element.cantidad = element.Cantidad
                element.fecHoraPrecal = element.FechaHora_Precalentamiento
            }
            await db.query("INSERT INTO cargas_det (CodigoLote,Num_incubadora,Coche,Lote, Tipo_HI,Fecha_Postura_Inicio, Fecha_Postura_Fin,Bandeja,Unidades,Cantidad,FechaHora_Precalentamiento,Semana,Merma_HC,idCargas,DiasAlm) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [element.CodigoLote,element.numIncubadora,element.Coche,element.Lote,element.tipoHI,element.fecPostura,element.fecPosturafin,element.numBandeja,element.unidades,element.cantidad,element.fecHoraPrecal,element.Edad,element.Mermas,Cargo.idCargo,element.DiasAlm]);
        }

        for (let j = 0; j < Cargo.detalle.length; j++) {
            const element = Cargo.detalle[j];
            let CodigoLote = element.CodigoLote;
            if(typeof arrayView[CodigoLote] != "undefined"){
                if(element.tipoHI == "A"){
                    arrayView[CodigoLote].TipoA = arrayView[CodigoLote].TipoA + element.cantidad
                }else if(element.tipoHI == "B"){
                    arrayView[CodigoLote].TipoB = arrayView[CodigoLote].TipoB + element.cantidad
                }else if(element.tipoHI == "B1"){
                    arrayView[CodigoLote].TipoB1 = arrayView[CodigoLote].TipoB1 + element.cantidad
                }else if(element.tipoHI == "C"){
                    arrayView[CodigoLote].TipoC = arrayView[CodigoLote].TipoC + element.cantidad
                }

                arrayView[CodigoLote].Total = arrayView[CodigoLote].Total + element.cantidad

                arrayView[CodigoLote].HC = element.Mermas

                arrayView[CodigoLote].Semana = element.Edad;

                arrayView[CodigoLote].DiasAlm = element.DiasAlm;
                
                if(typeof arrayView[CodigoLote].fecPostura == "undefined"){
                    arrayView[CodigoLote].fecPostura = element.fecPostura;
                }else{
                    let fpi1 = new Date(arrayView[CodigoLote].fecPostura);
                    let fpi2 = new Date(element.fecPostura);
                    if(fpi2 < fpi1){
                        arrayView[CodigoLote].fecPostura = element.fecPostura;
                    }
                }

                if(typeof arrayView[CodigoLote].fecPosturafin == "undefined"){
                    arrayView[CodigoLote].fecPosturafin = element.fecPosturafin;
                }else{
                    let fpf1 = new Date(arrayView[CodigoLote].fecPosturafin);
                    let fpf2 = new Date(element.fecPosturafin);
                    if(fpf2 > fpf1){
                        arrayView[CodigoLote].fecPosturafin = element.fecPosturafin;
                    }
                }
            }
        }
        
        let array = [];
    
        for (var i in arrayView) {
            if(arrayView.hasOwnProperty(i)){
                array.push(arrayView[i])
            }
        }

        for (let l = 0; l < array.length; l++) {
            const c = array[l];
            await db.query("INSERT INTO cargas_resumen (idCargas, CodigoLote, Lote, Semana, TipoA, TipoB, TipoB1, TipoC, Total, HC, Fecha_Postura_Inicio, Fecha_Postura_Fin, DiasAlm,Fecha_Carga) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [Cargo.idCargo, c.CodigoLote, c.Lote, c.Semana, c.TipoA, c.TipoB, c.TipoB1, c.TipoC, c.Total, c.HC , c.fecPostura, c.fecPosturafin, c.DiasAlm , Cargo.fecCarga])
        }
        let json = {
            success : true,
            message: 'Se registró correctamente'
         }
        return json;
    },
    UpdateEstado: async function(param,id) {
        if(param == 0){
            return await db.query("UPDATE cargas SET Estado = '0' WHERE idCargas = ?",[id]);
        }else if(param == 2) {
            let rows = await db.query("SELECT idNacimiento FROM nacimiento WHERE idCarga = ?",[id]);
            let idNacimiento = rows[0].idNacimiento;
            await db.query("DELETE FROM nacimiento WHERE idNacimiento = ?",[idNacimiento])
            await db.query("DELETE FROM nacimiento_det WHERE idNacimiento = ?",[idNacimiento])
            let rows2 = await db.query(`SELECT idNacimientoReporte FROM nacimiento_reporte WHERE idNacimiento = ${idNacimiento}`)
            let idNacimientoReporte = await rows2[0].idNacimientoReporte;
            await db.query(`DELETE FROM nacimiento_reporte WHERE idNacimientoReporte = ${idNacimientoReporte}`)
            await db.query(`DELETE FROM nacimiento_reporte_det WHERE idNacimientoReporte = ${idNacimientoReporte}`)
            return await db.query("UPDATE cargas SET Estado = '1' WHERE idCargas = ?",[id]);            
        }else{
            return await db.query("UPDATE cargas SET Estado = '1' WHERE idCargas = ?",[id]);
        }
    },
    getLotesCompararProd: async function() {
        let rows = await db.query(`Select l.*, gal.Galpon, lin.Linea, gra.Granja 
        from lotes l 
        LEFT JOIN galpones gal ON gal.idGalpon = l.idGalpon 
        LEFT JOIN lineas lin ON lin.idLinea = l.idLinea 
        LEFT JOIN granjas gra ON gra.idGranja = l.idGranja 
        WHERE idLevante != 0 and l.idProduccion != 0 and l.Sexo = 'H'
        ORDER BY l.CorrelativoLote DESC`);
        let rows2 = await db.query(`SELECT *
        FROM lotes
        WHERE lote_str = 'HIILM' or lote_str = 'HIILH'`)
        for (let i = 0; i < rows2.length; i++) {
            const e = rows2[i];
            rows.push(e);
        }
        
        for (let i = 0; i < rows.length; i++) {
            const element = rows[i];
            element.Style = {
                'opacity' : '0.65'
            }
        }
        return rows;
    },
    UpdatePedidos: async function(){
        let rows = await db.query("SELECT idCargas, Pedido_Hembras,Pedido_machos FROM cargas");
        for (let i = 0; i < rows.length; i++) {
            let j = rows[i];
            let rows3 = await db.query(`SELECT Pedido_Hembras,Pedido_Machos FROM nacimiento`);
            for (let h = 0; h < rows3.length; h++) {
                const e = rows3[h];
                let Hembras = e.Pedido_Hembras
                let Machos = e.Pedido_Machos
                if(Hembras == '0' && Machos == '0'){
                    await db.query(`UPDATE nacimiento SET Pedido_Hembras = '${j.Pedido_Hembras}',
                    Pedido_Machos = '${j.Pedido_machos}' WHERE idCarga = '${j.idCargas}'`);
                } 
            }
        }
        return {
            success: true,
            message: "Pedidos de Hembra y Macho Actualizados en Nacimientos correctamente"
        };
        
    }
}
module.exports=Cargos;

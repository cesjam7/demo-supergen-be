var db=require('../dbconnection');

const cierreProd = require('./cierreProd');

var ProduccionAlimento = {

    getAllmortalidad:function(callback){
        return db.query("Select * from mortalidad_prod",callback);
    },
    getAlimentoById:function(id, callback){
        return db.query("select * from mortalidad_prod where idAlimentoDet=?",[id],callback);
    },
    getCantidadDatosPorEdad:function(id, Edad, callback){
        return db.query("SELECT count(*) as CanTotal, Edad FROM alimento_prod_json WHERE idProduccion=? AND Edad=?",[id, Edad],callback)
    },
    getTipoAlimentoComboProduccion:function(callback){
        return db.query("Select * from tipo_alimento WHERE Tipo = 'P' OR Tipo = 'A'",callback);
    },
    getTipoAlimentoById:function(id, callback){
        return db.query("Select * from tipo_alimento where idAlimento=?",[id],callback);
    },
    getSumaTotalAlimentos:function(id, Edad, callback){
        return db.query("SELECT SUM(CantAlimento) as SumaCantAlimentos FROM alimento_prod_det where idProduccion = ? and Edad = ?",[id, Edad],callback);
    },
    getAlimentoByIdProduccion:function(id, callback){
        return db.query("select *, (select lo.nombreAlimento from tipo_alimento lo where lo.idAlimento = l.idAlimento) as nombreAlimento, (SELECT SUM(ldet.CantAlimento) FROM alimento_prod_det ldet where ldet.idProduccion = l.idProduccion and ldet.Edad = l.Edad and ldet.idAlimento = l.idAlimento)as SumaCantAlimentos from alimento_prod_json l where idProduccion=? order by Edad ASC",[id],callback);
    },
    getAlimentoUltimoDia:function(id, callback){
        return db.query("select * from alimento_prod_json WHERE idProduccion = ? ORDER BY Edad DESC LIMIT 0, 1",[id],callback);
    },
    getAlimentoDia:function(idProduccion, Edad, idAlimento, callback){
        return db.query("select * from alimento_prod_json WHERE idProduccion = ? AND Edad = ? AND idAlimento =?",[idProduccion, Edad, idAlimento],callback);
    },
    getAlimentoProduccion:async function(id){
        return await db.query(`Select * 
        FROM produccion l 
        INNER JOIN lotes lo ON lo.idProduccion = l.idProduccion 
        INNER JOIN lineas li ON li.idLinea = lo.idLinea 
        WHERE l.idProduccion = ? 
        ORDER BY li.CodLinea DESC`,
        [id]);
    },
    getProduccionesLevante:async function(id){
        return await db.query(`SELECT * 
        FROM produccion l 
        INNER JOIN lotes lo ON lo.idProduccion = l.idProduccion 
        INNER JOIN lineas li ON li.idLinea = lo.idLinea 
        WHERE l.idProduccion = ? ORDER BY li.CodLinea DESC`,
        [id]);
    },
    getAlimentoProducciones:function(callback){
        return db.query("Select * from produccion ORDER BY idProduccion DESC",callback);
    },
    getEdadMaximo:function(callback){
        return db.query("SELECT m.Edad FROM mortalidad_prod m " +
                        "INNER JOIN lineas l ON l.idLinea = m.idLinea " +
                        "WHERE l.Estado = 1 " +
                        "ORDER BY m.edad DESC " +
                        "LIMIT 0, 1",callback);
    },
    getEdadEspecifica:function(id, callback){
        return db.query("SELECT m.Fecha, m.EdadTexto, m.NoAves, m.PorcAlimento, m.NoEliminados, m.PorcEliminados, l.idLinea FROM mortalidad_prod m " +
                        "INNER JOIN lineas l ON l.idLinea = m.idLinea AND l.Estado = 1 " +
                        "WHERE m.Edad = ? " +
                        "ORDER BY m.idLinea ASC",[id],callback);
    },
    getDiaInicio:function(callback){
        return db.query("SELECT m.Fecha FROM mortalidad_prod m " +
                        "INNER JOIN lineas l ON l.idLinea = m.idLinea " +
                        "WHERE l.Estado = 1 " +
                        "ORDER BY m.Fecha ASC " +
                        "LIMIT 0, 1",callback);
    },
    addAlimento:function(Alimento, callback){
        console.log("inside service");
        console.log(Alimento.Id);
        return db.query("INSERT INTO mortalidad_prod (idAlimento, idLote, idLinea, Fecha, Edad, EdadTexto, NoAves, PorcAlimento, NoEliminados, PorcEliminados) values(?,?,?,?,?,?,?,?,?,?)",[Alimento.idAlimento, Alimento.idLote, Alimento.idLinea, Alimento.Fecha, Alimento.Edad, Alimento.EdadTexto, Alimento.NoAves, Alimento.PorcAlimento, Alimento.NoEliminados, Alimento.PorcEliminados],callback);
    },

    addProduccionAlimentoModal:async function(Alimento){
        await db.query("INSERT INTO alimento_prod_json (idProduccion, idAlimento, Edad, data) values(?,?,?,?)",[Alimento.idProduccion, Alimento.idAlimento, Alimento.Edad, Alimento.data ]);
        var data = JSON.parse(Alimento.data);

        for(var idLote in data) {
            let Semana = Alimento.Semana + 24;
            await db.query("INSERT INTO alimento_prod_det (idProduccion, idAlimento, idLote, Edad, Fecha, semana_prod, Semana, CantAlimento) values(?,?,?,?,?,?,?,?)",[Alimento.idProduccion, Alimento.idAlimento, idLote, Alimento.Edad, Alimento.Fecha, Alimento.Semana, Semana, data[idLote].Cantidad]);
        }
        return;
    },

    addProduccionProcedureModal:async function(Alimento){
        var data = JSON.parse(Alimento.data);
        for(var idLote in data) {
            let count = await db.query('SELECT CONCAT(sexo,"_",SUBSTRING(lote,LOCATE("-",lote) + 1)) as name, idLote, TipoGenero FROM lotes WHERE idProduccion = ? and idLote = ?',[Alimento.idProduccion, idLote]);
            let name = "GramoAveDia_"+count[0].name
            let id = count[0].idLote
            let TipoGenero = count[0].TipoGenero
            let tabla;
            if(TipoGenero == "LM"){
                tabla = "standard_prod_macho"
            }else{
                tabla = "standard_prod_hembra"
            }
            let count2 = await db.query('SELECT '+ name +' as nombre FROM '+ tabla + ' WHERE idProd = ?',[Alimento.Semana]);
            if(typeof count2[0] != "undefined"){
                console.log("el resultado count", count2[0]);
                let dato = count2[0].nombre;
                await db.query("CALL getSemanalAlimentoProduccion(?, ?, ?, ?, ?)",
                    [Alimento.idProduccion, Alimento.Semana, id, data[id].Cantidad,dato]);
            }else{
                await db.query("CALL getSemanalAlimentoProduccion(?, ?, ?, ?, ?)",
                    [Alimento.idProduccion, Alimento.Semana, id, data[id].Cantidad,0]);
            }
        }

        return;
    },

    addProduccionProcedure2Modal:async function(Alimento){
        var data = JSON.parse(Alimento.data);
        for(var idLote in data) {
            await db.query("CALL getActualizarAlimentoProduccion(?, ?)",[Alimento.idProduccion, idLote]);
        }
        return;
    },

    deleteAlimento:function(id,callback){
        return db.query("delete from mortalidad_prod where idAlimento=?",[id],callback);
    },

    updateProduccionAlimento: async function(id,Alimento){
        await db.query("UPDATE alimento_prod_json set data = ? WHERE idAlimentoProdJson=?",[Alimento.data, id]);
        var data = JSON.parse(Alimento.data);

        for(var idLote in data) {
           await db.query("UPDATE alimento_prod_det SET CantAlimento = ? WHERE idProduccion = ? AND Edad = ? AND idLote = ? AND idAlimento = ?",
                            [data[idLote].Cantidad, Alimento.idProduccion, Alimento.Edad, idLote ,Alimento.idAlimento]);
        }

        return;
    },
    updateProduccionAlimento2:async function(id,Alimento){
        var data3 = JSON.parse(Alimento.data);

        for(var idLote3 in data3) {
           await db.query("CALL getActualizarAlimentoProduccion(?, ?)",[Alimento.idProduccion, idLote3]);
        }

        return;
    },
    deleteAll:function(item,callback){

        var delarr=[];
        for(i=0;i<item.length;i++){

            delarr[i]=item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)",[delarr],callback);
    },
    getUnidades:function(callback){

        return db.query("Select * from geunidad",callback);

    },
    postAlimentoSemana:async function(lotes){
        let array = [];
        for (let i = 0; i < lotes.lotes.length; i++) {
            const e = lotes.lotes[i];
            let rows = await db.query(`SELECT idLote, Semana, Ave_Dia_Gr,Ave_Dia_Gr_Grafico 
            FROM alimento_prod_sem
            WHERE idLote = ?
            ORDER BY idLote, Semana`,[e]);
            let ultimo = rows[rows.length-1];
            let cantidad_days = await db.query(`SELECT COUNT(DISTINCT(Edad)) as cant_days
            FROM alimento_prod_det apd
            WHERE apd.idLote = ? and semana_prod = ?
            GROUP BY semana_prod`,[e, ultimo.Semana]);
            if(cantidad_days[0].cant_days < 7){
                rows.pop();
            }
            for (let j = 0; j < rows.length; j++) {
                const e = rows[j];
                array.push(e);
            }
        }
        return array;
    },
    getAlimentoSemana:async function(id){
        let rows = await db.query(`SELECT aps.Ave_Dia_Gr, aps.STD, aps.idLote, aps.Semana, li.CodLinea
        FROM alimento_prod_sem aps
        INNER JOIN lotes lo ON lo.idLote = aps.idLote
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE aps.idLote = ? 
        GROUP BY aps.Semana, aps.idLote, li.CodLinea, aps.Ave_Dia_Gr, aps.STD
        ORDER BY aps.Semana ASC`,[id]);
        let ultimo = rows[rows.length-1];
        let cantidad_days = await db.query(`SELECT COUNT(DISTINCT(Edad)) as cant_days
        FROM alimento_prod_det apd
        WHERE apd.idLote = ? and semana_prod = ?
        GROUP BY semana_prod`,[id, ultimo.Semana]);
        console.log('cantidad_days[0].cant_days :>> ', cantidad_days[0].cant_days);
        if(cantidad_days[0].cant_days < 7){
            rows.pop();
        }
        return rows;
    },
    graficoAlimento : async function(id){
        let rows = await db.query(`SELECT pspd.*,li.* 
        FROM alimento_prod_sem pspd 
        INNER JOIN lotes lo on pspd.idLote = lo.idLote 
        INNER JOIN lineas li on lo.idLinea = li.idLinea 
        where pspd.idProduccion = ? ORDER BY Semana`,[id]);
        let ultimo = rows[rows.length-1];
        let cantidad_days = await db.query(`SELECT COUNT(DISTINCT(Edad)) as cant_days
        FROM alimento_prod_det apd
        WHERE idProduccion = ? and semana_prod = ?
        GROUP BY semana_prod`,[id, ultimo.Semana]);
        if(cantidad_days[0].cant_days < 7){
            rows.pop();
            rows.pop();
            rows.pop();
            rows.pop();

        }
        return rows;
    },
    AveDiaGr : async function(id){
        try {
            let cons_adg = await db.query(`SELECT aps.Semana, aps.Ave_Dia_Gr_Grafico, aps.idLote, li.CodLinea
            FROM alimento_prod_sem aps
            INNER JOIN lotes lo ON lo.idLote = aps.idLote
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE aps.idProduccion = ?
            ORDER BY Semana, CodLinea DESC`,[id])
            let cons_semana = await db.query(`SELECT MAX(Semana) as Semana FROM alimento_prod_sem WHERE idProduccion = ?`,[id])
            if(cons_semana.length != 0 && cons_adg.length != 0){
                let array = [];
                let maxsemana = cons_semana[0].Semana;
                for (let i = 1; i <= maxsemana; i++) {
                    let json = {
                        Semana : i,
                        numeros : []
                    }
                    for (let j = 0; j < cons_adg.length; j++) {
                        const e = cons_adg[j];
                        if(e.Semana == i){
                            json.numeros.push({
                                valor : e.Ave_Dia_Gr_Grafico,
                                idLote : e.idLote
                            })
                        }
                    }
                    json.cerrado = await cierreProd.VerifyUpdatesProd({ idProduccion: id, semana: i })
                    array.push(json);
                }
                return {
                    success : true,
                    data : array,
                    message : "Extracción de datos correcta."
                }
            }
        } catch (error) {
            console.log('error :>> ', error);
            return {
                success : false,
                message : "Error del servidor tc."
            }
        }
    },
    updateAveDiaGr : async function(data){
        try {
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                for (let j = 0; j < d.numeros.length; j++) {
                    const n = d.numeros[j];
                    await db.query(`UPDATE alimento_prod_sem set Ave_Dia_Gr_Grafico = ? 
                    WHERE idLote = ? and Semana = ?`,[n.valor, n.idLote, d.Semana])
                }
            }
            return {
                success : true,
                message : 'La actualización se realizó correctamente.'
            }
        } catch (error) {
            console.log('error :>> ', error);
            return {
                success : false,
                message : 'Sucedió un error, inténtalo nuevamente.'
            }
        }
    }
};
module.exports=ProduccionAlimento;

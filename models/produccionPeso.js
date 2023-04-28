var db=require('../dbconnection');

var produccionPeso = {

    getAllproduccionPeso:function(callback){
        return db.query("SELECT * FROM  peso_semana_prod_json",callback);

    },
    getproduccionPesoById:function(id, callback){
        return db.query("select * from peso_semana_prod_json where idProduccion = ?",[id],callback);
    },
    getPesoJsonByIdProduccion:function(id, callback){
        return db.query("select * from peso_semana_prod_json where idProduccion = ? order by Semana ASC",[id],callback);
    },    
    getMortalidadProduccion: async function(id){
        return await db.query(`select * from produccion l
        INNER JOIN lotes lo ON lo.idLevante = l.idLevante
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        WHERE l.idProduccion = ? ORDER BY li.CodLinea DESC`,
        [id]);
    },
    getmortalidadDia:function(idProduccion, Edad, callback){
        return db.query("select * from peso_semana_prod_json where idProduccion= ? AND Semana= ?",[idProduccion, Edad],callback);
    },
    getPesoUltimoDia:function(id, callback){
        return db.query("select * from peso_semana_prod_json WHERE idProduccion = ? ORDER BY Semana DESC LIMIT 0, 1",[id],callback);
    },
    getPesoSTD:function(idProduccion, idlote, semana, callback){
        db.query("SELECT " +
        "CASE idLinea  " +
        "WHEN 19 THEN  " +
        "(SELECT PesoH_L9 FROM standard_prod_hembra WHERE idProd = ?) "  +
        "WHEN 17 THEN " + 
        "(SELECT PesoH_L4 AS StdData FROM standard_prod_macho WHERE idProd = ?) " +
        "WHEN 18 THEN " +
        "(SELECT PesoM_L7 AS StdData FROM standard_prod_hembra WHERE idProd = ?) " +
        "WHEN 1 THEN " +
        "(SELECT PesoM_L1 AS StdData FROM standard_prod_macho WHERE idProd = ?) " +
        "ELSE " +
        "(SELECT 4 AS StdData) " +
        "END as nombre " +
        "FROM lotes WHERE idProduccion = ? and idLote = ?",[semana, semana, semana, semana, idProduccion, idlote],callback);
    },
    updatePeso:function(id,Peso,callback){
        db.query("UPDATE peso_semana_prod_json set data = ? WHERE idPesoSemanaJson=?",[Peso.data, id], callback);
        var data = JSON.parse(Peso.data);
        for(var idLote in data) {
           db.query("UPDATE peso_semana_prod_det SET peso_actual_ave = ?, peso_standard_ave = ?, peso_dif_ave = ?,peso_actual_huevo = ? , peso_standard_huevo = ?,peso_dif_huevo = ?,masa_huevo = ?, masa_standard_huevo = ? WHERE idProduccion = ? AND Semana = ? AND idLote = ?",[data[idLote].peso_actual, data[idLote].peso_standard, data[idLote].peso_dif,data[idLote].peso_actual_huevo,data[idLote].peso_standard_huevo,data[idLote].peso_dif_huevo,data[idLote].masa_huevo, data[idLote].masa_standard_huevo, Peso.idProduccion, Peso.semana, idLote ],callback);
        }
        return;
    },
    updatePeso2:function(id,Peso,callback){
        var data2 = JSON.parse(Peso.data);
        for(var idLote2 in data2) {
            db.query("CALL getActualizarPesoLevante(?, ?);",[Peso.idProduccion, idLote2],callback);
         }
        return;
    },
    addPesoModal:async function(Peso){
        console.log("Peso:",Peso);
        await db.query("INSERT INTO peso_semana_prod_json (idProduccion, semana, data) values(?,?,?)",[Peso.idProduccion,Peso.semana,Peso.data]);
        var data = JSON.parse(Peso.data);
        for(var idLote in data) {
            // console.log([Peso.idProduccion, idLote, Peso.semana, data[idLote].peso_actual, data[idLote].peso_standard, data[idLote].peso_dif ]);
            await db.query("INSERT INTO peso_semana_prod_det (IdProduccion, IdLote, Semana, peso_actual_ave, peso_standard_ave, peso_dif_ave,peso_actual_huevo,peso_standard_huevo,peso_dif_huevo,masa_huevo,masa_standard_huevo) values(?,?,?,?,?,?,?,?,?,?,?)",
            [Peso.idProduccion, idLote, Peso.semana, data[idLote].peso_actual, data[idLote].peso_standard, data[idLote].peso_dif,data[idLote].peso_actual_huevo,data[idLote].peso_standard_huevo,data[idLote].peso_dif_huevo,data[idLote].masa_huevo, data[idLote].masa_standard_huevo ]);
        }
        return;
    },
    getStandardSemana:function( callback){
        return db.query("select * from peso_semana_prod_det  order by Semana ASC",callback);
    },
    getAllStandardlotes:function(id,callback){
        return db.query("SELECT pspd.*,li.* FROM peso_semana_prod_det pspd INNER JOIN  lotes lo on pspd.IdLote = lo.idLote INNER JOIN lineas li on lo.idLinea = li.idLinea where pspd.IdProduccion = ? ORDER BY Semana",
        [id],callback);
    },
    getStandardHembra:function( callback){
        return db.query("select * from standard_prod_hembra  order by idProd ASC",callback);
    },
    getStdHembra:function( params, callback){
        if(params.tipoGenero == 'LM'){
            return db.query("select * from standard_prod_macho WHERE idProd = ? ORDER BY idProd ASC",[params.semana],callback);
        }else{
            return db.query("select * from standard_prod_hembra WHERE idProd = ? ORDER BY idProd ASC",[params.semana],callback);
        }
    },
    getStandardMacho:function( callback){
        return db.query("select * from standard_prod_macho order by idProd ASC",callback);
    },
    getPesoSemana:async function(id) {
        return await db.query("select peso_actual_ave , Semana,idLote, idProduccion from peso_semana_prod_det WHERE idLote = ? ORDER BY Semana ASC",[id]);
    },
    postPesoSemana: async function(lotes) {
        return await db.query("SELECT idLote, Semana, peso_actual_ave, peso_actual_huevo FROM peso_semana_prod_det " +
        "WHERE idLote IN ("+lotes.lotes.join()+") "+
        "ORDER BY idLote, Semana")
    }
   

}

module.exports=produccionPeso;
var db=require('../dbconnection');

var Mortalidad = {

    getAllmortalidad:function(callback){

        return db.query("Select * from mortalidad",callback);

    },
    getMortalidadById:function(id, callback){
        return db.query("select * from mortalidad where idMortalidadDet=?",[id],callback);
    },
    //Cambio---------------------------------------------------------------------------------
    getMortalidadByIdLevante:function(id, callback){
        return db.query("select * from mortalidadsem where idLevante=? order by Semana ASC",[id],callback);
    },
    //Cambio---------------------------------------------------------------------------------
    //Nuevo----------------------------------------------------------------------------------
    getPesoJsonByIdLevante:function(id, callback){
        return db.query("select * from peso_semanajson where idLevante=? order by Semana ASC",[id],callback);
    },
    //Nuevo----------------------------------------------------------------------------------
    //Cambio---------------------------------------------------------------------------------
    getPesoUltimoDia:function(id, callback){
        return db.query("select * from peso_semanajson WHERE idLevante = ? ORDER BY Semana DESC LIMIT 0, 1",[id],callback);
    },
    //Cambio---------------------------------------------------------------------------------
    getmortalidadDia:function(idLevante, Edad, callback){
        return db.query("select * from peso_semanajson WHERE idLevante = ? AND Semana = ?",[idLevante, Edad],callback);
    },

    //Nuevo------
        getPesoSTD:function(idLevante, idlote, semana, callback){
            db.query("SELECT " +
            "CASE idLinea  " +
            "WHEN 19 THEN  " +
            "(SELECT PesoH_L9 FROM standard_levante WHERE Semana = ?) " +
            "WHEN 17 THEN " + 
            "(SELECT PesoH_L4 AS StdData FROM standard_levante WHERE Semana = ?) " +
            "WHEN 18 THEN " +
            "(SELECT PesoM_L7 AS StdData FROM standard_levante WHERE Semana = ?) " +
            "WHEN 1 THEN " +
            "(SELECT PesoM_L1 AS StdData FROM standard_levante WHERE Semana = ?) " +
            "ELSE " +
            "(SELECT 4 AS StdData) " +
            "END as nombre " +
            "FROM lotes WHERE idLevante = ? and idLote = ?",[semana, semana, semana, semana, idLevante, idlote],callback);
        },
    //NUEVO------

    getMortalidadLevante:async function(id){
        return await db.query(`SELECT * 
        FROM levantes l 
        INNER JOIN lotes lo ON lo.idLevante = l.idLevante 
        INNER JOIN lineas li ON li.idLinea = lo.idLinea 
        WHERE l.idLevante = ? ORDER BY li.CodLinea DESC`,
        [id]);
    },
    getPesosUniformidad:async function(id){
        return await db.query("select * from peso_semana_det WHERE idLote = ? ORDER BY Semana ASC",[id]);
    },
    getPesosUniformidadLineas:function(idLinea, callback){
        try {
            console.log('IDLINEA: ', idLinea);
            return db.query("SELECT le.idLevante, li.idLinea, li.Linea, lo.idLote, lo.Lote, pmd.Semana FROM peso_semana_det pmd " +
            "INNER JOIN lotes lo ON lo.idLote = pmd.idLote " +
            "INNER JOIN levantes le ON le.idLevante = pmd.IdLevante " +
            "INNER JOIN lineas li ON li.idLinea = lo.idLinea " +
            "WHERE li.idLinea = ? " +
            "GROUP BY li.idLinea, pmd.Semana ",[idLinea], callback);            
        } catch (error) {
            console.log('ERROR', error);
        }
    },
    //Cambios-----------------------------------------------------------------------------------
    getPesoLevantes:function(callback){
        return db.query("select * from levantes ORDER BY idLevante DESC",callback);
    },
    getPesoLevantes2:function(id, callback){
        return db.query("SELECT li.idLinea, li.Linea, le.idLevante, lo.idLote, li.CodLinea, " +
        "pmd.Semana, pmd.peso_actual, pmd.peso_standard, pmd.peso_dif " +
        "FROM peso_semana_det pmd " +
        "INNER JOIN lotes lo ON lo.idLote = pmd.idLote " +
        "INNER JOIN levantes le ON le.idLevante = pmd.IdLevante " +
        "INNER JOIN lineas li ON li.idLinea = lo.idLinea " +
        "WHERE pmd.IdLevante = ? " +
        "GROUP BY lo.idLote, pmd.Semana " +
        "ORDER BY lo.idLote, pmd.Semana ",[id],callback);
    },
    getPesoLineas:function(id, callback){
        return db.query("SELECT 	li.idLinea, li.Linea, lo.idLote, lo.lote " +
        "FROM peso_semana_det pmd  " +
        "INNER JOIN lotes lo ON lo.idLote = pmd.idLote " +
        "INNER JOIN lineas li ON li.idLinea = lo.idLinea " +
        "WHERE pmd.IdLevante = ? " +
        "GROUP BY li.idLinea " +
        "ORDER BY li.idLinea ",[id],callback);
    },
    getPesoSemana:async function(lotes){
        return await db.query("SELECT idLote, Semana, uniformidad FROM peso_semana_det " +
        "WHERE idLote IN ("+lotes.lotes.join()+") "+
        "ORDER BY idLote, Semana");
    },
    getNroSemana_xLevante:async function(lotes){
        return await db.query("SELECT idLote, Semana, peso_actual, peso_dif FROM peso_semana_det " +
        "WHERE idLote IN ("+lotes.lotes.join()+") "+
        "ORDER BY idLote, Semana");
    },
    //Cambios-----------------------------------------------------------------------------------
    getEdadMaximo:function(callback){
        return db.query("SELECT m.Edad FROM mortalidad m " +
                        "INNER JOIN lineas l ON l.idLinea = m.idLinea " +
                        "WHERE l.Estado = 1 " +
                        "ORDER BY m.edad DESC " +
                        "LIMIT 0, 1",callback);
    },
    getEdadEspecifica:function(id, callback){
        return db.query("SELECT m.Fecha, m.EdadTexto, m.NoAves, m.PorcMortalidad, m.NoEliminados, m.PorcEliminados, l.idLinea FROM mortalidad m " +
                        "INNER JOIN lineas l ON l.idLinea = m.idLinea AND l.Estado = 1 " +
                        "WHERE m.Edad = ? " +
                        "ORDER BY m.idLinea ASC",[id],callback);
    },
    getDiaInicio:function(callback){
        return db.query("SELECT m.Fecha FROM mortalidad m " +
                        "INNER JOIN lineas l ON l.idLinea = m.idLinea " +
                        "WHERE l.Estado = 1 " +
                        "ORDER BY m.Fecha ASC " +
                        "LIMIT 0, 1",callback);
    },
    addMortalidad:function(Mortalidad, callback){
        console.log("inside service");
        console.log(Mortalidad.Id);
        return db.query("INSERT INTO mortalidad (idMortalidad, idLote, idLinea, Fecha, Edad, EdadTexto, NoAves, PorcMortalidad, NoEliminados, PorcEliminados) values(?,?,?,?,?,?,?,?,?,?)",[Mortalidad.idMortalidad, Mortalidad.idLote, Mortalidad.idLinea, Mortalidad.Fecha, Mortalidad.Edad, Mortalidad.EdadTexto, Mortalidad.NoAves, Mortalidad.PorcMortalidad, Mortalidad.NoEliminados, Mortalidad.PorcEliminados],callback);
    },
    addPesoModal:function(Mortalidad,callback){
        db.query("INSERT INTO peso_semanajson (idLevante, Semana, data) values(?,?,?)",[Mortalidad.idLevante,Mortalidad.semana,Mortalidad.data],callback);
        var data = JSON.parse(Mortalidad.data);
        for(var idLote in data) {
           db.query("INSERT INTO peso_semana_det (idLevante, idLote, Semana, peso_actual, peso_standard, peso_dif, uniformidad, Coef_V) values(?,?,?,?,?,?,?,?)",[Mortalidad.idLevante, idLote, Mortalidad.semana, data[idLote].peso_actual, data[idLote].peso_standard, data[idLote].peso_dif, data[idLote].uniformidad, data[idLote].Coef_V],callback);
        }
        return;
    },
    addPesoModal2: function(Mortalidad,callback) {  
        var data2 = JSON.parse(Mortalidad.data);   
        for(var idLote2 in data2) {
            db.query("CALL getActualizarPesoLevante(?, ?);",[Mortalidad.idLevante, idLote2],callback);            
        }
    },
    addPesoModal3: function(Mortalidad,callback) {        
        db.query("SELECT * FROM peso_semana_det WHERE idLevante = ? and Semana = ?", [Mortalidad.idLevante, Mortalidad.semana], (err,count) => {
            let data = {};
            for (let i = 0; i < count.length; i++) {
                const element = count[i];
                let json = {
                    peso_actual : element.peso_actual,
                    peso_standard : element.peso_standard,
                    peso_dif : element.peso_dif,
                    uniformidad : element.uniformidad,
                    ganancia_real : element.ganancia_real,
                    ganancia_std : element.ganancia_std,
                    Coef_V : element.Coef_V,
                }
                data[element.idLote] = json;                 
            }
            console.log(data);
            db.query("UPDATE peso_semanajson set data = ? WHERE idLevante = ? and Semana = ?",[JSON.stringify(data),Mortalidad.idLevante,Mortalidad.semana],callback);
        })
    },
    deleteMortalidad:function(id,callback){
        return db.query("delete from mortalidad where idMortalidad=?",[id],callback);
    },
    updateMortalidad:function(id,Mortalidad,callback){
        db.query("UPDATE peso_semanajson set data = ? WHERE idPesoSemanaJson=?",[Mortalidad.data, id], callback);
        var data = JSON.parse(Mortalidad.data);
        for(var idLote in data) {
           db.query("UPDATE peso_semana_det SET peso_actual = ?, peso_standard = ?, peso_dif = ?, uniformidad = ?, Coef_V = ? WHERE idLevante = ? AND Semana = ? AND idLote = ?",[data[idLote].peso_actual, data[idLote].peso_standard, data[idLote].peso_dif, data[idLote].uniformidad, data[idLote].Coef_V, Mortalidad.idLevante, Mortalidad.semana, idLote ],callback);
        }
        return;
    },
    updateMortalidad2:function(id,Mortalidad,callback){
        var data2 = JSON.parse(Mortalidad.data);
        for(var idLote2 in data2) {
            db.query("CALL getActualizarPesoLevante(?, ?);",[Mortalidad.idLevante, idLote2],callback);
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

    }
};
module.exports=Mortalidad;

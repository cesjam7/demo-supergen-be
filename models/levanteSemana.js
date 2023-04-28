var db=require('../dbconnection');

var levanteSemana = {
    getLoteSemanalLevante:function(id, idLote, callback){
        return db.query("select * from levantes l " +
        "INNER JOIN lotes lo ON lo.idLevante = l.idLevante "+
        "INNER JOIN lineas li ON li.idLinea = lo.idLinea "+
        "WHERE l.idLevante = ? and lo.idLote = ? ORDER BY li.CodLinea ASC",[id,idLote],callback);
    },
    getAlimentoSemanalLevante: async function(id, idLote){
        return await db.query("SELECT * FROM `alimento_levante_sem` WHERE idLevante = ? and idLote = ? ORDER BY Semana",[id,idLote]);
    },
    getMortalidadSemanalLevante: async function(id, idLote) {
        return await db.query("SELECT * FROM `mortalidadsem` WHERE idLevante = ? and idLote = ? ORDER BY Semana",[id,idLote])
    },
    getPesoSemanalLevante: async function(id, idLote) {
        return await db.query("SELECT * FROM `peso_semana_det` WHERE idLevante = ? and idLote = ? ORDER BY Semana",[id,idLote])
    },
    getAllmortalidad:function(callback){

        return db.query("Select * from mortalidad",callback);

    },
    getMortalidadById:function(id, callback){
        return db.query("select * from mortalidad where idMortalidadDet=?",[id],callback);
    },
    getMortalidadByIdLevante:function(id, callback){
        return db.query("select * from mortalidad where idLevante=? order by Edad ASC",[id],callback);
    },
    getmortalidadUltimoDia:function(id, callback){
        return db.query("select * from mortalidad WHERE idLevante = ? ORDER BY Edad DESC LIMIT 0, 1",[id],callback);
    },
    getmortalidadDia:function(idLevante, Edad, callback){
        return db.query("select * from mortalidad WHERE idLevante = ? AND Edad = ?",[idLevante, Edad],callback);
    },
    getMortalidadLevante:function(id, callback){
        return db.query("select * from levantes l " +
        "INNER JOIN lotes lo ON lo.idLevante = l.idLevante "+
        "INNER JOIN lineas li ON li.idLinea = lo.idLinea "+
        "WHERE l.idLevante = ? ORDER BY li.CodLinea ASC",[id],callback);
    },
    getMortalidadLevantes:function(callback){
        return db.query("select * from levantes ORDER BY idLevante DESC",callback);
    },
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
    addMortalidadModal:function(Mortalidad,callback){
        console.log('Mortalidad', Mortalidad);
        db.query("INSERT INTO mortalidad (idLevante, Edad, data) values(?,?,?)",[Mortalidad.idLevante, Mortalidad.Edad, Mortalidad.data ]);
        var data = JSON.parse(Mortalidad.data);
        var semana = {};
        var lotes = [];
        for(var idLote in data) {
            semana[idLote] = {
                'NoAves' : 0,
                'PorcMortalidad' : 0,
                'NoEliminados' : 0,
                'PorcEliminados' : 0,
                'ErSex' : 0,
                'PorcError' : 0,
                'SelGen' : 0,
                'PorcSel' : 0
            };
            lotes.push(idLote);
           if (data[idLote].SelGen == undefined) {
               data[idLote]['SelGen'] = 0;
               data[idLote]['PorcSel'] = 0;
           }
           db.query("INSERT INTO mortalidad_det (idLevante, idLote, Edad, semana, fecha, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, ErSex, PorcError, SelGen, PorcSel) values(?,?,?,?,?,?,?,?,?,?,?,?,?)",[Mortalidad.idLevante, idLote, Mortalidad.Edad, Mortalidad.semana, Mortalidad.fecha, data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados, data[idLote].ErSex, data[idLote].PorcError, data[idLote].SelGen, data[idLote].PorcSel]);
        }

        if (Mortalidad.Edad <= 7) {
            var between = '1 AND 7';
            var num_semana = 1;
        } else if (Mortalidad.Edad <= 14) {
            var between = '8 AND 14';
            var num_semana = 2;
        } else if (Mortalidad.Edad <= 21) {
            var between = '15 AND 21';
            var num_semana = 3;
        } else if (Mortalidad.Edad <= 28) {
            var between = '22 AND 28';
            var num_semana = 4;
        } else if (Mortalidad.Edad <= 35) {
            var between = '29 AND 35';
            var num_semana = 5;
        } else if (Mortalidad.Edad <= 42) {
            var between = '36 AND 42';
            var num_semana = 6;
        } else if (Mortalidad.Edad <= 49) {
            var between = '43 AND 49';
            var num_semana = 7;
        } else if (Mortalidad.Edad <= 56) {
            var between = '50 AND 56';
            var num_semana = 8;
        }
        db.query("SELECT * FROM mortalidad_det WHERE idLevante = "+Mortalidad.idLevante+" AND Edad BETWEEN "+between+" ORDER BY Edad, idLote", (err,count) => {
            for (var i = 0; i < count.length; i++) {
                if(semana[count[i]['idLote']]['NoAves']!=undefined) {
                    semana[count[i]['idLote']]['NoAves'] = semana[count[i]['idLote']]['NoAves'] + count[i]['NoAves'];
                    semana[count[i]['idLote']]['PorcMortalidad'] = semana[count[i]['idLote']]['NoAves'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
                if(semana[count[i]['idLote']]['NoEliminados']!=undefined) {
                    semana[count[i]['idLote']]['NoEliminados'] = semana[count[i]['idLote']]['NoEliminados'] + count[i]['NoEliminados'];
                    semana[count[i]['idLote']]['PorcEliminados'] = semana[count[i]['idLote']]['NoEliminados'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
                if(semana[count[i]['idLote']]['ErSex']!=undefined) {
                    semana[count[i]['idLote']]['ErSex'] = semana[count[i]['idLote']]['ErSex'] + count[i]['ErSex'];
                    semana[count[i]['idLote']]['PorcError'] = semana[count[i]['idLote']]['ErSex'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
                if(semana[count[i]['idLote']]['SelGen']!=undefined) {
                    semana[count[i]['idLote']]['SelGen'] = semana[count[i]['idLote']]['SelGen'] + count[i]['SelGen'];
                    semana[count[i]['idLote']]['PorcSel'] = semana[count[i]['idLote']]['SelGen'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
            }

            console.log('dias encontrados '+count.length, semana);

            db.query("SELECT idMortalidadSem FROM mortalidadsem WHERE idLevante = "+Mortalidad.idLevante+" AND Semana = "+num_semana+" ORDER BY idLote", (err,count) => {
                if (count.length == 0) {
                    for (var i = 0; i < lotes.length; i++) {
                        db.query("INSERT INTO mortalidadsem (idLote, idLinea, Semana, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, ErSex, SelGen, PorcErSex, PorcSelGen, idLevante) values(?,?,?,?,?,?,?,?,?,?,?,?)",[lotes[i], 0, num_semana, semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), semana[lotes[i]].ErSex, semana[lotes[i]].SelGen, semana[lotes[i]].PorcError.toFixed(2), semana[lotes[i]].PorcSel.toFixed(2), Mortalidad.idLevante]);
                    }
                    callback()
                } else {
                    for (var i = 0; i < lotes.length; i++) {
                        console.log('ACTUALIZANDO SEMANA INSERTADA DE '+lotes[i]);
                        db.query("UPDATE mortalidadsem SET NoAves = ?, PorcMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, ErSex = ?, SelGen = ?, PorcErSex = ?, PorcSelGen = ? WHERE idLevante = ? AND Semana = ? AND idLote = ?",[semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), semana[lotes[i]].ErSex, semana[lotes[i]].SelGen, semana[lotes[i]].PorcError.toFixed(2), semana[lotes[i]].PorcSel.toFixed(2), Mortalidad.idLevante, num_semana, lotes[i]]);
                    }
                    callback()
                }
            })
        })
    },
    deleteMortalidad:function(id,callback){
        return db.query("delete from mortalidad where idMortalidad=?",[id],callback);
    },
    updateMortalidad:function(id,Mortalidad,callback){
        db.query("UPDATE mortalidad set data = ? WHERE idMortalidad=?",[Mortalidad.data, id]);
        var data = JSON.parse(Mortalidad.data);
        var semana = {};
        var lotes = [];
        for(var idLote in data) {
            semana[idLote] = {
                'NoAves' : 0,
                'PorcMortalidad' : 0,
                'NoEliminados' : 0,
                'PorcEliminados' : 0,
                'ErSex' : 0,
                'PorcError' : 0,
                'SelGen' : 0,
                'PorcSel' : 0
            };
            lotes.push(idLote);
           if (data[idLote].SelGen == undefined) {
               data[idLote]['SelGen'] = 0;
               data[idLote]['PorcSel'] = 0;
           }
           db.query("UPDATE mortalidad_det SET NoAves = ?, PorcMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, ErSex = ?, PorcError = ?, SelGen = ?, PorcSel = ? WHERE idLevante = ? AND Edad = ? AND idLote = ?",[data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados, data[idLote].ErSex, data[idLote].PorcError, data[idLote].SelGen, data[idLote].PorcSel, Mortalidad.idLevante, Mortalidad.Edad, idLote ]);
        }

        if (Mortalidad.Edad <= 7) {
            var between = '1 AND 7';
            var num_semana = 1;
        } else if (Mortalidad.Edad <= 14) {
            var between = '8 AND 14';
            var num_semana = 2;
        } else if (Mortalidad.Edad <= 21) {
            var between = '15 AND 21';
            var num_semana = 3;
        } else if (Mortalidad.Edad <= 28) {
            var between = '22 AND 28';
            var num_semana = 4;
        } else if (Mortalidad.Edad <= 35) {
            var between = '29 AND 35';
            var num_semana = 5;
        } else if (Mortalidad.Edad <= 42) {
            var between = '36 AND 42';
            var num_semana = 6;
        } else if (Mortalidad.Edad <= 49) {
            var between = '43 AND 49';
            var num_semana = 7;
        } else if (Mortalidad.Edad <= 56) {
            var between = '50 AND 56';
            var num_semana = 8;
        }
        db.query("SELECT * FROM mortalidad_det WHERE idLevante = "+Mortalidad.idLevante+" AND Edad BETWEEN "+between+" ORDER BY Edad, idLote", (err,count) => {
            for (var i = 0; i < count.length; i++) {
                if(semana[count[i]['idLote']]['NoAves']!=undefined) {
                    semana[count[i]['idLote']]['NoAves'] = semana[count[i]['idLote']]['NoAves'] + count[i]['NoAves'];
                    semana[count[i]['idLote']]['PorcMortalidad'] = semana[count[i]['idLote']]['NoAves'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
                if(semana[count[i]['idLote']]['NoEliminados']!=undefined) {
                    semana[count[i]['idLote']]['NoEliminados'] = semana[count[i]['idLote']]['NoEliminados'] + count[i]['NoEliminados'];
                    semana[count[i]['idLote']]['PorcEliminados'] = semana[count[i]['idLote']]['NoEliminados'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
                if(semana[count[i]['idLote']]['ErSex']!=undefined) {
                    semana[count[i]['idLote']]['ErSex'] = semana[count[i]['idLote']]['ErSex'] + count[i]['ErSex'];
                    semana[count[i]['idLote']]['PorcError'] = semana[count[i]['idLote']]['ErSex'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
                if(semana[count[i]['idLote']]['SelGen']!=undefined) {
                    semana[count[i]['idLote']]['SelGen'] = semana[count[i]['idLote']]['SelGen'] + count[i]['SelGen'];
                    semana[count[i]['idLote']]['PorcSel'] = semana[count[i]['idLote']]['SelGen'] / Mortalidad.NumHembras[count[i]['idLote']] * 100;
                }
            }
            console.log('dias encontrados '+count.length, semana);

            db.query("SELECT idMortalidadSem FROM mortalidadsem WHERE idLevante = "+Mortalidad.idLevante+" AND Semana = "+num_semana+" ORDER BY idLote", (err,count) => {
                if (count.length == 0) {
                    for (var i = 0; i < lotes.length; i++) {
                        db.query("INSERT INTO mortalidadsem (idLote, idLinea, Semana, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, ErSex, SelGen, PorcErSex, PorcSelGen, idLevante) values(?,?,?,?,?,?,?,?,?,?,?,?)",[lotes[i], 0, num_semana, semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), semana[lotes[i]].ErSex, semana[lotes[i]].SelGen, semana[lotes[i]].PorcError.toFixed(2), semana[lotes[i]].PorcSel.toFixed(2), Mortalidad.idLevante]);
                    }
                    callback()
                } else {
                    for (var i = 0; i < lotes.length; i++) {
                        console.log('ACTUALIZANDO SEMANA DE '+lotes[i]);
                        db.query("UPDATE mortalidadsem SET NoAves = ?, PorcMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, ErSex = ?, SelGen = ?, PorcErSex = ?, PorcSelGen = ? WHERE idLevante = ? AND Semana = ? AND idLote = ?",[semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), semana[lotes[i]].ErSex, semana[lotes[i]].SelGen, semana[lotes[i]].PorcError.toFixed(2), semana[lotes[i]].PorcSel.toFixed(2), Mortalidad.idLevante, num_semana, lotes[i]]);
                    }
                    callback()
                }
            })
        })
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
module.exports=levanteSemana;

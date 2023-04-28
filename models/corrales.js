var db = require('../dbconnection');

var Corral = {

    getAllGalpones: function(callback) {

        return db.query("Select * from galpones", callback);

    },
    getGalponById: function(id, callback) {

        return db.query("select * from galpones where idGalpon=?", [id], callback);
    },
    addGalpon: function(Galpon, callback) {
        console.log("inside service");
        console.log(Galpon.Id);
        return db.query("INSERT INTO galpones (Galpon, Estado) values(?,?)", [Galpon.Galpon, Galpon.Estado], callback);
    },
    deleteGalpon: function(id, callback) {
        return db.query("delete from galpones where idGalpon=?", [id], callback);
    },
    updateGalpon: function(id, Galpon, callback) {
        return db.query("UPDATE galpones set Galpon=?, Estado=? WHERE idGalpon=?", [Galpon.Galpon, Galpon.Estado, id], callback);
    },
    deleteAll: function(item, callback) {

        var delarr = [];
        for (i = 0; i < item.length; i++) {

            delarr[i] = item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)", [delarr], callback);
    },
    getUnidades: function(callback) {

        return db.query("Select * from geunidad", callback);

    },
    getlotebyIDgalpon: async function(id, idLote, idcorral) {
        let rows1 = await db.query("select * from lotes WHERE idGalpon = ? AND idLote = ?", [id, idLote]);
        let rows2 = await db.query("select idGalpon,galpon from galpones where idGalpon = ?", [id]);
        let rows3 = await db.query("SELECT * FROM corrales WHERE idlote = ? ", [idLote]);
        let rows4 = await db.query("SELECT * FROM semanas WHERE  idcorral = ? order by semana", [idcorral])

        // for (let i = 0; i < rows4.length; i++) {
        //     const e = rows4[i];
        //     if (e.semana > 24) {
        //         rows = await db.query(`SELECT * FROM standard_prod_hembra li
        //         INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod WHERE li.Semana = ?`, [e.semana]);
        //     } else {
        //         rows = await db.query(`SELECT * FROM standard_levante WHERE Semana  = ? `, [e.semana]);
        //     }
        //     let lote = await db.query(`SELECT * FROM lotes lo
        //     INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        //     INNER JOIN lineas li ON li.idLinea = lo.idLinea
        //     WHERE lo.idLote = ?`, [idLote]);
        //     let namerow = "Peso" + lote[0].Sexo + "_" + lote[0].CodLinea
        //     let ps = rows[0][namerow]
        //     e.diferencia = Number((((e.promedio - ps) / ps) * 100).toFixed(2))
        //     let diferencia = Number((((e.promedio - ps) / ps) * 100).toFixed(2))
        //     await db.query(`UPDATE semanas SET Dif_standard = '${diferencia}' WHERE semana = '${e.semana }' AND idcorral = '${idcorral}'`);
        // }


        return {
            lotes: rows1,
            galpones: rows2,
            corrales: rows3,
            semanas: rows4
        }
    },
    getSemanasxidlotes: async function(id, idLote, idcorral) {
        let rows = await db.query(`select * from lotes lo
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE lo.idGalpon = ? AND lo.idLote = ?`, [id, idLote]);
        let rows2 = await db.query("select idGalpon,galpon from galpones where idGalpon = ?", [id]);
        let rows3 = await db.query("SELECT * FROM corrales WHERE idlote = ? ", [idLote]);
        let rows4 = await db.query("SELECT * FROM semanas WHERE  id = ? order by semana", [idcorral]);
        let rows6 = await db.query("SELECT semana FROM semanas WHERE  id = ? order by semana", [idcorral]);
        let semana = rows6[0].semana;
        console.log(semana)
        if (semana > 24) {
            let rows6 = await db.query(`SELECT * FROM standard_prod_hembra li
            INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod  WHERE li.Semana = ?`, [semana]);
            return {
                lotes: rows,
                galpones: rows2,
                corrales: rows3,
                semanas: rows4,
                stdlevante: rows6
            }
        } else {
            let rows5 = await db.query("SELECT * FROM standard_levante WHERE Semana  = ? ", [semana]);
            return {
                lotes: rows,
                galpones: rows2,
                corrales: rows3,
                semanas: rows4,
                stdlevante: rows5
            }
        }
    },
    getlotebyIDcorral: async function(id) {
        let rows = await db.query("select * from corrales WHERE id = ?", [id]);
        // let rows2 = await db.query("select galpon from galpones where idGalpon = ?", [id]);
        return rows
    },
    getSemanaxidCorral: async function(id) {
        // let idcorral = String(id);
        let rows = await db.query("select * from semanas WHERE idcorral = ?", [id]);
        let rows2 = await db.query("select SUM(aves) as totalaves from semanas  where idcorral = ?", [id])
            // let rows2 = await db.query("select galpon from galpones where idGalpon = ?", [id]);
        return { semanas: rows, totalaves: rows2 }
    },
    getlotebyIDgalponxloteid: async function(id, idLote) {
        let lote = await db.query(`SELECT * FROM lotes lo
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        WHERE lo.idLote = ?`,[idLote])
        let idGalpon = lote[0].idGalpon;
        let nombrelote = lote[0].lote;
        let nombreloteNac = lote[0].lote_str;
        let nombregalpon = "G"+lote[0].Galpon + "/"+lote[0].lote;
        let nombregalponNac = "G"+lote[0].Galpon + "/"+lote[0].lote_str;
        let rows3 = await db.query("SELECT * FROM corrales WHERE idlote = ? ", [idLote]);
        
        for (let i = 0; i < rows3.length; i++) {
            const e = rows3[i];
            let cons_semana = await db.query(`SELECT MAX(semana) as semana
            FROM semanas WHERE idcorral = ?`,[e.id]);
            let max_semana = 1;
            if(cons_semana.length != 0){
                max_semana = cons_semana[0].semana
            }
            let cons_pesajes = await db.query(`SELECT * FROM semanas 
            WHERE idcorral = ? and semana = ?`,[e.id, max_semana]);
            
            if(cons_pesajes.length != 0){
                let cp = cons_pesajes[0]
                e.Dif_standard = cp.Dif_standard;
                e.aves = cp.aves;
                e.maxsemana = cp.semana;
                e.promedio = cp.promedio;
                e.Coef_de_var = cp.Coef_de_var;
                e.Uniformidad = cp.Uniformidad;
                e.nombrelote = nombrelote;
                e.nombregalpon = nombregalpon;
                e.idLote = idLote;
                e.idGalpon = idGalpon;
            }
        }

        rows3.sort((a,b) => {
            let corral_a = parseInt(a.corral.substr(1,a.corral.length));
            let corral_b = parseInt(b.corral.substr(1,b.corral.length));
            if (corral_a < corral_b){
                return -1;
            }else if ( corral_a > corral_b){
                return 1;
            }else {
                return 0;
            }
        });

        let rows4 = await db.query(`SELECT * 
        FROM nacimiento_det nd 
        INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [idLote]);
        
        for (let i = 0; i < rows4.length; i++) {
            const e = rows4[i];
            let cons_semana = await db.query(`SELECT MAX(semana) as semana
            FROM semanas WHERE idcorral = ? and idlote = ?`,[e.idNacimiento, idLote]);
            let max_semana = 1;
            if(cons_semana.length != 0){
                max_semana = cons_semana[0].semana
            }
            let cons_pesajes = await db.query(`SELECT * FROM semanas 
            WHERE idcorral = ? and semana = ? and idlote = ?`,[e.idNacimiento, max_semana, idLote]);
            
            if(cons_pesajes.length != 0){
                let cp = cons_pesajes[0]
                e.Dif_standard = cp.Dif_standard;
                e.aves = cp.aves;
                e.maxsemana = cp.semana;
                e.promedio = cp.promedio;
                e.Coef_de_var = cp.Coef_de_var;
                e.Uniformidad = cp.Uniformidad;
                e.nombrelote = nombreloteNac;
                e.nombregalpon = nombregalponNac;
                e.idLote = idLote;
                e.idGalpon = idGalpon;
            }
        }

        return {
            corrales: rows3,
            nacimientos: rows4
        }
    },
    getlotebyIDcorralxLoteid: async function(id) {
        let rows = await db.query("SELECT * FROM corrales WHERE id = ? AND idLote = ? ", [idLote]);
        // let rows2 = await db.query("select galpon from galpones where idGalpon = ?", [id]);
        return rows
    },
    updatePesaje: async function(id, Pesaje) {

        function PesoPromedio(pesaje) {
            var sumatoria = pesaje.reduce(function(a, b) {
                return a + b; //Regresa el acumulador más el siguiente
            }, 0); //Pero si no encuentras nada o no hay siguiente, regresa 0
            var Pesopromedio = sumatoria / pesaje.length;
            let newpromedio = Math.floor(Pesopromedio * 100) / 100
            return newpromedio
        }
        let aves = Number(Pesaje.pesajes.length);
        let Pesajes = Pesaje.pesajes;

        let Pesopromedio = PesoPromedio(Pesajes);
        let pesos = JSON.stringify(Pesajes);
        let semanas = await db.query(`SELECT * FROM semanas where id = '${id}'`)
        let semana = await db.query(`SELECT semana FROM semanas where id = '${id}'`)
        let sem = semanas[0];
        let sema = semana[0].semana;

        if (semana > 24) {
            rows = await db.query(`SELECT * FROM standard_prod_hembra li
                INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod WHERE li.Semana = ?`, [sema]);
        } else {
            rows = await db.query(`SELECT * FROM standard_levante WHERE Semana  = ? `, [sema]);
        }
        let lote = await db.query(`SELECT * FROM lotes lo
            INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE lo.idLote = ?`, [Pesaje.idLote]);
        let namerow = "Peso" + lote[0].Sexo + "_" + lote[0].CodLinea
        let ps = rows[0][namerow]
        let diferencia = Number((((sem.promedio - ps) / ps) * 100).toFixed(2))
        console.log(diferencia, "ps", ps, "semanaprom", sem.promedio, "semana", sema)
            // await db.query(`UPDATE semanas SET  WHERE id = '${id}'`);

        let rows2 = await db.query("UPDATE semanas set detalle = ?, aves = ?, promedio = ?, observacion =?, usuario = ?, Dif_standard = ?  where id = ?", [pesos, aves, Pesopromedio, Pesaje.descripcion, Pesaje.usuario, diferencia, id]);
        return rows2
    },
    addnewPesajes: async function() {
        let rows2 = await db.query("INSERT INTO semanas (detalle) values (?) ")
    },
    ExportFiltersemanal: async function(Semana, idLote) {
        let rows = await db.query(`SELECT * FROM semanas INNER JOIN 
                    corrales ON semanas.idcorral = corrales.id 
                    where semanas.semana = ? and corrales.idlote = ?`, [Semana, idLote]);
        if (rows == 0) {
            return {
                success: false,
                message: `No existen Corrales registrados en la semana ${Semana}`
            }
        }else{
            rows.sort((a,b) => {
                let corral_a = parseInt(a.corral.substr(1,a.corral.length));
                let corral_b = parseInt(b.corral.substr(1,b.corral.length));
                if (corral_a < corral_b){
                    return -1;
                }else if ( corral_a > corral_b){
                    return 1;
                }else {
                    return 0;
                }
            });
            return {
                success: true,
                data : rows
            }
        }
    },
    reportesimplenac: async function(Semana, idLote) {
        let rows = await db.query(`SELECT * FROM semanas se
                INNER JOIN nacimiento na ON se.idcorral = na.idNacimiento
                where se.semana = ? and se.idlote = ?`, [Semana, idLote]);
        if (rows == 0) {
            return {
                success: false,
                message: `No existen Nacimientos registradas en la semana ${Semana}`
            }
        }else{
            return {
                success: true,
                data : rows
            }
        }
    },
    Exportsemanal: async function(Semana, idLote) {
        let hojas = [];
        let rows
        if (Semana > 24) {
            rows = await db.query(`SELECT * FROM standard_prod_hembra li
            INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod WHERE li.Semana = ?`, [Semana]);
        } else {
            rows = await db.query(`SELECT * FROM standard_levante WHERE Semana  = ? `, [Semana]);
        }
        let lote = await db.query(`SELECT * FROM lotes lo
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE lo.idLote = ?`, [idLote]);
        let namerow = "Peso" + lote[0].Sexo + "_" + lote[0].CodLinea
        let ps = rows[0][namerow]
        let galpon = {
            lote: lote[0].lote,
            name: "G" + lote[0].Galpon + "/" + lote[0].lote,
            detalle: [],
            pesostandard: ps
        }
        let corrales = await db.query(`SELECT * FROM corrales WHERE idlote = ?`, [idLote])
        let sum = 0;
        let indicador = 0;
        for (let i = 0; i < corrales.length; i++) {
            const c = corrales[i]
            let pesajes = await db.query(`SELECT * FROM semanas 
            WHERE idcorral = '${c.id}' and semana = '${Semana}'`)
            if (pesajes.length != 0) {
                if (pesajes[0].detalle != null) {
                    pesajes[0].detalle = JSON.parse(pesajes[0].detalle)
                    let detalle = [];
                    for (let j = 0; j < pesajes[0].detalle.length; j++) {
                        const d = pesajes[0].detalle[j];
                        detalle.push({
                            NroAve: j + 1,
                            Peso: d
                        })
                        galpon.detalle.push({
                            NroAve: indicador + j + 1,
                            Peso: d
                        });
                    }
                    indicador = indicador + pesajes[0].detalle.length
                    sum = sum + pesajes[0].promedio
                    c.promedio = pesajes[0].promedio
                    c.nroaves = pesajes[0].aves
                    c.detalle = detalle
                    c.pesostandard = ps
                    c.diferencia = Number((((c.promedio - c.pesostandard) / c.pesostandard) * 100).toFixed(2))
                }
                c.semana = Semana
            }
        }
        galpon.promedio = sum / corrales.length;
        galpon.diferencia = Number((((galpon.promedio - galpon.pesostandard) / galpon.pesostandard) * 100).toFixed(2))
        galpon.nroaves = galpon.detalle.length;
        galpon.semana = Semana
        hojas.push(galpon);
        for (let i = 0; i < corrales.length; i++) {
            const c = corrales[i];
            hojas.push(c)
        }
        return {
            success: true,
            message: 'Envío de hojas correctamente',
            hojas: hojas
        }
    },
    Semanafilter: async function(idLote) {
        let rows = await db.query(`SELECT semana FROM semanas INNER JOIN 
                                    corrales ON semanas.idcorral = corrales.id 
                                    where  corrales.idlote = ? order by semanas.semana`, [idLote]);
        let newarray = [];
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            newarray.push(
                e.semana
            )
        }
        let list = newarray.filter((x, i, a) => a.indexOf(x) == i);
        let rowsNac = await db.query(`SELECT semana FROM semanas
                                    where idlote = ? and LENGTH(idcorral) < 10
                                     order by semana`, [idLote]);
        let newarrayNac = [];
        for (let i = 0; i < rowsNac.length; i++) {
            const e = rowsNac[i];
            newarrayNac.push(
                e.semana
            )
        }
        let listNac = newarrayNac.filter((x, i, a) => a.indexOf(x) == i);
        return {
            list,
            listNac
        }
    },
    ExportExcelSemanaxId: async function(idLote, Semana, id) {

        // let rows = await db.query(`SELECT * FROM semanas INNER JOIN 
        //     corrales ON semanas.idcorral = corrales.id 
        //     where  corrales.idlote = ? and semanas.id = ? order by semanas.semana`, [idLote, id]);
        let hojas = [];
        let rows
        if (Semana > 24) {
            rows = await db.query(`SELECT * FROM standard_prod_hembra li
            INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod WHERE li.Semana = ?`, [Semana]);
        } else {
            rows = await db.query(`SELECT * FROM standard_levante WHERE Semana  = ? `, [Semana]);
        }
        let lote = await db.query(`SELECT * FROM lotes lo
            INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE lo.idLote = ?`, [idLote]);
        let namerow = "Peso" + lote[0].Sexo + "_" + lote[0].CodLinea
        let ps = rows[0][namerow]
        let galpon = {
            lote: lote[0].lote,
            name: "G" + lote[0].Galpon + "/" + lote[0].lote,
            detalle: [],
            pesostandard: ps
        }
        let corrales = await db.query(`SELECT * FROM semanas INNER JOIN 
            corrales ON semanas.idcorral = corrales.id 
            where  corrales.idlote = ? and semanas.id = ? order by semanas.semana`, [idLote, id])
        let sum = 0;
        let indicador = 0;
        for (let i = 0; i < corrales.length; i++) {
            const c = corrales[i]
            let pesajes = await db.query(`SELECT * FROM semanas 
                WHERE id = '${id}' and semana = '${Semana}'`)
            if (pesajes.length != 0) {
                if (pesajes[0].detalle != null) {
                    pesajes[0].detalle = JSON.parse(pesajes[0].detalle)
                    let detalle = [];
                    for (let j = 0; j < pesajes[0].detalle.length; j++) {
                        const d = pesajes[0].detalle[j];
                        detalle.push({
                            NroAve: j + 1,
                            Peso: d
                        })
                        galpon.detalle.push({
                            NroAve: indicador + j + 1,
                            Peso: d
                        });
                    }
                    indicador = indicador + pesajes[0].detalle.length
                    sum = sum + pesajes[0].promedio
                    c.promedio = pesajes[0].promedio
                    c.nroaves = pesajes[0].aves
                    c.detalle = detalle
                    c.pesostandard = ps
                    c.diferencia = Number((((c.promedio - c.pesostandard) / c.pesostandard) * 100).toFixed(2))
                }
                c.semana = Semana
            }
        }
        galpon.promedio = sum / corrales.length;
        galpon.diferencia = Number((((galpon.promedio - galpon.pesostandard) / galpon.pesostandard) * 100).toFixed(2))
        galpon.nroaves = galpon.detalle.length;
        galpon.semana = Semana
        hojas.push(galpon);
        for (let i = 0; i < corrales.length; i++) {
            const c = corrales[i];
            hojas.push(c)
        }
        if (hojas.length == 0) {
            return {
                success: false,
                message: `No existen pesajes en el Pesaje ${Semana}`
            }
        }
        return {
            success: true,
            message: 'Envío de hojas correctamente',
            hojas: hojas
        }
    },
    rutaspesajesdet: async function(idLote, id) {
        let rows = await db.query(`SELECT * FROM semanas INNER JOIN 
         corrales ON semanas.idcorral = corrales.id 
         where  corrales.idlote = ? and semanas.id = ? `, [idLote, id])
        return rows
    }

};
module.exports = Corral;
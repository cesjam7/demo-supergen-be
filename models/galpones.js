var db = require('../dbconnection');
const { max } = require('moment');
const mysqlClass = require("../dbConnectionClass")
var Galpon = {
    PesoPromedio: function (pesaje) {
        var sumatoria = pesaje.reduce(function (a, b) {
            return a + b; //Regresa el acumulador más el siguiente
        }, 0); //Pero si no encuentras nada o no hay siguiente, regresa 0
        var Pesopromedio = sumatoria / pesaje.length;
        return Pesopromedio
    },
    getAllGalpones: function (callback) {

        return db.query("Select * from galpones", callback);

    },
    getGalponById: function (id, callback) {

        return db.query("select * from galpones where idGalpon=?", [id], callback);
    },
    addGalpon: function (Galpon, callback) {
        console.log("inside service");
        console.log(Galpon.Id);
        return db.query("INSERT INTO galpones (Galpon, Estado) values(?,?)", [Galpon.Galpon, Galpon.Estado], callback);
    },
    deleteGalpon: function (id, callback) {
        return db.query("delete from galpones where idGalpon=?", [id], callback);
    },
    updateGalpon: function (id, Galpon, callback) {
        return db.query("UPDATE galpones set Galpon=?, Estado=? WHERE idGalpon=?", [Galpon.Galpon, Galpon.Estado, id], callback);
    },
    deleteAll: function (item, callback) {

        var delarr = [];
        for (i = 0; i < item.length; i++) {

            delarr[i] = item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)", [delarr], callback);
    },
    getUnidades: function (callback) {

        return db.query("Select * from geunidad", callback);

    },
    getlotebyIDgalpon: async function (id, idLote, idcorral) {
        let rows1 = await db.query("select * from lotes WHERE idGalpon = ? AND idLote = ?", [id, idLote]);
        let rows2 = await db.query("select idGalpon,galpon from galpones where idGalpon = ?", [id]);
        let rows3 = await db.query("SELECT * FROM corrales WHERE idlote = ? ", [idLote]);
        let rows4 = await db.query("SELECT * FROM semanas WHERE idcorral = ? and estado = 1 order by semana", [idcorral])
        let rows5 = await db.query(`SELECT * 
        FROM nacimiento_det nd 
        INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [idLote]);
        let rows6 = await db.query("SELECT * FROM semanas WHERE idcorral = ? and idlote = ? and estado=1 order by semana", [idcorral, idLote])

        return {
            lotes: rows1,
            galpones: rows2,
            corrales: rows3,
            semanas: rows4,
            semanas_nac: rows6,
            nacimientos: rows5
        }
    },
    deleteSemana: async function (semanasId) {
        await db.query("update semanas set estado=0 where id=?", [semanasId])

    },
    getSemanasxidlotes: async function (id, idLote, idcorral) {
        let rows = await db.query(`select * from lotes lo
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE lo.idGalpon = ? AND lo.idLote = ?`, [id, idLote]);
        let rows2 = await db.query("select idGalpon,galpon from galpones where idGalpon = ?", [id]);
        let rows3 = await db.query("SELECT * FROM corrales WHERE idlote = ? ", [idLote]);
        let rows4 = await db.query("SELECT * FROM semanas WHERE  id = ? order by semana", [idcorral]);
        let rows5 = await db.query(`SELECT * 
        FROM nacimiento_det nd 
        INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [idLote]);

        return {
            lotes: rows,
            galpones: rows2,
            corrales: rows3,
            semanas: rows4,
            nacimientos: rows5
        }
    },
    getlotebyIDcorral: async function (id) {
        let rows = await db.query("select * from corrales WHERE id = ?", [id]);
        // let rows2 = await db.query("select galpon from galpones where idGalpon = ?", [id]);
        return rows
    },
    getSemanaxidCorral: async function (id) {
        // let idcorral = String(id);
        let rows = await db.query("select * from semanas WHERE idcorral = ?", [id]);
        let rows2 = await db.query("select SUM(aves) as totalaves from semanas  where idcorral = ?", [id])
        // let rows2 = await db.query("select galpon from galpones where idGalpon = ?", [id]);
        return { semanas: rows, totalaves: rows2 }
    },
    getlotebyIDgalponxloteid: async function (id, idLote) {
        let idgalpon = Number(id);
        let IDlote = Number(idLote);
        let rows = await db.query("SELECT idLote,lote,lote_str,TipoLote,TipoGenero,Sexo,NumHembras FROM lotes WHERE idGalpon = ? AND idLote = ?", [idgalpon, IDlote]);
        let rows2 = await db.query("SELECT idGalpon,galpon FROM galpones WHERE idGalpon = ?", [idgalpon]);
        let rows3 = await db.query("SELECT id,corral,idlote FROM corrales WHERE idlote = ? ", [IDlote]);
        let rows4 = await db.query(`SELECT na.idNacimiento,nd.fechaNacimiento
           FROM nacimiento_det nd 
           INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
           INNER JOIN lotes lo on lo.idLote = nd.idLote 
           WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [idLote]);
        // console.log("lotes:", rows, "galpones:", rows2, "corrales:", rows3)
        let rows8 = await db.query(`SELECT  SUM(aves)  as aves, SUM(semana) as semana FROM semanas INNER JOIN 
           corrales ON semanas.idcorral = corrales.id 
           where corrales.idLote = ?`, [idLote]);

        let semanasnew = [];
        let PromedioCorrales = [];

        let promtotal = [];
        for (let i = 0; i < rows3.length; i++) {
            const e = rows3[i];
            let semanas = await db.query("SELECT idcorral,promedio FROM semanas WHERE  idcorral = ? order by semana", [e.id]);
            for (let j = 0; j < semanas.length; j++) {
                const d = semanas[j];
                if (e.id == d.idcorral) {
                    semanasnew.push({
                        idcorral: d.idcorral,
                        promedio: d.promedio
                    })
                }
            }
            let maxsemana = await db.query(`SELECT MAX(semana) as maxsemana from semanas where idcorral = ? order by maxsemana`, [e.id]);
            for (let k = 0; k < maxsemana.length; k++) {
                const d = maxsemana[k];
                if (d.maxsemana == null) {
                    d.maxsemana = 0;
                }
                e.maxsemana = d.maxsemana
                let semana = await db.query(`SELECT aves,Dif_standard,promedio,semana,Coef_de_var,Uniformidad FROM semanas where semana  = '${e.maxsemana}' AND idcorral = '${e.id}'`)
                if (semana.length == 0) {
                    semana_vacias = [];
                    let json = {
                        aves: 'No existen',
                        Dif_standard: 'No existen',
                        promedio: 0,
                        semana: 'No existen',
                        Coef_de_var: 'No existen',
                        Uniformidad: 'No existen'
                    }
                    semana_vacias.push(json)
                    e.child = semana_vacias
                } else {
                    e.child = semana;
                }

            }

            const result = semanasnew.filter(x => x.idcorral == e.id);
            const leng = result.length;
            let suma = result.reduce((acumulador, team) => acumulador + team.promedio, 0);
            let prom = suma / leng;
            if (isNaN(prom)) {
                prom = 0;
            }
            PromedioCorrales.push({
                promcorral: prom
            })
            e.promedio = prom

        }
        let totalpromedio = []
        let sumatoria = 0;
        for (let j = 0; j < rows3.length; j++) {
            const d = rows3[j];
            let total = d.promedio
            totalpromedio.push(total);
            let suma = totalpromedio.reduce((acumulador, team) => acumulador + team, 0);
            for (let j = 0; j < rows.length; j++) {
                const e = rows[j];
                e.promtotal = suma / rows3.length
            }
        }

        return {
            lotes: rows,
            galpones: rows2,
            corrales: rows3,
            nacimientos: rows4,
            totalaves: rows8
        }
    },
    getDataPorIdLotesYGalpones: async function (lotes = []) {
        const lotesProcesamiento = []
        const idsGalpones = lotes.map(l => l.idGalpon)
        const idsLotes = lotes.map(l => l.id)
        if (idsGalpones.length > 0 && idsLotes.length > 0) {
            const lotesBd = await mysqlClass.ejecutarQueryPreparado(`SELECT idLote,lote,lote_str,TipoLote,TipoGenero,Sexo,NumHembras,idGalpon,idLote FROM lotes WHERE idGalpon in(${idsGalpones.join()}) AND idLote in(${idsLotes.join()})`, {})
            const galpones = await mysqlClass.ejecutarQueryPreparado(`SELECT idGalpon,galpon FROM galpones WHERE idGalpon in(${idsGalpones.join()})`, {})
            const corrales = await mysqlClass.ejecutarQueryPreparado(`SELECT id,corral,idLote FROM corrales where idLote in(${idsLotes.join()})`, {})
            const dataNacimiento = await mysqlClass.ejecutarQueryPreparado(`SELECT na.idNacimiento,nd.fechaNacimiento,nd.idLote
            FROM nacimiento_det nd 
            INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
            INNER JOIN lotes lo on lo.idLote = nd.idLote 
            WHERE nd.idLote in(${idsLotes.join()}) order by nd.fechaNacimiento DESC`, {})
            const dataTotalAves = await mysqlClass.ejecutarQueryPreparado(`SELECT  SUM(aves)  as aves, SUM(semana) as semana,corrales.idlote as idLote FROM semanas INNER JOIN 
            corrales ON semanas.idcorral = corrales.id 
            where corrales.idLote in(${idsLotes.join()})
    GROUP BY corrales.idlote`, {})
            if (corrales.length > 0) {
                const semanasCorralesBd = await mysqlClass.ejecutarQueryPreparado(`SELECT idcorral as idCorral,promedio,semana,Coef_de_var,Uniformidad FROM semanas WHERE  idcorral in(${corrales.map(c => `'${c.id}'`).join()}) order by semana`, {})
                for (const corral of corrales) {
                    const semanasPorCorral = semanasCorralesBd.filter(s => s.idCorral == corral.id)
                    const semanaMaxima = semanasPorCorral[semanasPorCorral.length - 1] ? semanasPorCorral[semanasPorCorral.length - 1] : {
                        aves: 'No existen',
                        Dif_standard: 'No existen',
                        promedio: 0,
                        semana: 'No existen',
                        Coef_de_var: 'No existen',
                        Uniformidad: 'No existen'
                    }
                    corral.child = semanaMaxima
                    corral.maxsemana = semanaMaxima.semana == 'No existen' ? 0 : semanaMaxima.semana
                    const sumaPromedio = semanasPorCorral.reduce((prev, curr) => prev + curr.promedio, 0)
                    const calculoPromedio = sumaPromedio / semanasPorCorral.length
                    corral.promedio = isNaN(calculoPromedio) ? 0 : calculoPromedio

                }





            }
            for (let i = 0; i < lotes.length; i++) {
                const loteAxctual = lotes[i]
                const lotesFiltado = lotesBd.filter(l => l.idGalpon == loteAxctual.idGalpon && l.idLote == loteAxctual.id)
                const galponesFiltado = galpones.filter(g => g.idGalpon == loteAxctual.idGalpon)
                const nacimientos = dataNacimiento.filter(n => n.idLote == loteAxctual.id)
                const dataTotalAvesFiltado = dataTotalAves.filter(d => d.idLote == loteAxctual.id)
                lotesProcesamiento.push({
                    idLote: loteAxctual.id, idGalpon: loteAxctual.idGalpon, data: {
                        lotes: lotesFiltado,
                        galpones: galponesFiltado,
                        nacimientos,
                        totalaves: dataTotalAvesFiltado
                    }
                })
            }

        }
        return lotesProcesamiento
    },
    getlotebyIDcorralxLoteid: async function (id) {
        let rows = await db.query("SELECT * FROM corrales WHERE id = ? AND idLote = ? ", [idLote]);
        // let rows2 = await db.query("select galpon from galpones where idGalpon = ?", [id]);
        return rows
    },
    updatePesaje: async function (id, Pesaje) {
        let aves = Number(Pesaje.pesajes.length);
        let Pesajes = Pesaje.pesajes;
        let Pesopromedio = this.PesoPromedio(Pesajes);
        let pesos = JSON.stringify(Pesajes);
        let semanas = await db.query(`SELECT * FROM semanas where id = '${id}'`)
        let semana = await db.query(`SELECT semana, STD FROM semanas where id = '${id}'`)
        let sem = semanas[0];
        let STD = semana[0].STD;
        let diferencia = ((Pesopromedio - STD) / STD) * 100

        let valormas10 = (Pesopromedio * 0.1) + Pesopromedio;
        let valormenos10 = Pesopromedio - (Pesopromedio * 0.1);

        let sumaDS = 0;
        let conteo = 0;
        for (var x = 0; x < Pesajes.length; x++) {
            const p = Pesajes[x];
            let valor = Math.pow((p - Pesopromedio), 2);
            sumaDS += valor;

            if (p <= valormas10 && p >= valormenos10) {
                conteo = conteo + 1;
            }
        }

        let Uniformidad = (conteo / Pesajes.length) * 100;

        let DS = Math.sqrt(sumaDS / (Pesajes.length - 1));

        let Coef_de_var = (DS / Pesopromedio) * 100;

        let rows2 = await db.query(`UPDATE semanas set detalle = ?, aves = ?, promedio = ?, observacion =?, 
        usuario = ?, Dif_standard = ?, Uniformidad = ?, Coef_de_var = ? where id = ?`,
            [pesos, aves, Pesopromedio, Pesaje.descripcion, Pesaje.usuario, diferencia, Uniformidad, Coef_de_var, id]);
        return rows2
    },
    addnewPesajes: async function () {
        let rows2 = await db.query("INSERT INTO semanas (detalle) values (?) ")
    },
    ExportFiltersemanal: async function (Semana, idLote) {
        console.log(Semana)
        let rows = await db.query(`SELECT * FROM semanas INNER JOIN 
                                   corrales ON semanas.idcorral = corrales.id 
                                   where semanas.semana = ? and corrales.idlote = ?`, [Semana, idLote]);
        if (rows == 0) {
            return {
                success: false,
                message: `No existen Corrales registradas en la semana ${Semana}`
            }
        }
        return rows
    },
    Exportsemanal: async function (Semana, idLote) {
        let hojas = [];
        let lote = await db.query(`SELECT * FROM lotes lo
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE lo.idLote = ?`, [idLote]);
        let galpon = {
            lote: lote[0].lote,
            name: "G" + lote[0].Galpon + "/" + lote[0].lote,
            detalle: []
        }
        let corrales = await db.query(`SELECT co.* FROM corrales co
        INNER JOIN semanas se ON se.idcorral = co.id
        WHERE co.idlote = ? and se.semana = ?
        ORDER BY co.fecha_creacion`, [idLote, Semana])
        let sum = 0;
        let indicador = 0;
        let STD = 0;
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
                        sum = sum + d
                    }
                    indicador = indicador + pesajes[0].detalle.length
                    c.promedio = pesajes[0].promedio
                    c.nroaves = pesajes[0].aves
                    c.detalle = detalle
                    c.pesostandard = pesajes[0].STD
                    c.diferencia = pesajes[0].Dif_standard
                    c.Coef_de_var = pesajes[0].Coef_de_var
                    c.Uniformidad = pesajes[0].Uniformidad
                    if (i == 0) {
                        STD = pesajes[0].STD;
                    }
                }
                c.semana = Semana
            }
        }
        galpon.pesostandard = STD;
        galpon.nroaves = galpon.detalle.length;
        galpon.promedio = Number((sum / galpon.detalle.length).toFixed(3));
        galpon.diferencia = Number((((galpon.promedio - STD) / STD) * 100).toFixed(3))
        let valormas10 = (galpon.promedio * 0.1) + galpon.promedio;
        let valormenos10 = galpon.promedio - (galpon.promedio * 0.1);
        let sumaDS = 0;
        let conteo = 0;
        for (var x = 0; x < galpon.detalle.length; x++) {
            const p = galpon.detalle[x].Peso;
            let valor = Math.pow((p - galpon.promedio), 2);
            sumaDS += valor;

            if (p <= valormas10 && p >= valormenos10) {
                conteo = conteo + 1;
            }
        }
        let DS = Math.sqrt(sumaDS / (galpon.detalle.length - 1));
        galpon.Coef_de_var = Number(((DS / galpon.promedio) * 100).toFixed(3));
        galpon.Uniformidad = Number(((conteo / galpon.detalle.length) * 100).toFixed(3));
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
    ExportsemanalNac: async function (Semana, idLote) {
        let hojas = [];
        let lote = await db.query(`SELECT * FROM lotes lo
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE lo.idLote = ?`, [idLote]);
        let galpon = {
            lote: lote[0].lote_str,
            name: "G" + lote[0].Galpon + "/" + lote[0].lote_str,
            detalle: []
        }

        let corrales = await db.query(`SELECT * 
        FROM nacimiento_det nd 
        INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
        WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [idLote]);
        let sum = 0;
        let indicador = 0;
        let rowsSTD = await db.query(`SELECT * FROM standard_planta WHERE idStandard_Planta = 1`)
        let STD = 34;
        if (rowsSTD.length != 0) {
            STD = rowsSTD[0].Valor
        }
        for (let i = 0; i < corrales.length; i++) {
            const c = corrales[i]
            let pesajes = await db.query(`SELECT * FROM semanas 
            WHERE idcorral = '${c.idNacimiento}' and semana = '${Semana}' 
            and idlote = '${idLote}'`)
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
                        sum = sum + d
                    }
                    indicador = indicador + pesajes[0].detalle.length
                    c.promedio = pesajes[0].promedio
                    c.nroaves = pesajes[0].aves
                    c.detalle = detalle
                    c.pesostandard = pesajes[0].STD
                    c.diferencia = pesajes[0].Dif_standard
                    c.Coef_de_var = pesajes[0].Coef_de_var
                    c.Uniformidad = pesajes[0].Uniformidad
                    if (i == 0) {
                        STD = pesajes[0].STD;
                    }
                }
                c.semana = Semana
            }
        }
        galpon.pesostandard = STD;
        galpon.nroaves = galpon.detalle.length;
        galpon.promedio = Number((sum / galpon.detalle.length).toFixed(3));
        galpon.diferencia = Number((((galpon.promedio - STD) / STD) * 100).toFixed(3))
        let valormas10 = (galpon.promedio * 0.1) + galpon.promedio;
        let valormenos10 = galpon.promedio - (galpon.promedio * 0.1);
        let sumaDS = 0;
        let conteo = 0;
        for (var x = 0; x < galpon.detalle.length; x++) {
            const p = galpon.detalle[x].Peso;
            let valor = Math.pow((p - galpon.promedio), 2);
            sumaDS += valor;

            if (p <= valormas10 && p >= valormenos10) {
                conteo = conteo + 1;
            }
        }
        let DS = Math.sqrt(sumaDS / (galpon.detalle.length - 1));
        galpon.Coef_de_var = Number(((DS / galpon.promedio) * 100).toFixed(3));
        galpon.Uniformidad = Number(((conteo / galpon.detalle.length) * 100).toFixed(3));
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
    Semanafilter: async function (idLote) {
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
    ExportExcelSemanaxId: async function (idLote, Semana, id) {
        let hojas = [];
        let lote = await db.query(`SELECT * FROM lotes lo
            INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE lo.idLote = ?`, [idLote]);
        let galpon = {
            lote: lote[0].lote,
            name: "G" + lote[0].Galpon + "/" + lote[0].lote,
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
                    }
                    indicador = indicador + pesajes[0].detalle.length
                    sum = sum + pesajes[0].promedio
                    c.promedio = pesajes[0].promedio
                    c.nroaves = pesajes[0].aves
                    c.detalle = detalle
                    c.pesostandard = pesajes[0].STD
                    c.diferencia = pesajes[0].Dif_standard
                }
                c.semana = Semana
            }
        }
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
    ExportExcelSemanaxIdNac: async function (idLote, Semana, id) {
        let hojas = [];
        let lote = await db.query(`SELECT * FROM lotes lo
            INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE lo.idLote = ?`, [idLote]);
        let galpon = {
            lote: lote[0].lote_str,
            name: "G" + lote[0].Galpon + "/" + lote[0].lote_str,
        }
        let corrales = await db.query(`SELECT * FROM semanas se
            INNER JOIN nacimiento na ON se.idcorral = na.idNacimiento
            where se.idlote = ? and se.id = ? order by se.semana`, [idLote, id])
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
                    }
                    indicador = indicador + pesajes[0].detalle.length
                    sum = sum + pesajes[0].promedio
                    c.promedio = pesajes[0].promedio
                    c.nroaves = pesajes[0].aves
                    c.detalle = detalle
                    c.pesostandard = pesajes[0].STD
                    c.diferencia = pesajes[0].Dif_standard
                }
                c.semana = Semana
            }
        }
        hojas.push(galpon);
        for (let i = 0; i < corrales.length; i++) {
            const c = corrales[i];
            hojas.push(c)
        }
        if (hojas.length == 0) {
            return {
                success: false,
                message: `No existen registros en el Pesaje ${Semana}`
            }
        }
        return {
            success: true,
            message: 'Envío de hojas correctamente',
            hojas: hojas
        }
    },
    rutaspesajesdet: async function (idLote, id) {
        let rows = await db.query(`SELECT * FROM semanas INNER JOIN 
         corrales ON semanas.idcorral = corrales.id 
         where  corrales.idlote = ? and semanas.id = ? `, [idLote, id])
        return rows
    },
    getInfo: async function (idLote) {
        let lote = await db.query(`SELECT lo.idGalpon,lo.Sexo,CodLinea,Galpon,lote,lo.idLote,lote_str FROM lotes lo
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE idLote = ?`, [idLote]);

        let namerow = "Peso" + lote[0].Sexo + "_" + lote[0].CodLinea

        lote[0].nroaves = 0;
        lote[0].nroavesNac = 0;
        lote[0].promedio = 0;
        lote[0].nombregalpon = "G" + lote[0].Galpon + "/" + lote[0].lote;
        lote[0].aves = [];
        lote[0].avesNac = [];
        lote[0].promedioNac = 0;
        lote[0].nombregalponNac = "G" + lote[0].Galpon + "/" + lote[0].lote_str;

        let cons_sem = await db.query(`SELECT MAX(semana) as semana,  max(semanas.fecha_creacion) as fecha_creacion FROM semanas
        INNER JOIN corrales ON semanas.idcorral = corrales.id 
        WHERE corrales.idlote = ?`, [idLote])
        let maxsemana = 1;
        let fecha_creation
        if (cons_sem.length != 0) {
            maxsemana = cons_sem[0].semana;
            fecha_creation = cons_sem[0].fecha_creacion;
        }
        lote[0].fecha_creacion = fecha_creation
        let cons_sem_nac = await db.query(`SELECT MAX(semana) as semana FROM semanas
        WHERE idlote = ? and LENGTH(idcorral) < 10`, [idLote])
        let maxsemana_nac = 1;
        if (cons_sem_nac.length != 0) {
            console.log('cons_sem_nac :>> ', cons_sem_nac);
            maxsemana_nac = cons_sem_nac[0].semana;
        }

        let rows
        if (maxsemana > 24) {
            rows = await db.query(`SELECT * FROM standard_prod_hembra li
            INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod  WHERE li.Semana = ?`, [maxsemana]);
        } else {
            rows = await db.query("SELECT * FROM standard_levante WHERE Semana  = ? ", [maxsemana]);
        }

        let STD = rows[0][namerow];

        let corrales = await db.query(`SELECT * FROM corrales WHERE idLote = ?`, [idLote]);
        if (corrales.length != 0) {
            let suma = 0;
            let contador = 0;
            for (let i = 0; i < corrales.length; i++) {
                const c = corrales[i];
                let pesaje = await db.query(`SELECT detalle,aves FROM semanas 
                WHERE semana = ? and idcorral = ?`, [maxsemana, c.id]);
                if (pesaje.length != 0) {
                    pesaje[0].detalle = JSON.parse(pesaje[0].detalle)
                    for (let j = 0; j < pesaje[0].detalle.length; j++) {
                        const p = pesaje[0].detalle[j];
                        lote[0].aves.push(p);
                        suma = suma + p;
                        contador = contador + 1;
                    }
                    lote[0].nroaves = lote[0].nroaves + pesaje[0].aves;
                }
            }
            lote[0].promedio = suma / contador;
            lote[0].corrales = corrales;
            lote[0].maxsemana = maxsemana;
            lote[0].Dif_standard = ((lote[0].promedio - STD) / STD) * 100
            let valormas10 = (lote[0].promedio * 0.1) + lote[0].promedio;
            let valormenos10 = lote[0].promedio - (lote[0].promedio * 0.1);

            let sumaDS = 0;
            let conteo = 0;
            for (var x = 0; x < lote[0].aves.length; x++) {
                const p = lote[0].aves[x];
                let valor = Math.pow((p - lote[0].promedio), 2);
                sumaDS += valor;

                if (p <= valormas10 && p >= valormenos10) {
                    conteo = conteo + 1;
                }
            }
            lote[0].Uniformidad = (conteo / lote[0].aves.length) * 100;
            let DS = Math.sqrt(sumaDS / (lote[0].aves.length - 1));
            lote[0].Coef_de_var = (DS / lote[0].promedio) * 100;
        }

        let nacimientos = await db.query(`SELECT na.idNacimiento
        FROM nacimiento_det nd 
        INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [idLote]);
        if (nacimientos.length != 0) {
            let sumaNac = 0;
            let contadorNac = 0;
            for (let i = 0; i < nacimientos.length; i++) {
                const c = nacimientos[i];
                let pesaje = await db.query(`SELECT detalle,aves,promedio FROM semanas 
                WHERE semana = ? and idcorral = ?`, [maxsemana_nac, c.idNacimiento]);
                if (pesaje.length != 0) {
                    pesaje[0].detalle = JSON.parse(pesaje[0].detalle)
                    for (let j = 0; j < pesaje[0].detalle.length; j++) {
                        const p = pesaje[0].detalle[j];
                        lote[0].avesNac.push(p);
                    }
                    lote[0].nroavesNac = lote[0].nroavesNac + pesaje[0].aves;
                    sumaNac = sumaNac + pesaje[0].promedio;
                    contadorNac = contadorNac + 1;
                }
            }
            lote[0].promedioNac = sumaNac / contadorNac;
            if (sumaNac == 0 && contadorNac == 0) {
                lote[0].promedioNac = 0;
            }
            lote[0].nacimientos = nacimientos;
            lote[0].maxsemana_nac = maxsemana_nac;
            lote[0].Dif_standardNac = ((lote[0].promedioNac - 34) / 34) * 100
            let valormas10 = (lote[0].promedioNac * 0.1) + lote[0].promedioNac;
            let valormenos10 = lote[0].promedioNac - (lote[0].promedioNac * 0.1);

            let sumaDSNac = 0;
            let conteoNac = 0;
            for (var x = 0; x < lote[0].avesNac.length; x++) {
                const p = lote[0].avesNac[x];
                let valor = Math.pow((p - lote[0].promedioNac), 2);
                sumaDSNac += valor;

                if (p <= valormas10 && p >= valormenos10) {
                    conteoNac = conteoNac + 1;
                }
            }
            lote[0].UniformidadNac = (conteoNac / lote[0].avesNac.length) * 100;
            let DSNac = Math.sqrt(sumaDSNac / (lote[0].avesNac.length - 1));
            lote[0].Coef_de_varNac = (DSNac / lote[0].promedioNac) * 100;
        }

        console.log('lote :>> ', lote);

        return lote;
    },
    grafica: async function (idLote) {
        let lote = await db.query(`SELECT * FROM lotes lo
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE idLote = ?`, [idLote]);

        let namerow = "Peso" + lote[0].Sexo + "_" + lote[0].CodLinea

        lote[0].nroaves = 0;
        lote[0].promedio = 0;
        lote[0].nombregalpon = "G" + lote[0].Galpon + "/" + lote[0].lote;
        lote[0].nombregalponNac = "G" + lote[0].Galpon + "/" + lote[0].lote_str;
        lote[0].aves = [];

        let cons_sem = await db.query(`SELECT MAX(semana) as semana FROM semanas
        INNER JOIN corrales ON semanas.idcorral = corrales.id 
        WHERE corrales.idlote = ?`, [idLote])

        let maxsemana = 0;

        let rows = [];
        if (cons_sem.length != 0) {
            maxsemana = cons_sem[0].semana;
            for (let i = 0; i < maxsemana; i++) {
                const e = (i + 1);
                let rowsSTD
                if (e > 24) {
                    rowsSTD = await db.query(`SELECT * FROM standard_prod_hembra li
                    INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod  WHERE li.Semana = ?`, [e]);
                } else {
                    rowsSTD = await db.query("SELECT * FROM standard_levante WHERE Semana  = ? ", [e]);
                }

                let STD = rowsSTD[0][namerow];

                let cons_pes = await db.query(`SELECT * FROM semanas
                INNER JOIN corrales ON semanas.idcorral = corrales.id 
                WHERE corrales.idlote = ? and semanas.semana = ? `, [idLote, e]);
                let json = {
                    Semana: e,
                    Promedio: 0,
                    STD,
                    Coef_de_var: 0,
                    Uniformidad: 0,
                    Dif_standard: 0
                }
                if (cons_pes.length != 0) {
                    let aves = [];
                    let suma = 0;
                    for (let j = 0; j < cons_pes.length; j++) {
                        const pes = cons_pes[j];
                        pes.detalle = JSON.parse(pes.detalle);
                        for (let k = 0; k < pes.detalle.length; k++) {
                            const pd = pes.detalle[k];
                            suma = suma + pd;
                            aves.push(pd);
                        }
                    }

                    json.Promedio = suma / aves.length;

                    let valormas10 = (json.Promedio * 0.1) + json.Promedio;

                    let valormenos10 = json.Promedio - (json.Promedio * 0.1);

                    let sumaDS = 0;
                    let conteo = 0;
                    for (var x = 0; x < aves.length; x++) {
                        const p = aves[x];
                        let valor = Math.pow((p - json.Promedio), 2);
                        sumaDS += valor;

                        if (p <= valormas10 && p >= valormenos10) {
                            conteo = conteo + 1;
                        }
                    }
                    let DS = Math.sqrt(sumaDS / (aves.length - 1));

                    json.Dif_standard = ((json.Promedio - STD) / STD) * 100
                    json.Uniformidad = (conteo / aves.length) * 100;
                    json.Coef_de_var = (DS / json.Promedio) * 100;

                    json.Promedio = Number(json.Promedio.toFixed(3))
                }
                rows.push(json);
            }
        }

        let cons_semNac = await db.query(`SELECT CodCarga, semana, idcorral FROM semanas se
        INNER JOIN nacimiento na ON na.idNacimiento = se.idcorral
        WHERE se.idlote = ? and LENGTH(idcorral) < 10 ORDER BY semana`, [idLote])

        let rowsNac = [];
        if (cons_semNac.length != 0) {
            for (let i = 0; i < cons_semNac.length; i++) {
                const e = cons_semNac[i].semana;
                const w = cons_semNac[i].idcorral;

                let rowsSTD = await db.query(`SELECT * FROM standard_planta WHERE idStandard_Planta = 1`)
                let STD = 34;
                if (rowsSTD.length != 0) {
                    STD = rowsSTD[0].Valor
                }

                let cons_pes = await db.query(`SELECT * FROM semanas
                WHERE idlote = ? and idcorral = ?`, [idLote, w]);
                let json = {
                    Semana: e,
                    Promedio: 0,
                    STD,
                    Coef_de_var: 0,
                    Uniformidad: 0,
                    Dif_standard: 0,
                    Maximo: 0,
                    Minimo: 9999999999999999
                }
                if (cons_pes.length != 0) {
                    let aves = [];
                    let suma = 0;
                    for (let j = 0; j < cons_pes.length; j++) {
                        const pes = cons_pes[j];
                        pes.detalle = JSON.parse(pes.detalle);
                        for (let k = 0; k < pes.detalle.length; k++) {
                            const pd = pes.detalle[k];
                            suma = suma + pd;
                            if (pd > json.Maximo) {
                                json.Maximo = pd;
                            }

                            if (pd < json.Minimo) {
                                json.Minimo = pd;
                            }
                            aves.push(pd);
                        }
                    }

                    json.Promedio = suma / aves.length;

                    let valormas10 = (json.Promedio * 0.1) + json.Promedio;

                    let valormenos10 = json.Promedio - (json.Promedio * 0.1);

                    let sumaDS = 0;
                    let conteo = 0;
                    for (var x = 0; x < aves.length; x++) {
                        const p = aves[x];
                        let valor = Math.pow((p - json.Promedio), 2);
                        sumaDS += valor;

                        if (p <= valormas10 && p >= valormenos10) {
                            conteo = conteo + 1;
                        }
                    }
                    let DS = Math.sqrt(sumaDS / (aves.length - 1));

                    json.Dif_standard = ((json.Promedio - STD) / STD) * 100
                    json.Uniformidad = (conteo / aves.length) * 100;
                    json.Coef_de_var = (DS / json.Promedio) * 100;

                    json.Promedio = Number(json.Promedio.toFixed(3))
                }
                rowsNac.push(json);
            }
        }

        return {
            lote,
            rows,
            rowsNac
        };
    }
};
module.exports = Galpon;
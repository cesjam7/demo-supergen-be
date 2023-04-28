const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const proy_factorModel = require("./proyFactores");
const proyLoteDetalleModel = require("./proy_loteDetalle")
const proyLoteModel = require("./proy_lote");
const loteModel = require("./lotes")
const mortalidadModel = require("./mortalidad")
const produccionHuevosModel = require("./produccionHuevos")
const nacimientoModel = require("./nacimiento")
const proyDetalleLoteResumenModel = require("./proyDetalleLoteResumen");
const proyLoteDetalleYProyIngresoLoteModel = require("./proyLoteDetalleYProyIngresoLote")
const lineasProductivas = [
    { nombreLote: "L9", sexo: "H", tipoGenero: "LH", lineaHembra: true, propiedad: "poblacionLh" },
    { nombreLote: "L7", sexo: "M", tipoGenero: "LH", lineaHembra: false, propiedad: "" },
    { nombreLote: "L4", sexo: "H", tipoGenero: "LM", lineaHembra: true, propiedad: "poblacionLm" },
    { nombreLote: "L1", sexo: "M", tipoGenero: "LM", lineaHembra: false, propiedad: "" }]
const estadosIngresoLote = ["abierto", "cerrado", "proyectado"]
const proy_ingresoLotes = {

    guardar: async function (proyIngresoLote, usuarioId) {
        const connection = await mysql.connection();
        /**
         * PARA LOS PARAMETROS DE idLinea y lote_str de la tabla depende del tipo de genero:
         * LH FORMULA ultimoRegistroIngresoLotes.loteInicial + 2
         * LM FORMULA ultimoRegistroIngresoLotes.loteInicial + 3
         */
        try {
            const listaFactores = await proy_factorModel.listar();
            if (listaFactores.length == 0) {
                throw new Error("Debe registrar algun factor primero")
            }
            const ultimoRegistroIngresoLotes = await this.traerUltimoRegistroIngresoLote();
            await connection.query("START TRANSACTION");
            const ultimoFactor = listaFactores[0]
            const fechaIngresoLevante = moment(proyIngresoLote.fechaIngreso);
            const fechaIngresoProduccion = moment(fechaIngresoLevante).add(7 * proyIngresoLote.semanasLevante + 1, "days");
            const fechaFinProduccion = fechaIngresoProduccion.clone().subtract(1, "days").add(7 * proyIngresoLote.semanasProduccion, "days");
            const ultimoLoteInicial = ultimoRegistroIngresoLotes.numeroIngreso
            const ingresoLh = ultimoRegistroIngresoLotes.loteInicial === 0 ? ultimoRegistroIngresoLotes.loteInicial + 1 : ultimoRegistroIngresoLotes.loteInicial + 2;
            const proyLote = await connection.query("insert into proy_ingresolote(numeroIngreso,loteInicial,nombreIngreso,poblacionLh,poblacionLm,fecIngresoLevante,semanasLevante,fecIngresoProd,semanasProduccion,fecFinProd,factorMortLev,factorMortProdLh,factorMortProdLm,factorCastigo,fecReg,usuarioReg,fechaIngreso) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
                ultimoRegistroIngresoLotes.numeroIngreso + 1,
                ingresoLh,
                (ultimoLoteInicial + 1) + " ingreso LH-" + ingresoLh,
                proyIngresoLote.poblacionLh,
                proyIngresoLote.poblacionLm,
                fechaIngresoLevante.toDate(),
                proyIngresoLote.semanasLevante,
                fechaIngresoProduccion.toDate(),
                proyIngresoLote.semanasProduccion,
                fechaFinProduccion.toDate(),
                ultimoFactor.factormort_lev,
                ultimoFactor.factormort_prod_lh,
                ultimoFactor.factormort_prod_lm,
                ultimoFactor.factorcastigo,
                new Date(),
                usuarioId,
                proyIngresoLote.fechaIngreso
            ]);
            for (const linea of lineasProductivas) {
                await connection.query("insert into proy_lote(idLinea,lote,loteStr,tipoGenero,sexo,poblacionInicialLev,fecIngresoLevante,poblacionInicialProd,fecIngresoProd,fecFinProd,fecReg,usuarioReg,idProyIngresoLote) values(?,?,?,?,?,?,?,?,?,?,?,?,?)", [
                    linea.nombreLote,
                    `${linea.tipoGenero}${linea.tipoGenero == "LH" ? ingresoLh : ingresoLh + 1}-${linea.nombreLote}`,
                    `${linea.tipoGenero}${linea.tipoGenero == "LH" ? ingresoLh : ingresoLh + 1}`,
                    linea.tipoGenero,
                    linea.sexo,
                    (linea.lineaHembra && proyIngresoLote[linea.propiedad]) || 0,
                    fechaIngresoLevante.toDate(),
                    0,
                    fechaIngresoProduccion.toDate(),
                    fechaFinProduccion.toDate(),
                    new Date(),
                    usuarioId,
                    proyLote.insertId

                ])
            }
            await connection.query("COMMIT");
            return { numeroIngreso: ultimoRegistroIngresoLotes.numeroIngreso + 1 }
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

    },
    actualizacionGenerica: async function (props = {}, ingresoLoteId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            await connection.query("update  proy_ingresolote set " + Object.keys(props).map(key => key + "=? ").join() + " where idProyIngresoLote=? ", [...Object.values(props), ingresoLoteId]);
            await connection.query("COMMIT");

        } catch (error) {

            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },
    actualizarComparativos: async function (ingresoLoteId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const proyLotes = await proyLoteModel.getProyLoteByProyIngresoLote(["idLote", "lote", "idLinea", "loteStr", "poblacionInicialLev", "tipoGenero", "sexo"], ingresoLoteId, (data) => data.poblacionInicialLev > 0)
            const nombresLotes = proyLotes.map(lote => lote.lote)
            const lotes = await loteModel.getLotesPorNombre(["lote", "Num_Aves_Fin_Levante", "idLote", "Sexo", "TipoGenero", "FecEncaseta", "FechaIniProduccion", "FechaFinProduccion", "NumHembras"], nombresLotes)
            if (proyLotes.length != lotes.length) {
                throw new Error("Los lotes no existen");
            }
            const proyLoteDetallePorSemana = await this.listarProyLoteDetallePorIngresoLoteId(ingresoLoteId);
            let listaProyLoteResumenPorSemana = await proyDetalleLoteResumenModel.listarPorIngresoLote(ingresoLoteId);
            const listaMortalidadSemanalPorNombreLotes = await mortalidadModel.listarMortalidadPorNombreLote(["lo.idlote", "Semana", "saldo_fin_sem"], nombresLotes)
            const listaProduccionHuevosPorSemanal = await produccionHuevosModel.listarPorNombreLotes(["lo.idLote", "semana", "TotalHI", "PorHI", "Act_Avedia"], nombresLotes)
            const listaNacimientosSemanal = await nacimientoModel.listarPromedioNacimientoDetallePorNombresLote(nombresLotes)
            let listaLevantePorSemana = proyLoteDetallePorSemana.filter(loteDetalle => loteDetalle.tipo == "Levante")
            const numeroMaximoSemanaLevante = Math.max(...listaLevantePorSemana.map(lista => lista.semana));
            //console.log("mortalidad", listaMortalidadSemanalPorNombreLotes)
            let listaProduccionPorSemana = proyLoteDetallePorSemana.filter(loteDetalle => loteDetalle.tipo == "Produccion")
            for (let i = 0; i < proyLotes.length; i++) {
                const proyLoteActual = proyLotes[i]
                const { NumHembras = null, FecEncaseta = null, FechaIniProduccion = null } = await lotes.find(lote => lote.lote == proyLoteActual.lote) || {}
                await proyLoteModel.actualizacionGenerica({
                    poblacionInicialLevReal: NumHembras,
                    fecIngresoLevanteReal: FecEncaseta ? moment(FecEncaseta).format("YYYY-MM-DD") : null,
                    fecIngresoProdReal: FechaIniProduccion ? moment(FechaIniProduccion).format("YYYY-MM-DD") : null
                }, proyLoteActual.idLote)
            }
            const loteObject = lotes.reduce((prev, cur) => {
                prev["fechaIngresoReal"] = moment(cur.FecEncaseta).format("YYYY-MM-DD")
                prev["fecIngresoProdReal"] = moment(cur.FechaIniProduccion).format("YYYY-MM-DD")
                if (cur.TipoGenero == "LM") {
                    prev["poblacionLmReal"] = cur.NumHembras

                } else {
                    prev["poblacionLhReal"] = cur.NumHembras

                }
                return prev;
            }, {})
            listaLevantePorSemana = listaLevantePorSemana.map(levanteSemanal => {
                const lote = lotes.find(lote => lote.lote == levanteSemanal.lote)
                const { TotalHI = null, Act_Avedia = null, PorHI = null } = listaProduccionHuevosPorSemanal.find(produccionHuevo => produccionHuevo.semana == levanteSemanal.semana && produccionHuevo.lote == levanteSemanal.lote) || {}
                const { pollos1ra = null, porcNacidoReal = null } = listaNacimientosSemanal.find(nacimientoSemanal => nacimientoSemanal.edadGallina == levanteSemanal.semana && nacimientoSemanal.lote == levanteSemanal.lote) || {}
                let saldoAvesReal = null
                if (levanteSemanal.semana == 0) {
                    saldoAvesReal = lote.NumHembras
                } else if (levanteSemanal.semana == numeroMaximoSemanaLevante) {
                    saldoAvesReal = lote.Num_Aves_Fin_Levante
                }
                return { ...levanteSemanal, saldoAvesReal, saldoHiReal: TotalHI, porcentajePosturaReal: Act_Avedia, porcentajeHiReal: PorHI, saldoBbsReal: pollos1ra, porcentajeNacimientoReal: porcNacidoReal }
            })
            listaProyLoteResumenPorSemana = listaProyLoteResumenPorSemana.map(proyLoteSemanal => {
                const { TotalHI = null } = listaProduccionHuevosPorSemanal.find(produccionHuevo => produccionHuevo.semana == proyLoteSemanal.semana && produccionHuevo.lote == proyLoteSemanal.lote.lote) || {}
                const { pollos1ra = null } = listaNacimientosSemanal.find(nacimientoSemanal => nacimientoSemanal.edadGallina == proyLoteSemanal.semana && nacimientoSemanal.lote == proyLoteSemanal.lote.lote) || {}
                return { ...proyLoteSemanal, saldoBbsReal: pollos1ra, saldoHiReal: TotalHI }
            })
            listaProduccionPorSemana = listaProduccionPorSemana.map(produccionSemanal => {
                const { saldo_fin_sem = null } = listaMortalidadSemanalPorNombreLotes.find(mortalidadSemanal => mortalidadSemanal.lote == produccionSemanal.lote && mortalidadSemanal.Semana == produccionSemanal.semana) || {}
                const { TotalHI = null, Act_Avedia = null, PorHI = null } = listaProduccionHuevosPorSemanal.find(produccionHuevo => produccionHuevo.semana == produccionSemanal.semana && produccionHuevo.lote == produccionSemanal.lote) || {}
                const { pollos1ra = null, porcNacidoReal = null } = listaNacimientosSemanal.find(nacimientoSemanal => nacimientoSemanal.edadGallina == produccionSemanal.semana && nacimientoSemanal.lote == produccionSemanal.lote) || {}
                return { ...produccionSemanal, saldoAvesReal: saldo_fin_sem, saldoHiReal: TotalHI, porcentajePosturaReal: Act_Avedia, porcentajeHiReal: PorHI, saldoBbsReal: pollos1ra, porcentajeNacimientoReal: porcNacidoReal }
            })
            // console.log("produccion", listaProduccionPorSemana)
            await this.actualizacionGenerica({ ...loteObject }, ingresoLoteId)
            await proyLoteDetalleYProyIngresoLoteModel.actualizacionProyLoteDetalleCamposReal([...listaProduccionPorSemana, ...listaLevantePorSemana])
            await proyDetalleLoteResumenModel.actualizacionCamposReal(listaProyLoteResumenPorSemana)
            await connection.query("COMMIT");
            return await proyLoteDetalleYProyIngresoLoteModel.listarProyLoteDetallPorIngresoLoteId(ingresoLoteId)
        } catch (error) {
            console.error("err", error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },

    eliminar: async function () {

    },

    listarProyLoteDetallePorIngresoLoteId: async function (ingresoLoteId) {
        const connection = await mysql.connection();
        try {
            const listaProyIngresoLote = await connection.query("select loteDetalle.*,lote.idLinea,lote.lote,lote.loteStr,lote.tipoGenero,lote.sexo from proy_loteDetalle loteDetalle inner join proy_lote lote on lote.idLote=loteDetalle.idLote where loteDetalle.idProyIngresoLote=?", [ingresoLoteId]);
            return listaProyIngresoLote.map(lista => {
                return {
                    ...lista,
                    fechaMovimiento: moment(lista.fechaMovimiento).format("YYYY-MM-DD"),
                    tipo: lista.tipo,
                    semana: lista.semana,
                }
            })
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },
    actualizarEstado: async function (estado, ingresoLoteId) {
        const connection = await mysql.connection();
        try {
            await connection.query("update  proy_ingresolote set estado=? where idProyIngresoLote=? ", [estado, ingresoLoteId]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    traerPorId: async function (id) {
        const connection = await mysql.connection();
        try {
            const lote = (await connection.query("select * from proy_ingresolote here idProyIngresoLote=?", id));
            if (lote[0]) {
                throw new Error("No existe el ingreso lote");
            }
            return lote[0]
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    editar: async function (proyIngresoLote, usuarioReg) {
        const connection = await mysql.connection();
        /**
         * PARA LOS PARAMETROS DE idLinea y lote_str de la tabla depende del tipo de genero:
         * LH FORMULA ultimoRegistroIngresoLotes.loteInicial + 2
         * LM FORMULA ultimoRegistroIngresoLotes.loteInicial + 3
         */
        try {

            const proyIngresoLotesBD = (await connection.query("select * from proy_ingresolote where idProyIngresoLote=?", [proyIngresoLote.idProyIngresoLote]))[0];
            await connection.query("START TRANSACTION");

            const fechaIngresoProduccion = moment(proyIngresoLotesBD.fecIngresoLevante).add(7 * proyIngresoLote.semanasLevante + 1, "days");
            const fechaFinProduccion = moment(proyIngresoLotesBD.fecIngresoProd).add(7 * proyIngresoLote.semanasProduccion, "days");
            await connection.query("update proy_ingresolote set fecIngresoLevante=?, fecIngresoProd=?,fecFinProd=?,poblacionLh=?,poblacionLm=?,semanasLevante=?,semanasProduccion=? where  idProyIngresoLote=?", [
                proyIngresoLote.fechaIngreso,
                fechaIngresoProduccion.toDate(),
                fechaFinProduccion.toDate(),
                proyIngresoLote.poblacionLh,
                proyIngresoLote.poblacionLm,
                proyIngresoLote.semanasLevante,
                proyIngresoLote.semanasProduccion,
                proyIngresoLotesBD.idProyIngresoLote
            ])
            const lotes = await connection.query("select idLinea,idLote from proy_lote where idProyIngresoLote=? ", [proyIngresoLotesBD.idProyIngresoLote])
            for (const lote of lotes) {
                const lineaProductiva = lineasProductivas.find((linea) => linea.nombreLote == lote.idLinea);
                console.log("lote", lote, "valor", (lineaProductiva.lineaHembra && proyIngresoLote[lineaProductiva.propiedad]) || 0)
                await connection.query("update proy_lote set fecIngresoProd=? ,fecFinProd=?,poblacionInicialLev=? where idLote=?", [
                    fechaIngresoProduccion.toDate(),
                    fechaFinProduccion.toDate(),
                    (lineaProductiva.lineaHembra && proyIngresoLote[lineaProductiva.propiedad]) || 0,
                    lote.idLote
                ])
            }
            await connection.query("COMMIT");
        } catch (error) {
            console.error(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    listar: async function () {
        const connection = await mysql.connection();
        try {
            const rows = await connection.query("select *,DATE_FORMAT(proyIngreso.fecFinProd,'%Y-%m-%d') as fecFinProd,DATE_FORMAT(proyIngreso.fechaIngreso,'%Y-%m-%d') as fechaIngreso, DATE_FORMAT(proyIngreso.fecIngresoLevante,'%Y-%m-%d') as fecIngresoLevante,DATE_FORMAT(proyIngreso.fecIngresoProd,'%Y-%m-%d') as fecIngresoProd,DATE_FORMAT(proyIngreso.fecReg,'%Y-%m-%d') as fecReg,proyIngreso.estado from proy_ingresolote proyIngreso order by proyIngreso.numeroIngreso desc ");
            return rows.map((row) => ({ ...row, estadoNombre: estadosIngresoLote[row.estado] }))

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    traerPorId: async function (igresoProyId) {
        const connection = await mysql.connection();
        try {
            const proyIngresoLote = await connection.query("select *,DATE_FORMAT(proyIngreso.fecFinProd,'%Y-%m-%d') as fecFinProd,DATE_FORMAT(proyIngreso.fecIngresoLevante,'%Y-%m-%d') as fecIngresoLevante,DATE_FORMAT(proyIngreso.fecIngresoProd,'%Y-%m-%d') as fecIngresoProd,DATE_FORMAT(proyIngreso.fecReg,'%Y-%m-%d') as fecReg,proyIngreso.estado from proy_ingresolote proyIngreso where proyIngreso.idProyIngresoLote=?", [igresoProyId]);
            if (proyIngresoLote.length == 0) {
                throw new Error("Ingreso lote no encontrado")
            }
            return proyIngresoLote[0]
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    listarProyIngresoAbierto: async function () {
        const connection = await mysql.connection();
        try {
            const lista = await connection.query("select  * from proy_ingresolote where estado in(0,2)");
            return lista;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    traerUltimoRegistroIngresoLote: async function () {
        const connection = await mysql.connection();
        try {
            const ultimoRegistroIngresoLotes = await connection.query("select numeroIngreso,loteInicial,fecIngresoLevante,fecIngresoProd,fechaIngreso from proy_ingresolote order by idProyIngresoLote desc ");
            return ultimoRegistroIngresoLotes[0] || { numeroIngreso: 0, loteInicial: 0, fecIngresoLevante: moment(), fecIngresoProd: moment(), fechaIngreso: moment() }
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    listarLotesPorIngreso: async function (ingresoLoteId) {
        const connection = await mysql.connection();
        try {
            return await connection.query("select * from proy_lote where idProyIngresoLote=?", [ingresoLoteId]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    }
}
module.exports = proy_ingresoLotes;
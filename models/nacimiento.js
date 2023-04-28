var db = require('../dbconnection');
const nr = require('./nacimiento-reporte.js');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const produccionMortalidad = require('./produccionMortalidad');
var Nacimientos = {
    formatDate: function (params, params2, orden) {
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
        if (orden == 'normal') {
            hoy = dd + params2 + mm + params2 + yyyy;
        } else if (orden == 'reversa') {
            hoy = yyyy + params2 + mm + params2 + dd;
        }
        return hoy;
    },
    formatDateVerify: function (params) {
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
        hoy = yyyy + '-' + mm + '-' + dd;
        return hoy;
    },
    isNan_0: function (params) {
        if (isNaN(params)) {
            return 0;
        } else {
            return params;
        }
    },
    getAllCargos: async function () {
        return await db.query("SELECT * FROM cargas WHERE Estado != 2 ORDER BY Fecha_Transferencia DESC");
    },
    getCargosAll: async function () {
        return await db.query("SELECT * FROM cargas");
    },
    getAllNacimientos: async function () {
        return await db.query("SELECT * FROM nacimiento WHERE Estado = 0");
    },
    getAllNacimientos1: async function () {
        let _this = this;
        let rows = await db.query("SELECT * FROM nacimiento ORDER BY fechaNacimiento DESC");
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            e.cerrado = await produccionMortalidad.verifyPeriodo({ fecha: _this.formatDateVerify(e.fechaNacimiento) })
            if (e.cerrado == true) {
                e.style = {
                    "opacity": "0.8"
                }
            }
        }
        return rows;
    },
    selectMaxId: async function () {
        return await db.query("SELECT MAX(idNacimiento) as maxId FROM nacimiento");
    },
    addNacimiento: async function (Nacimiento) {
        function isNan_0(params) {
            if (isNaN(params)) {
                return 0;
            } else {
                return params;
            }
        }

        function getYear(params) {
            var hoy = new Date(params);
            var yyyy = hoy.getFullYear();
            return yyyy;
        }
        let variables = await db.query("SELECT * FROM `variables-planta` WHERE idVariable = 1")
        let variablePerdidaPeso = variables[0].Valor;
        let carga = await db.query("SELECT * FROM cargas WHERE idCargas = ?", [Nacimiento.idCarga])
        let Cliente = carga[0].Cliente;
        let RUC = carga[0].RUC;
        let Cliente2 = carga[0].Cliente2;
        let RUC2 = carga[0].RUC2;
        let Fecha_Carga = carga[0].Fecha_Carga;
        let CodCarga = carga[0].CodCarga;
        let Fecha_Transferencia = getYear(carga[0].Fecha_Transferencia);
        let Pedido_Hembras = carga[0].Pedido_Hembras;
        let Pedido_Machos = carga[0].Pedido_Machos;
        let rows = await db.query(`INSERT INTO nacimiento (idCarga, CodCarga, fechaNacimiento, Cliente, RUC, 
        Cliente2, RUC2, fechaCarga, Pedido_Hembras, Pedido_Machos) VALUES (?,?,?,?,?,?,?,?,?,?)`, [Nacimiento.idCarga,
        Fecha_Transferencia + "-" + CodCarga, new Date(Nacimiento.fecNac), Cliente, RUC, Cliente2, RUC2,
        new Date(Fecha_Carga), Pedido_Hembras, Pedido_Machos])

        Nacimiento.Cliente = Cliente;
        Nacimiento.RUC = RUC;
        Nacimiento.Cliente2 = Cliente2;
        Nacimiento.RUC2 = RUC2;
        Nacimiento.fecCarga = Fecha_Carga;
        Nacimiento.idNac = rows.insertId;
        for (let i = 0; i < Nacimiento.detalle.length; i++) {
            const c = Nacimiento.detalle[i];
            let machosEstim = c.sinSexar * 0.52;
            let porcMACBBS1ra = ((c.machosVenta) / (c.machosVenta + c.subProdReal + c.sinSexar)) * 100;
            let subProdEstim = c.sinSexar * 0.48;
            let porcSPBBS1ra = ((c.subProdReal) / (c.machosVenta + c.subProdReal + c.sinSexar)) * 100;
            let porcSSBBS1ra = ((c.sinSexar) / (c.machosVenta + c.subProdReal + c.sinSexar)) * 100;
            let pollos1ra = (c.carneNoVendida + c.machosVenta + c.subProdReal + c.sinSexar + c.Otros);
            let porc1ra = (pollos1ra / c.Total) * 100;
            let porcDescarte = (c.descartes / c.Total) * 100;
            let totalNacidos = (c.carneNoVendida + c.machosVenta + c.subProdReal + c.sinSexar + c.Otros + c.descartes);
            let porcMacHI = ((c.machosVenta + machosEstim + c.carneNoVendida) / c.Total) * 100;
            let noVendidos = c.sinSexar * 0.48;
            let porcPerdidaPeso_ = (c.porcPerdidaPeso * 18) / variablePerdidaPeso;
            let porcHB = (c.HB / c.Total) * 100;
            let totalME = c.infertilidad + c.ME1ra + c.ME2da + c.ME3ra + c.pipVivo + c.pipMuerto + c.ContaBact + c.ContaHongos + c.rotos;
            let porcInfertilidad = (c.infertilidad * ((c.Total - totalNacidos) / c.Total) / totalME) * 100;
            let porcFertilidad = 100 - porcInfertilidad;
            let porcME1ra = (c.ME1ra * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcME2da = (c.ME2da * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcME3ra = (c.ME3ra * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcpipVivo = (c.pipVivo * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcpipMuerto = (c.pipMuerto * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcContaBact = (c.ContaBact * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcContaHongos = (c.ContaHongos * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcRotos = (c.rotos * ((c.Total - totalNacidos) / c.Total) / totalME) * 100
            let porcTotalME = porcME1ra + porcME2da + porcME3ra + porcpipVivo + porcpipMuerto + porcContaBact + porcContaHongos + porcRotos;
            let porcNacFert = (totalNacidos / (c.Total * (porcFertilidad / 100)) * 100);

            let sal = await db.query("SELECT Num_Aves_Fin_Levante FROM lotes WHERE idLote = ?", [c.Lote])
            let NAFL = sal[0].Num_Aves_Fin_Levante;

            let rpta = await db.query("SELECT Edad FROM nacimiento_det WHERE idLote = ? ORDER by Edad desc LIMIT 1", [c.Lote])
            let Edad
            let BBSVendSem = (c.machosVenta + machosEstim + c.carneNoVendida) / NAFL

            BBSVendSem = BBSVendSem + c.BBSVendTerc;

            let BBSVendAcu
            if (typeof rpta[0] == "undefined") {
                Edad = 1;
                BBSVendAcu = BBSVendSem;
            } else {
                Edad = rpta[0].Edad + 1;
                let BSS = await db.query("SELECT BBsVendAcu FROM nacimiento_det WHERE idLote = ? and Edad = ?", [c.Lote, rpta[0].Edad])
                BBSVendAcu = BBSVendSem + BSS[0].BBsVendAcu
            }

            let rows2 = await db.query("SELECT cr.Fecha_Carga, cr.Semana, lo.TipoGenero FROM cargas_resumen cr INNER JOIN lotes lo ON lo.idLote = cr.Lote WHERE cr.idCargas = ? and cr.Lote = ?", [Nacimiento.idCarga, c.Lote]);

            let Fecha_Carga = rows2[0].Fecha_Carga;
            let Semana = rows2[0].Semana
            let TipoGenero = rows2[0].TipoGenero;
            let query2
            let porcNacSTD

            if (TipoGenero == "LH") {
                query2 = await db.query("SELECT * FROM standard_prod_hembra WHERE Semana = ?", [parseInt(Semana)]);
                if (typeof query2[0] != "undefined") {
                    porcNacSTD = query2[0].Porc_Nacim_total;
                } else {
                    porcNacSTD = 0;
                }
            } else {
                query2 = await db.query("SELECT * FROM standard_prod_macho WHERE Semana = ?", [parseInt(Semana)]);
                if (typeof query2[0] != "undefined") {
                    porcNacSTD = query2[0].Porc_Nacim;
                } else {
                    porcNacSTD = 0;
                }
            }

            let porcNacReal = (totalNacidos / c.Total) * 100;
            let difRS = porcNacReal - porcNacSTD;

            if (c.Lote == 70 || c.Lote == 71) {
                BBSVendSem = 0;
                BBSVendAcu = 0;
            }

            let query = `INSERT INTO nacimiento_det (Edad, idNacimiento, idLote, CodigoLote, fechaCarga, fechaNacimiento, 
                        edadGallina, edadHI, HI, Ventas, Estimadas, porcBBS1ra, subProductoReal, 
                        subProductoEstimado, porcSPBBS1ra, sinSexar, Otros, porcSSBBS1ra, pollos1ra, porc1ra,
                        descartes, porcDescartes, totalNacidos, porcNacidoReal, porcNacidoSTD, 
                        diferenciaRS, porcHEHI, noVendidos, BBsVendSem, BBsVendAcu, porcNacFertiles, 
                        porcPerdidaPeso_, porcPerdidaPeso, porcRdtoPolloBB, porcHB, porcInfertilidad, 
                        porcFertilidad, porcME1ra, porcME2da, porcME3ra, porcPipVivo, porcPipMuerto, 
                        porcContaBact, porcContaHongos, porcRotos, porcTotalME, HB, infertilidad, ME1ra, 
                        ME2da, ME3ra, pipVivo, pipMuerto, ContaBact, ContaHongos, Rotos, TotalME, Saca,
                        Recuperacion, Sexado, Vacunacion, Desunado, BBSVendTerc, CantTercero,carneNoVendida) 
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
                        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
            console.log("proce", isNan_0(pollos1ra))
            await db.query(query, [Edad, Nacimiento.idNac, c.Lote, c.CodigoLote, Fecha_Carga, new Date(Nacimiento.fecNac),
                Semana, c.DiasAlm, c.Total, c.machosVenta, isNan_0(machosEstim), isNan_0(porcMACBBS1ra), c.subProdReal,
                isNan_0(subProdEstim), isNan_0(porcSPBBS1ra), c.sinSexar, c.Otros, isNan_0(porcSSBBS1ra), isNan_0(pollos1ra),
                isNan_0(porc1ra), c.descartes, isNan_0(porcDescarte), isNan_0(totalNacidos), isNan_0(porcNacReal),
                isNan_0(porcNacSTD), isNan_0(difRS), isNan_0(porcMacHI), isNan_0(noVendidos), isNan_0(BBSVendSem),
                isNan_0(BBSVendAcu), isNan_0(porcNacFert), isNan_0(porcPerdidaPeso_), c.porcPerdidaPeso, c.porcRendPolloBB,
                isNan_0(porcHB), isNan_0(porcInfertilidad), isNan_0(porcFertilidad), isNan_0(porcME1ra), isNan_0(porcME2da),
                isNan_0(porcME3ra), isNan_0(porcpipVivo), isNan_0(porcpipMuerto), isNan_0(porcContaBact),
                isNan_0(porcContaHongos), isNan_0(porcRotos), isNan_0(porcTotalME), c.HB, c.infertilidad, c.ME1ra, c.ME2da,
                c.ME3ra, c.pipVivo, c.pipMuerto, c.ContaBact, c.ContaHongos, c.rotos, totalME, c.saca, c.recuperacion,
                c.sexado, c.vacunacion, c.desunado, c.BBSVendTerc, c.CantTercero, c.carneNoVendida])
        }

        await db.query("UPDATE cargas SET Estado = '2' WHERE idCargas = ?", [Nacimiento.idCarga]);

        let json = {
            success: true,
            message: 'Se registró correctamente.'
        }
        return json;
    },
    cerrarNacimiento: async function (data) {
        let json = {}
        try {
            let dataNac = await db.query(`SELECT * FROM nacimiento WHERE idNacimiento = ?`, [data.idNac]);

            let dataNacDet = await db.query(`SELECT * FROM nacimiento_det WHERE idNacimiento = ?`, [data.idNac]);

            let Nacimiento = dataNac[0];
            Nacimiento.detalle = dataNacDet;

            let smi = await nr.selectMaxId();
            Nacimiento.idNacRep = (smi[0].maxId + 1);
            Nacimiento.idNac = Nacimiento.idNacimiento;
            Nacimiento.fecNac = Nacimiento.fechaNacimiento;
            Nacimiento.fecCarga = Nacimiento.fechaCarga;

            await nr.addNacimientoReporte(Nacimiento);

            for (let j = 0; j < dataNacDet.length; j++) {
                const e = dataNacDet[j];
                e.SexadoProd = e.Ventas + e.Otros;
                e.DesmedroSubProd = e.subProductoReal + e.sinSexar + e.Otros;
                await db.query(`UPDATE nacimiento_det SET 
                SexadoProd = ?, SexadoSubProd = ?, 
                DesmedroSubProd = ?, DesmedroDescarte = ? 
                WHERE idDetalleNacimiento = ?`, [e.SexadoProd, e.subProductoReal,
                e.DesmedroSubProd, e.descartes,
                e.idDetalleNacimiento
                ])
            }

            json = {
                success: true,
                message: 'Se registró correctamente.'
            }
        } catch (error) {
            console.log('/nacimiento/cerrarNacimiento :>> ', error);
            json = {
                success: false,
                message: 'Sucedió un error.'
            }
        }
        return json;
    },
    updateNacimiento: async function (Nacimiento) {
        function formatDate(params) {
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
            hoy = yyyy + '-' + mm + '-' + dd;
            return hoy;
        }

        function isNan_0(params) {
            if (isNaN(params)) {
                return 0;
            } else {
                return params;
            }
        }
        await db.query("DELETE FROM nacimiento_det WHERE idNacimiento = ?", [Nacimiento.idNac]);
        let variables = await db.query("SELECT * FROM `variables-planta` WHERE idVariable = 1")
        let variablePerdidaPeso = variables[0].Valor;

        for (let i = 0; i < Nacimiento.detalle.length; i++) {
            const c = Nacimiento.detalle[i];
            console.log("nacimiento", c.carneNoVendida, c.Ventas, c.subProductoReal, c.sinSexar, c.Otros)
            let machosEstim = c.sinSexar * 0.52;
            let porcMACBBS1ra = ((c.Ventas) / (c.Ventas + c.subProductoReal + c.sinSexar)) * 100;
            let subProdEstim = c.sinSexar * 0.48;
            let porcSPBBS1ra = ((c.subProductoReal) / (c.Ventas + c.subProductoReal + c.sinSexar)) * 100;
            let porcSSBBS1ra = ((c.sinSexar) / (c.Ventas + c.subProductoReal + c.sinSexar)) * 100;
            let pollos1ra = (c.carneNoVendida + c.Ventas + c.subProductoReal + c.sinSexar + c.Otros);
            let porc1ra = (pollos1ra / c.HI) * 100;
            let porcDescarte = (c.descartes / c.HI) * 100;
            let totalNacidos = (c.carneNoVendida + c.Ventas + c.subProductoReal + c.sinSexar + c.Otros + c.descartes);
            let porcMacHI = ((c.Ventas + machosEstim + c.carneNoVendida) / c.HI) * 100;
            let noVendidos = c.sinSexar * 0.48;
            let porcPerdidaPeso_ = (c.porcPerdidaPeso * 18) / variablePerdidaPeso;
            let porcHB = (c.HB / c.HI) * 100;
            let totalME = c.infertilidad + c.ME1ra + c.ME2da + c.ME3ra + c.pipVivo + c.pipMuerto + c.ContaBact + c.ContaHongos + c.Rotos;
            let porcInfertilidad = (c.infertilidad * ((c.HI - totalNacidos) / c.HI) / totalME) * 100;
            let porcFertilidad = 100 - porcInfertilidad;
            let porcME1ra = (c.ME1ra * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcME2da = (c.ME2da * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcME3ra = (c.ME3ra * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcpipVivo = (c.pipVivo * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcpipMuerto = (c.pipMuerto * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcContaBact = (c.ContaBact * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcContaHongos = (c.ContaHongos * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcRotos = (c.Rotos * ((c.HI - totalNacidos) / c.HI) / totalME) * 100
            let porcTotalME = porcME1ra + porcME2da + porcME3ra + porcpipVivo + porcpipMuerto + porcContaBact + porcContaHongos + porcRotos;
            let porcNacFert = (totalNacidos / (c.HI * (porcFertilidad / 100)) * 100);


            let sal = await db.query("SELECT Num_Aves_Fin_Levante FROM lotes WHERE idLote = ?", [c.idLote])
            let NAFL = sal[0].Num_Aves_Fin_Levante;

            let nac = await db.query("SELECT idCarga FROM supergen.nacimiento where idNacimiento = ?", [Nacimiento.idNac]);
            let idCargass = nac[0].idCarga

            let rows2 = await db.query("SELECT cr.Fecha_Carga, cr.Semana, lo.TipoGenero FROM cargas_resumen cr INNER JOIN lotes lo ON lo.idLote = cr.Lote WHERE cr.idCargas = ? and cr.Lote = ?", [idCargass, c.idLote]);

            let Fecha_Carga = rows2[0].Fecha_Carga;
            let Semana = rows2[0].Semana
            let TipoGenero = rows2[0].TipoGenero;

            let Edad = c.Edad
            let BBSVendSem = (c.Ventas + machosEstim + c.carneNoVendida) / NAFL

            BBSVendSem = BBSVendSem + c.BBSVendTerc;

            let BBSVendAcu
            if (Edad == 1) {
                BBSVendAcu = BBSVendSem;
            } else {
                let BSS = await db.query("SELECT BBsVendAcu FROM nacimiento_det WHERE idLote = ? and Edad = ?", [c.idLote, (Edad - 1)])
                if (BSS.length != 0) {
                    BBSVendAcu = BBSVendSem + BSS[0].BBsVendAcu
                } else {
                    BBSVendAcu = BBSVendSem
                }
            }
            let query2
            let porcNacSTD

            if (TipoGenero == "LH") {
                query2 = await db.query("SELECT * FROM standard_prod_hembra WHERE Semana = ?", [parseInt(Semana)]);
                if (typeof query2[0] != "undefined") {
                    porcNacSTD = query2[0].Porc_Nacim_total;
                } else {
                    porcNacSTD = 0;
                }
            } else {
                query2 = await db.query("SELECT * FROM standard_prod_macho WHERE Semana = ?", [parseInt(Semana)]);
                if (typeof query2[0] != "undefined") {
                    porcNacSTD = query2[0].Porc_Nacim;
                } else {
                    porcNacSTD = 0;
                }
            }

            let porcNacReal = (totalNacidos / c.HI) * 100;
            let difRS = porcNacReal - porcNacSTD;

            if (c.idLote == 70 || c.idLote == 71) {
                BBSVendSem = 0;
                BBSVendAcu = 0;
            }

            let query = `INSERT INTO nacimiento_det (CodigoLote, Edad, idNacimiento, idLote, fechaCarga, fechaNacimiento, 
                        edadGallina, edadHI, HI, Ventas, Estimadas, porcBBS1ra, subProductoReal, 
                        subProductoEstimado, porcSPBBS1ra, sinSexar, Otros, porcSSBBS1ra, pollos1ra, porc1ra,
                        descartes, porcDescartes, totalNacidos, porcNacidoReal, porcNacidoSTD, 
                        diferenciaRS, porcHEHI, noVendidos, BBsVendSem, BBsVendAcu, porcNacFertiles, 
                        porcPerdidaPeso_, porcPerdidaPeso, porcRdtoPolloBB, porcHB, porcInfertilidad, 
                        porcFertilidad, porcME1ra, porcME2da, porcME3ra, porcPipVivo, porcPipMuerto, 
                        porcContaBact, porcContaHongos, porcRotos, porcTotalME, HB, infertilidad, ME1ra, 
                        ME2da, ME3ra, pipVivo, pipMuerto, ContaBact, ContaHongos, Rotos, TotalME, Saca, 
                        Recuperacion, Sexado, Vacunacion, Desunado, BBSVendTerc,CantTercero,carneNoVendida) 
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
                        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
            console.log("proc", pollos1ra, isNan_0(pollos1ra))
            await db.query(query, [c.CodigoLote, Edad, Nacimiento.idNac, c.idLote, Fecha_Carga, new Date(Nacimiento.fecNac),
            c.edadGallina, c.edadHI, c.HI, c.Ventas, isNan_0(machosEstim), isNan_0(porcMACBBS1ra),
            c.subProductoReal, isNan_0(subProdEstim), isNan_0(porcSPBBS1ra), c.sinSexar, c.Otros, isNan_0(porcSSBBS1ra),
            isNan_0(pollos1ra), isNan_0(porc1ra), c.descartes, isNan_0(porcDescarte), isNan_0(totalNacidos),
            isNan_0(porcNacReal), isNan_0(porcNacSTD), isNan_0(difRS), isNan_0(porcMacHI), isNan_0(noVendidos),
            isNan_0(BBSVendSem), isNan_0(BBSVendAcu), isNan_0(porcNacFert), isNan_0(porcPerdidaPeso_),
            c.porcPerdidaPeso, c.porcRdtoPolloBB, isNan_0(porcHB), isNan_0(porcInfertilidad),
            isNan_0(porcFertilidad), isNan_0(porcME1ra), isNan_0(porcME2da), isNan_0(porcME3ra),
            isNan_0(porcpipVivo), isNan_0(porcpipMuerto), isNan_0(porcContaBact), isNan_0(porcContaHongos),
            isNan_0(porcRotos), isNan_0(porcTotalME), c.HB, c.infertilidad, c.ME1ra, c.ME2da, c.ME3ra,
            c.pipVivo, c.pipMuerto, c.ContaBact, c.ContaHongos, c.Rotos, isNan_0(totalME), c.Saca,
            c.Recuperacion, c.Sexado, c.Vacunacion, c.Desunado, c.BBSVendTerc, c.CantTercero, c.carneNoVendida
            ])
        }

        let json = {
            success: true,
            message: 'Se registró correctamente.'
        }
        return json;
    },
    getNacimientoById: async function (idLote) {
        return await db.query(`SELECT * 
        FROM nacimiento_det nd 
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE nd.idLote = ? order by fechaNacimiento`, [idLote]);
    },
    getNacimientoCabeceraById: async function (idLote) {
        let rows = await db.query(`SELECT * 
        FROM nacimiento_det nd 
        INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [idLote]);

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            let sem = await db.query(`SELECT * FROM semanas se
            WHERE se.idcorral = '${r.idNacimiento}' and se.idlote = ${idLote}`);
            r.cantidad_semanas = sem.length
        }

        return rows;
    },
    getNacimientoByIdNac: async function (idNacimiento) {
        let cabecera = await db.query(`SELECT * FROM nacimiento WHERE idNacimiento = ?`, [idNacimiento]);
        let detalle = await db.query(`SELECT * FROM nacimiento_det nd 
        INNER JOIN lotes lo on lo.idLote = nd.idLote 
        WHERE nd.idNacimiento = ?
        ORDER BY lo.lote_str`, [idNacimiento]);
        let json = {
            cabecera,
            detalle
        }
        return json;
    },
    graficos: async function (idLote) {
        return await db.query(`SELECT B.idCarga,C.DiasAlm,  A.* 
        FROM nacimiento_det A left join nacimiento B on B.idNacimiento=A.idNacimiento
        left join cargas_resumen C on C.idCargas=B.idCarga and C.Lote=A.idLote and C.Semana= A.edadGallina
        WHERE A.idLote = ? ORDER BY A.edadGallina, A.Edad`, [idLote]);
    },
    graficosHuevosBombaDeLotes: async function (lotesIds = []) {
        const data = []
        const semanas = await db.query(`SELECT distinct A.edadGallina
        FROM nacimiento_det A WHERE A.idLote  in(?) order by A.edadGallina`, [lotesIds]);
        const lotes = await db.query(`SELECT AVG(A.porcContaBact) porcHB,A.idLote,A.CodigoLote,A.edadGallina
        FROM nacimiento_det A left join nacimiento B on B.idNacimiento=A.idNacimiento
        left join cargas_resumen C on C.idCargas=B.idCarga and C.Lote=A.idLote and C.Semana= A.edadGallina
        WHERE A.idLote  in(?)  GROUP BY A.edadGallina,A.idLote,A.CodigoLote ORDER BY A.edadGallina,A.idLote asc `, [lotesIds]);
        for (const idLote of lotesIds) {
            const dataFiltrada = lotes.filter(l => l.idLote == idLote).sort((a, b) => a.edadGallina - b.edadGallina)
            const dataP = []
            const name = lotes.find(l => l.idLote == idLote).CodigoLote
            for (const semana of semanas) {
                const { porcHB = null } = dataFiltrada.find(a => a.edadGallina == semana.edadGallina) || {}
                dataP.push(porcHB)
            }
            data.push({ name, data: [...dataP] })
        }
        return { semanas: semanas.map(a => a.edadGallina), data }

    },
    graficosAll: async function (Lotes) {
        if (Lotes.length != 0) {
            let rows = await db.query(`SELECT idLote, 
            ROUND(SUM(porcNacidoReal)/count(porcNacidoReal), 2) as porcNacidoReal, 
            ROUND(SUM(porcFertilidad)/count(porcFertilidad), 2) as porcFertilidad, 
            ROUND(SUM(porcTotalME)/count(porcTotalME), 2) as porcTotalME, 
            ROUND(SUM(BBsVendAcu)/count(BBsVendAcu), 2) as BBsVendAcu, edadGallina 
            FROM nacimiento_det 
            WHERE idLote IN (${Lotes.join()}) 
            GROUP BY idLote, edadGallina ORDER BY edadGallina`)
                .catch((err) => {
                    console.log(err);
                });
            return rows
        }
    },
    updatebbsvendacum: async function (idLote) {
        let rows = await db.query(`SELECT * FROM nacimiento_det 
        WHERE idLote = ?
        ORDER BY fechaNacimiento`, [idLote])
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            let BBsVendSem = e.BBsVendSem;
            let Edad = (i + 1);
            let BBsVendAcu
            if (i == 0) {
                BBsVendAcu = e.BBsVendSem + e.BBSVendTerc;
            } else {
                const e_ant = rows[i - 1];
                let rows_ant = await db.query(`SELECT * FROM nacimiento_det 
                WHERE idDetalleNacimiento = ?
                ORDER BY fechaNacimiento`, [e_ant.idDetalleNacimiento])
                let bb_ant = 0
                if (rows_ant.length != 0) {
                    bb_ant = rows_ant[0].BBsVendAcu;
                }
                BBsVendAcu = BBsVendSem + e.BBSVendTerc + bb_ant;
            }
            await db.query(`UPDATE nacimiento_det SET 
            Edad = ?, BBsVendSem = ?, BBsVendAcu = ? 
            WHERE idDetalleNacimiento = ?`, [Edad, BBsVendSem, BBsVendAcu, e.idDetalleNacimiento]);
        }
        return {
            success: true,
            message: 'Se corrigieron los datos correctamente.'
        }
    },
    updateSD: async function (Data) {
        try {
            await db.query(`UPDATE nacimiento SET
            fecDesmedro = ? WHERE idNacimiento = ?`,
                [new Date(Data.Cabecera.fecDesmedro), Data.Cabecera.idNacimiento])
            for (let i = 0; i < Data.Detalle.length; i++) {
                const e = Data.Detalle[i];
                await db.query(`UPDATE nacimiento_det SET 
                SexadoProd = ?, SexadoSubProd = ?, 
                DesmedroSubProd = ?, DesmedroDescarte = ? ,carneNoVendida=? 
                WHERE idDetalleNacimiento = ?`, [e.SexadoProd, e.SexadoSubProd,
                e.DesmedroSubProd, e.DesmedroDescarte, e.carneNoVendida,
                e.idDetalleNacimiento
                ])
            }
            return {
                success: true,
                message: "Se actualizó correctamente."
            }
        } catch (e) {
            console.log('e :>> ', e);
            return {
                success: false,
                message: "Ocurrió un error."
            }
        }
    },
    getnacimientos: async function (N) {
        let rows = await db.query(`SELECT * FROM nacimiento_det WHERE fechaNacimiento BETWEEN '${N.FechaInicio}' AND '${N.FechaFin}' ORDER BY CodigoLote,fechaNacimiento`)
        if (rows.length == 0) {
            return {
                success: false,
                message: 'No existen Nacimientos con el rango de Fechas especificadas'
            }
        }
        return {
            success: true,
            Nacimientos: rows
        }
    },
    reqnacimientos: async function (N) {
        let _this = this;
        try {
            let tableData = [];
            let rows = await db.query(`SELECT * FROM nacimiento WHERE fechaNacimiento BETWEEN ? and ?`,
                [N.FechaInicio, N.FechaFin])
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                let TotalLM = {
                    HI: 0,
                    Ventas: 0,
                    Estimadas: 0,
                    subProductoReal: 0,
                    sinSexar: 0,
                    Otros: 0,
                    pollos1ra: 0,
                    porc1ra: 0,
                    Saca: 0,
                    Recuperacion: 0,
                    Sexado: 0,
                    Vacunacion: 0,
                    Desunado: 0,
                    descartes: 0,
                    porcDescartes: 0,
                    totalNacidos: 0,
                    porcNacidoReal: 0
                }
                let TotalLH = {
                    HI: 0,
                    Ventas: 0,
                    Estimadas: 0,
                    subProductoReal: 0,
                    sinSexar: 0,
                    Otros: 0,
                    pollos1ra: 0,
                    porc1ra: 0,
                    Saca: 0,
                    Recuperacion: 0,
                    Sexado: 0,
                    Vacunacion: 0,
                    Desunado: 0,
                    descartes: 0,
                    porcDescartes: 0,
                    totalNacidos: 0,
                    porcNacidoReal: 0
                }
                let rows_det = await db.query(`SELECT * FROM nacimiento_det na 
                INNER JOIN lotes lo ON lo.idLote = na.idLote WHERE na.idNacimiento = ?`,
                    [r.idNacimiento])
                for (let j = 0; j < rows_det.length; j++) {
                    const rd = rows_det[j];
                    if (rd.TipoGenero == "LH") {
                        TotalLH.HI = TotalLH.HI + rd.HI;
                        TotalLH.Ventas = TotalLH.Ventas + rd.Ventas;
                        TotalLH.Estimadas = TotalLH.Estimadas + rd.Estimadas;
                        TotalLH.subProductoReal = TotalLH.subProductoReal + rd.subProductoReal;
                        TotalLH.sinSexar = TotalLH.sinSexar + rd.sinSexar;
                        TotalLH.Otros = TotalLH.Otros + rd.Otros;
                        TotalLH.pollos1ra = TotalLH.pollos1ra + rd.pollos1ra;
                        TotalLH.porc1ra = TotalLH.porc1ra + rd.porc1ra;
                        TotalLH.Saca = TotalLH.Saca + rd.Saca;
                        TotalLH.Recuperacion = TotalLH.Recuperacion + rd.Recuperacion;
                        TotalLH.Sexado = TotalLH.Sexado + rd.Sexado;
                        TotalLH.Vacunacion = TotalLH.Vacunacion + rd.Vacunacion;
                        TotalLH.Desunado = TotalLH.Desunado + rd.Desunado;
                        TotalLH.descartes = TotalLH.descartes + rd.descartes;
                        TotalLH.porcDescartes = TotalLH.porcDescartes + rd.porcDescartes;
                        TotalLH.totalNacidos = TotalLH.totalNacidos + rd.totalNacidos;
                        TotalLH.porcNacidoReal = TotalLH.porcNacidoReal + rd.porcNacidoReal;
                    } else {
                        TotalLM.HI = TotalLM.HI + rd.HI;
                        TotalLM.Ventas = TotalLM.Ventas + rd.Ventas;
                        TotalLM.Estimadas = TotalLM.Estimadas + rd.Estimadas;
                        TotalLM.subProductoReal = TotalLM.subProductoReal + rd.subProductoReal;
                        TotalLM.sinSexar = TotalLM.sinSexar + rd.sinSexar;
                        TotalLM.Otros = TotalLM.Otros + rd.Otros;
                        TotalLM.pollos1ra = TotalLM.pollos1ra + rd.pollos1ra;
                        TotalLM.porc1ra = TotalLM.porc1ra + rd.porc1ra;
                        TotalLM.Saca = TotalLM.Saca + rd.Saca;
                        TotalLM.Recuperacion = TotalLM.Recuperacion + rd.Recuperacion;
                        TotalLM.Sexado = TotalLM.Sexado + rd.Sexado;
                        TotalLM.Vacunacion = TotalLM.Vacunacion + rd.Vacunacion;
                        TotalLM.Desunado = TotalLM.Desunado + rd.Desunado;
                        TotalLM.descartes = TotalLM.descartes + rd.descartes;
                        TotalLM.porcDescartes = TotalLM.porcDescartes + rd.porcDescartes;
                        TotalLM.totalNacidos = TotalLM.totalNacidos + rd.totalNacidos;
                        TotalLM.porcNacidoReal = TotalLM.porcNacidoReal + rd.porcNacidoReal;
                    }
                }
                let numeros = [];
                //TOTAL LH
                numeros.push(TotalLH.Ventas)
                numeros.push(TotalLH.subProductoReal)
                numeros.push(TotalLH.sinSexar)
                numeros.push(TotalLH.descartes)
                numeros.push(TotalLH.subProductoReal + TotalLH.sinSexar + TotalLH.descartes)
                numeros.push(_this.isNan_0(TotalLH.Ventas / (TotalLH.Ventas + TotalLH.subProductoReal) * 100))
                numeros.push(_this.isNan_0(TotalLH.subProductoReal / (TotalLH.Ventas + TotalLH.subProductoReal) * 100))
                numeros.push(_this.isNan_0(TotalLH.sinSexar / (TotalLH.Ventas + TotalLH.subProductoReal) * 100))
                numeros.push(Math.ceil(TotalLH.sinSexar * 0.48))
                numeros.push(_this.isNan_0(TotalLH.descartes / TotalLH.HI) * 100)
                numeros.push(_this.isNan_0((TotalLH.totalNacidos - TotalLH.Ventas) / TotalLH.Ventas * 100))
                //TOTAL LM
                numeros.push(TotalLM.Ventas)
                numeros.push(TotalLM.subProductoReal)
                numeros.push(TotalLM.sinSexar)
                numeros.push(TotalLM.descartes)
                numeros.push(TotalLM.subProductoReal + TotalLM.sinSexar + TotalLM.descartes)
                numeros.push(_this.isNan_0(TotalLM.Ventas / (TotalLM.Ventas + TotalLM.subProductoReal) * 100))
                numeros.push(_this.isNan_0(TotalLM.subProductoReal / (TotalLM.Ventas + TotalLM.subProductoReal) * 100))
                numeros.push(_this.isNan_0(TotalLM.sinSexar / (TotalLM.Ventas + TotalLM.subProductoReal) * 100))
                numeros.push(Math.ceil(TotalLM.sinSexar * 0.48))
                numeros.push(_this.isNan_0(TotalLM.descartes / TotalLM.HI) * 100)
                numeros.push(_this.isNan_0((TotalLM.totalNacidos - TotalLM.Ventas) / TotalLM.Ventas * 100))

                tableData.push({
                    Fecha_Nacimiento: this.formatDate(r.fechaNacimiento, '/', 'normal'),
                    CodCarga: r.CodCarga,
                    numeros
                })
            }
            return {
                succes: true,
                result: tableData
            }
        } catch (error) {
            console.log('error :>> ', error);
            return {
                success: false,
                message: "Ocurrió un error en el servidor."
            }
        }
    },
    reqnacimientosGraficos: async function () {
        let _this = this;
        try {
            let tableData = [];
            let rows = await db.query(`SELECT * FROM nacimiento WHERE Estado = 1 
            ORDER BY fechaNacimiento DESC LIMIT 3`)
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                let json = {
                    VentasLH: 0,
                    SPLH: 0,
                    SinSexarLH: 0,
                    SinSexar048LH: 0,
                    DescarteLH: 0,
                    DesmedroLH: 0,
                    VentasLM: 0,
                    SPLM: 0,
                    SinSexarLM: 0,
                    SinSexar048LM: 0,
                    DescarteLM: 0,
                    DesmedroLM: 0,
                }
                let TotalLM = {
                    HI: 0,
                    Ventas: 0,
                    Estimadas: 0,
                    subProductoReal: 0,
                    sinSexar: 0,
                    Otros: 0,
                    pollos1ra: 0,
                    porc1ra: 0,
                    Saca: 0,
                    Recuperacion: 0,
                    Sexado: 0,
                    Vacunacion: 0,
                    Desunado: 0,
                    descartes: 0,
                    porcDescartes: 0,
                    totalNacidos: 0,
                    porcNacidoReal: 0
                }
                let TotalLH = {
                    HI: 0,
                    Ventas: 0,
                    Estimadas: 0,
                    subProductoReal: 0,
                    sinSexar: 0,
                    Otros: 0,
                    pollos1ra: 0,
                    porc1ra: 0,
                    Saca: 0,
                    Recuperacion: 0,
                    Sexado: 0,
                    Vacunacion: 0,
                    Desunado: 0,
                    descartes: 0,
                    porcDescartes: 0,
                    totalNacidos: 0,
                    porcNacidoReal: 0
                }
                let rows_det = await db.query(`SELECT * FROM nacimiento_det na 
                INNER JOIN lotes lo ON lo.idLote = na.idLote WHERE na.idNacimiento = ?`,
                    [r.idNacimiento])
                for (let j = 0; j < rows_det.length; j++) {
                    const rd = rows_det[j];
                    if (rd.TipoGenero == "LH") {
                        TotalLH.HI = TotalLH.HI + rd.HI;
                        TotalLH.Ventas = TotalLH.Ventas + rd.Ventas;
                        TotalLH.Estimadas = TotalLH.Estimadas + rd.Estimadas;
                        TotalLH.subProductoReal = TotalLH.subProductoReal + rd.subProductoReal;
                        TotalLH.sinSexar = TotalLH.sinSexar + rd.sinSexar + rd.carneNoVendida;
                        TotalLH.Otros = TotalLH.Otros + rd.Otros;
                        TotalLH.pollos1ra = TotalLH.pollos1ra + rd.pollos1ra;
                        TotalLH.porc1ra = TotalLH.porc1ra + rd.porc1ra;
                        TotalLH.Saca = TotalLH.Saca + rd.Saca;
                        TotalLH.Recuperacion = TotalLH.Recuperacion + rd.Recuperacion;
                        TotalLH.Sexado = TotalLH.Sexado + rd.Sexado;
                        TotalLH.Vacunacion = TotalLH.Vacunacion + rd.Vacunacion;
                        TotalLH.Desunado = TotalLH.Desunado + rd.Desunado;
                        TotalLH.descartes = TotalLH.descartes + rd.descartes;
                        TotalLH.porcDescartes = TotalLH.porcDescartes + rd.porcDescartes;
                        TotalLH.totalNacidos = TotalLH.totalNacidos + rd.totalNacidos;
                        TotalLH.porcNacidoReal = TotalLH.porcNacidoReal + rd.porcNacidoReal;
                    } else {
                        TotalLM.HI = TotalLM.HI + rd.HI;
                        TotalLM.Ventas = TotalLM.Ventas + rd.Ventas;
                        TotalLM.Estimadas = TotalLM.Estimadas + rd.Estimadas;
                        TotalLM.subProductoReal = TotalLM.subProductoReal + rd.subProductoReal;
                        TotalLM.sinSexar = TotalLM.sinSexar + rd.sinSexar + rd.carneNoVendida;
                        TotalLM.Otros = TotalLM.Otros + rd.Otros;
                        TotalLM.pollos1ra = TotalLM.pollos1ra + rd.pollos1ra;
                        TotalLM.porc1ra = TotalLM.porc1ra + rd.porc1ra;
                        TotalLM.Saca = TotalLM.Saca + rd.Saca;
                        TotalLM.Recuperacion = TotalLM.Recuperacion + rd.Recuperacion;
                        TotalLM.Sexado = TotalLM.Sexado + rd.Sexado;
                        TotalLM.Vacunacion = TotalLM.Vacunacion + rd.Vacunacion;
                        TotalLM.Desunado = TotalLM.Desunado + rd.Desunado;
                        TotalLM.descartes = TotalLM.descartes + rd.descartes;
                        TotalLM.porcDescartes = TotalLM.porcDescartes + rd.porcDescartes;
                        TotalLM.totalNacidos = TotalLM.totalNacidos + rd.totalNacidos;
                        TotalLM.porcNacidoReal = TotalLM.porcNacidoReal + rd.porcNacidoReal;
                    }
                }
                //TOTAL LH
                json.VentasLH = TotalLH.Ventas
                json.SPLH = TotalLH.subProductoReal
                json.SinSexarLH = TotalLH.sinSexar
                json.SinSexar048LH = Math.ceil(TotalLH.sinSexar * 0.48)
                json.DescarteLH = TotalLH.descartes
                json.DesmedroLH = TotalLH.subProductoReal + TotalLH.sinSexar + TotalLH.descartes

                json.porcVentasLH = Number(_this.isNan_0(json.VentasLH / (json.VentasLH + json.SPLH) * 100).toFixed(2))
                json.porcSinSexarLH = Number(_this.isNan_0(json.SinSexarLH / (json.SPLH + json.VentasLH) * 100).toFixed(2))
                json.porcSPLH = Number(_this.isNan_0(json.SPLH / (json.SPLH + json.VentasLH) * 100).toFixed(2))
                json.porcDescarteLH = Number(_this.isNan_0(json.DescarteLH / TotalLH.HI * 100).toFixed(2))
                json.porcDesmedroLH = Number(_this.isNan_0((TotalLH.totalNacidos - json.VentasLH) / json.VentasLH * 100).toFixed(2))
                //TOTAL LM
                json.VentasLM = TotalLM.Ventas
                json.SPLM = TotalLM.subProductoReal
                json.SinSexarLM = TotalLM.sinSexar
                json.SinSexar048LM = Math.ceil(TotalLM.sinSexar * 0.48)
                json.DescarteLM = TotalLM.descartes
                json.DesmedroLM = TotalLM.subProductoReal + TotalLM.sinSexar + TotalLM.descartes

                json.porcVentasLM = Number(_this.isNan_0(json.VentasLM / (json.VentasLM + json.SPLM) * 100).toFixed(2))
                json.porcSinSexarLM = Number(_this.isNan_0(json.SinSexarLM / (json.SPLM + json.VentasLM) * 100).toFixed(2))
                json.porcSPLM = Number(_this.isNan_0(json.SPLM / (json.SPLM + json.VentasLM) * 100).toFixed(2))
                json.porcDescarteLM = Number(_this.isNan_0(TotalLM.descartes / TotalLM.HI * 100).toFixed(2))
                json.porcDesmedroLM = Number(_this.isNan_0((TotalLM.totalNacidos - TotalLM.Ventas) / TotalLM.Ventas * 100).toFixed(2))

                if (json.VentasLH != 0 && json.VentasLM != 0) {
                    tableData.push({
                        Fecha_Nacimiento: this.formatDate(r.fechaNacimiento, '/', 'normal'),
                        CodCarga: r.CodCarga,
                        json
                    })
                }
            }
            return {
                succes: true,
                result: tableData
            }
        } catch (error) {
            console.log('error :>> ', error);
            return {
                success: false,
                message: "Ocurrió un error en el servidor."
            }
        }
    },
    getNacimientoPoultry: async function () {
        let rows = await db.query(`SELECT * 
        FROM nacimiento nd 
        order by nd.fechaNacimiento DESC`);

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            let sem = await db.query(`SELECT * FROM semanas se
            WHERE se.idcorral = '${r.idNacimiento}'`);
            let detalle = await db.query(`SELECT * FROM nacimiento_det
            WHERE idNacimiento = '${r.idNacimiento}'`)
            r.detalle = detalle;
            r.semanas = sem
        }

        return rows;
    },

    listarPromedioNacimientoDetallePorNombresLote: async function (nombreLotes = []) {
        const connection = await mysql.connection();
        try {

            return await connection.query("select AVG(pollos1ra) as pollos1ra,avg(porcNacidoReal) as porcNacidoReal ,edadGallina,lo.lote from nacimiento_det nd inner join lotes lo on lo.idLote=nd.idLote where lo.lote in(?) GROUP BY  edadGallina,lo.lote  ORDER BY edadGallina asc", [nombreLotes]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();

        }
    },
    reqnacimientosexport: async function (Data) {
        let rutaRA = "/template/ReqNacimiento.xlsx";
        if (fs.existsSync("./template/ReqNacimiento.xlsx")) {
            await fs.unlinkSync("./template/ReqNacimiento.xlsx")
        }
        workbook.xlsx.readFile('./template/PlantillaRN.xlsx')
            .then(async function (work) {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async function (worksheet, sheetId) {
                        for (let i = 0; i < Data.length; i++) {
                            const d = Data[i];
                            worksheet.getCell('A' + (i + 5)).value = d.Fecha_Nacimiento;
                            worksheet.getCell('B' + (i + 5)).value = d.CodCarga;
                            worksheet.getCell('C' + (i + 5)).value = d.numeros[0];
                            worksheet.getCell('D' + (i + 5)).value = d.numeros[1];
                            worksheet.getCell('E' + (i + 5)).value = d.numeros[2];
                            worksheet.getCell('F' + (i + 5)).value = d.numeros[3];
                            worksheet.getCell('G' + (i + 5)).value = d.numeros[4];
                            worksheet.getCell('H' + (i + 5)).value = d.numeros[5];
                            worksheet.getCell('I' + (i + 5)).value = d.numeros[6];
                            worksheet.getCell('J' + (i + 5)).value = d.numeros[7];
                            worksheet.getCell('K' + (i + 5)).value = d.numeros[8];
                            worksheet.getCell('L' + (i + 5)).value = d.numeros[9];
                            worksheet.getCell('M' + (i + 5)).value = d.numeros[10];
                            worksheet.getCell('N' + (i + 5)).value = d.numeros[11];
                            worksheet.getCell('O' + (i + 5)).value = d.numeros[12];
                            worksheet.getCell('P' + (i + 5)).value = d.numeros[13];
                            worksheet.getCell('Q' + (i + 5)).value = d.numeros[14];
                            worksheet.getCell('R' + (i + 5)).value = d.numeros[15];
                            worksheet.getCell('S' + (i + 5)).value = d.numeros[16];
                            worksheet.getCell('T' + (i + 5)).value = d.numeros[17];
                            worksheet.getCell('U' + (i + 5)).value = d.numeros[18];
                            worksheet.getCell('V' + (i + 5)).value = d.numeros[19];
                            worksheet.getCell('W' + (i + 5)).value = d.numeros[20];
                            worksheet.getCell('X' + (i + 5)).value = d.numeros[21];
                        }
                        setTimeout(() => resolve(), 2000);
                    });
                }).then(data => {
                    workbook.xlsx.writeFile("./template/ReqNacimiento.xlsx").then(function () {
                        console.log("xls file is written.");
                    });
                })
            });
        return {
            success: true,
            message: "Exportación realizada correctamente.",
            rutaRA
        };
    }
}
module.exports = Nacimientos;
var db = require('../dbconnection')
const mysql = require("../dbconnectionPromise")
//sdwd
const { poolPromise, sql } = require('../dbconnectionMSSQL')
var fs = require('fs')
var Excel = require('exceljs')
const moment = require('moment')
const usuario = require("./usuario")
var workbook = new Excel.Workbook()
var sendEmailModel = require('./sendEmail');
const { Buffer } = require('buffer');

var tareo = {
    updatePunchStateBioTime: function (rowBiotime, userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const pool = await poolPromise
                const usuarioPersist = (await usuario.getusuarioByIdPromise(userId))[0]
                await pool.request().query(`update biotime.dbo.iclock_transaction set punch_state = '${parseInt(rowBiotime.punch_state) == 1 ? 0 : 1}' where id =${rowBiotime.id}  and emp_code =${rowBiotime.emp_code}`)
                db.query("insert into Tareo_Hist_Biotime(idBiotime,punch_time,emp_code,punch_state,fech_req,nombre_usuario) values(?,?,?,?,?,?)", [
                    rowBiotime.id, moment(rowBiotime.punch_time).format("YYYY-MM-DD HH:mm:ss"), rowBiotime.emp_code, rowBiotime.punch_state, moment().format("YYYY-MM-DD hh:mm:ss"), usuarioPersist.Nombre
                ], (err, result) => {
                    if (err) reject(err)
                    resolve();
                })
            } catch (error) {
                console.log("err", error)
                reject(error)
            }
        })
    },
    concilacionLiquidacion: async function ({ mes, anio }) {
        try {
            const pool = await poolPromise
            const data = await pool.request().query(`exec DBCostsSG.dbo.[Lista_ConciliacionLiquidacion]  '${anio}','${mes}' `)
            return data.recordset
        } catch (error) {
            throw error;
        }
    },
    exportarExcelConsiliacionLiquidacion: async function (listarConsiliacionLiquidacion = []) {
        try {
            const rutaTemplateHC = `./template/plantilla consiliacion liquidacion.xlsx`;

            if (fs.existsSync(`./template/consiliacion liquidacion.xlsx`)) {
                fs.unlinkSync(`./template/consiliacion liquidacion.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            for (let i = 0; i < listarConsiliacionLiquidacion.length; i++) {
                const detalle = listarConsiliacionLiquidacion[i]
                sheet.getCell("A" + (i + 4)).value = detalle.LIQC_CODIG
                sheet.getCell("A" + (i + 4)).border = borderStyles
                sheet.getCell("B" + (i + 4)).value = detalle.LIQC_NOMBR
                sheet.getCell("B" + (i + 4)).border = borderStyles
                sheet.getCell("C" + (i + 4)).value = detalle.TIPO
                sheet.getCell("C" + (i + 4)).border = borderStyles

                sheet.getCell("D" + (i + 4)).value = detalle.AREA
                sheet.getCell("D" + (i + 4)).border = borderStyles
                sheet.getCell("E" + (i + 4)).value = moment(detalle.LIQC_FCESE).format("YYYY-MM-DD")
                sheet.getCell("E" + (i + 4)).border = borderStyles
                sheet.getCell("F" + (i + 4)).value = detalle.CTS
                sheet.getCell("F" + (i + 4)).border = borderStyles
                sheet.getCell("G" + (i + 4)).value = detalle.VACACIONES
                sheet.getCell("G" + (i + 4)).border = borderStyles
                sheet.getCell("H" + (i + 4)).value = detalle.GRATIFICACION
                sheet.getCell("H" + (i + 4)).border = borderStyles
                sheet.getCell("I" + (i + 4)).value = detalle.AFP
                sheet.getCell("I" + (i + 4)).border = borderStyles
                sheet.getCell("J" + (i + 4)).value = detalle.ONP
                sheet.getCell("J" + (i + 4)).border = borderStyles
                sheet.getCell("K" + (i + 4)).value = detalle.OTROS
                sheet.getCell("K" + (i + 4)).border = borderStyles
                sheet.getCell("L" + (i + 4)).value = detalle.NETO
                sheet.getCell("L" + (i + 4)).border = borderStyles
                sheet.getCell("M" + (i + 4)).value = detalle.ESSALUD
                sheet.getCell("M" + (i + 4)).border = borderStyles
            }
            await workbook.xlsx.writeFile(`./template/consiliacion liquidacion.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/consiliacion liquidacion.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    },
    formatDataInTableTareo: function (data) {
        let workersEmpCode = data.filter(function (item, index, self) {
            return index === self.findIndex((t) => (t.emp_code == item.emp_code));
        }).map(item => item.emp_code);

        let workersAsistance = [];

        workersEmpCode.forEach(code => {
            let dataObject = {};
            dataObject['code'] = code;
            dataObject['data'] = data.filter(item => item.emp_code == code);

            workersAsistance.push(dataObject);
        })

        let list = [];
        workersAsistance.forEach(worker => {
            let tmp = [];
            let count = 0;
            worker.data.forEach(asistance => {
                let index = tmp.findIndex(item => item.fecha == moment(asistance.punch_time).format("YYYY-MM-DD"))
                if (index == -1) {
                    count = 0;
                    tmp.push({
                        ...asistance,
                        nombre: `${asistance.first_name} ${asistance.last_name}`,
                        fecha: moment(asistance.punch_time).format("YYYY-MM-DD"),
                        hora_entra: moment(asistance.punch_time).add(5, "h").format("hh:mm:ss a"),
                        terminal_entra: asistance.terminal_alias
                    })
                } else {
                    count++;
                    if (asistance.is_aditional == 1) {
                        count = 3;
                    }
                    switch (count) {
                        case 1:
                            tmp[index].hora_sali_refri = moment(asistance.punch_time).add(5, "h").format("hh:mm:ss a");
                            tmp[index].terminal_sali_refri = asistance.terminal_alias;
                            break;
                        case 2:
                            tmp[index].hora_entra_refri = moment(asistance.punch_time).add(5, "h").format("hh:mm:ss a");
                            tmp[index].terminal_entra_refri = asistance.terminal_alias;
                            break;
                        case 3:
                            tmp[index].hora_sali = moment(asistance.punch_time).add(5, "h").format("hh:mm:ss a");
                            tmp[index].terminal_sali = asistance.terminal_alias;
                            break;
                    }

                }
            })
            list = list.concat(tmp);

        })

        return list;
    },
    async deleteUser({ id, name }) {
        const pool = await poolPromise
        const { rowsAffected } = await pool.query(`exec DBCostsSG.dbo.SP_Elimina_Marcacion ${id},'${name}'`);

        return rowsAffected && rowsAffected.length > 0;

    },
    tareoConsultaFiltrado: (params) => {
        return new Promise(async (resolve, reject) => {

            try {
                const pool = await poolPromise

                await pool.request()
                    .query(`delete DBCostsSG.dbo.Tareo_EmpTmp`)
                let sql = "";
                let filters = '';
                if (params.usuarios && params.usuarios.length > 0) {
                    filters = ` and t.emp_code in(${params.usuarios.join()}) `;
                }
                if (params.include_aditional) {
                    sql = `  select t.emp_code,(ta.id is not null) as is_aditional from Tareo_Cronograma t
                     left join tareo_cronograma_adicional ta on ta.code=t.emp_code
                     where ta.id is not null 
                      or (t.fec_Crono>=? and t.fec_Crono<=? and t.department_id=? ${filters}) 

                     GROUP BY t.emp_code`;
                } else {
                    sql = `  select t.emp_code,0 as is_aditional from Tareo_Cronograma t
                       
                        where  t.fec_Crono>=? and t.fec_Crono<=? and t.department_id=?
                        ${filters}
                         GROUP BY t.emp_code`;
                }
                db.query(sql,
                    [moment(params.fechaIni).format("YYYY-MM-DD"),
                    moment(params.fechaFin).format("YYYY-MM-DD"),
                    params.departamento.id], async (err, results) => {
                        if (err) reject(err)
                        console.log("r", results)
                        for (const result of results) {
                            try {

                                await pool.request()
                                    .query(`INSERT INTO DBCostsSG.dbo.Tareo_EmpTmp 
                                    (IDCOR,emp_code,is_aditional) values (1,'${result.emp_code}',${result.is_aditional})`)

                            } catch (error) {
                                console.log("ee", error)
                            }
                        }
                        console.log(`salio del for`)
                        const data = await pool.request().query(`exec  [dbo].[SP_ListaMarcacionBiotime] '${moment(params.fechaIni).format("YYYYMMDD")}','${moment(params.fechaFin).format("YYYYMMDD")}'`)
                        //console.log("d", data.recordset)
                        resolve(data.recordset);
                    })

            } catch (error) {
                console.log("err", error)
                reject(error)
            }
        })

    },
    formatDate: (params) => {
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
        // hoy = dd + '/' + mm + '/' + yyyy;
        hoy = `${yyyy}-${mm}-${dd}`;

        return hoy;
    },
    getDepartments: async () => {
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(`SELECT * FROM Biotime.dbo.personnel_department READONLY 
                        WHERE parent_dept_id IS NOT NULL AND parent_dept_id = 1`)
            json = {
                rows: result.recordset,
                success: true,
                message: "Extracción de departamentos exitoso."
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                error: error.code,
                success: false,
                message: "Error en el servidor"
            }
        }
        return json
    },
    dynamicSort: function (property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    },
    dynamicSortMultiple: function () {
        const tareoFile = this;
        var props = arguments;
        return function (obj1, obj2) {
            var i = 0, result = 0, numberOfProperties = props.length;
            while (result === 0 && i < numberOfProperties) {
                result = tareoFile.dynamicSort(props[i])(obj1, obj2);
                i++;
            }
            return result;
        }
    },
    getiClockTransactionsRefactor: async function ({ Mes, Anio, Departamento, diasEnUnMes, empleadosP = [] }) {
        const connection = await mysql.connection();
        try {
            const pool = await poolPromise
            await connection.query("START TRANSACTION")
            const fechaMoment = moment(`${Anio}-${Mes}`, "YYYY-MM")
            const fechaInicioMesMoment = moment(`${Anio}-${Mes}-01`, "YYYY-MM-DD")
            const fechaFinMesMomentActual = fechaMoment.endOf("month")
            if (!Departamento && empleadosP.length == 0) {
                throw new Error("Se necesita el departamento")
            }
            const empleados = empleadosP.length > 0 ? empleadosP : (await tareo.getUsuarios({ Departamento })).rows
            const periodo = fechaMoment.format("YYYYMM")
            let FFM = new Date(Anio, Mes, 0)
            FFM.setDate(FFM.getDate() + 1)
            let DatePlusOne = tareo.formatDate(FFM)
            let seconDateAct = `${Anio}-${Mes}-02`
            let firstDatePost = DatePlusOne
            const horasExtra = 8
            const feriadosEnElPeriodo = (await pool.request().query(`SELECT DATEPART(dd, start_date) as dia FROM Biotime.dbo.att_holiday WHERE 
            (DATEPART(yy, start_date) = ${Anio} AND DATEPART(mm, start_date) = ${Mes})`)).recordset
            const dataTareoJsonPorEmpleados = await connection.query(`SELECT * FROM Tareo_detalle_json WHERE  ID_emp in(?) 
            and Periodo = ${periodo} ${Departamento ? 'and  department_id =' + Departamento.id : ''}  order by tipo_planilla desc`, [empleados.map(e => e.id)])
            const { Estado: estadoPeridoTareo = 0, YearMonth } = (await connection.query(`SELECT * FROM periodo_tareo WHERE YearMonth = ${periodo}`))[0] || {}
            const elPeriodoEstaCerrado = estadoPeridoTareo == 0
            if (!elPeriodoEstaCerrado) {
                await connection.query(`DELETE FROM Tareo_detalle WHERE Periodo = ${periodo} ${Departamento ? 'and department_id =' + Departamento.id : ''} `)
                await connection.query(`DELETE FROM Tareo_detalle_json WHERE Periodo = ${periodo} ${Departamento ? 'and department_id =' + Departamento.id : ''}`)
            }

            const consTareoCCPorEmpleado = await connection.query(`SELECT * FROM tareo_centro_costos WHERE idEmp in(?) 
                    and Periodo = ?`, [empleados.map(e => e.emp_code), periodo])


            const planillasEmpleados = (await pool.request()
                .query(`SELECT w.P010_CODIG, w.DNI, w.P010_NOMBR, w.TIPO_PANILLA,
                    convert(varchar,w.P010_FINGR,23) as fecha_ingreso  
                    FROM (SELECT P010_FINGR,P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'OBREROS' TIPO_PANILLA 
                            FROM RSPLACAR.DBO.PL0002PERS01 WHERE P010_SITUA='01'   
                            UNION ALL
                            SELECT P010_FINGR,P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'EMPLEADOS' TIPO_PANILLA 
                            FROM RSPLACAR_01.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020') w
                            WHERE w.DNI in(${empleados.map(e => e.emp_code).join()})`)).recordset
            const result_employees = (await pool.request()
                .query(`
                select y.* from (SELECT t.emp_code, t.dia, t.entrada, t.salida, COALESCE((DATEDIFF(minute,t.entrada,t.salida)),0) as minutos,
                            COALESCE(ROUND(DATEDIFF(ss,t.entrada,t.salida) / 60.0 / 60.0, 2),0) as horas FROM (
                            SELECT w.emp_code, w.dia, MIN(w.entrada) as entrada, MAX(w.salida) as salida FROM(
                            select emp_code,DAY(MIN(punch_time)) as dia, 
                            CASE WHEN punch_state = 0 THEN MIN(punch_time) END as entrada,
                            CASE WHEN punch_state = 1 THEN MAX(punch_time) END as salida,
                            punch_state
                            from Biotime.dbo.iclock_transaction where emp_code in (${empleados.map(e => e.emp_code).join()})
                            and year(punch_time) = ${Anio}
                            and month(punch_time) = ${Mes}
                            GROUP BY emp_code,punch_time, punch_state) w
                            GROUP BY w.emp_code, w.dia) t) y where entrada is not null`)).recordset
            const result_employees_night = (await pool.request()
                .query(`exec SP_ListarHorarioNocturno_v3 '${fechaInicioMesMoment.format("YYYYMMDD")}','${fechaFinMesMomentActual.format("YYYYMMDD")}','${seconDateAct.replace(/-/g, "")}','${firstDatePost.replace(/-/g, "")}','${empleados.map(e => e.emp_code).join()}'`)).recordset
            const listaDeTareoCronogramaPorEmpleadoYDia = await connection.query(`SELECT * FROM Tareo_Cronograma tc
                INNER JOIN Tareo_ConfigHorario tch ON tch.ID = tc.Id_horario
                WHERE tc.fec_Crono in(?) and tc.emp_code in(?)`, [diasEnUnMes.map((dia) => {
                return Anio + "-" + Mes + "-" + dia.numero.toString().padStart(2, "0")
            }), empleados.map(e => e.emp_code.trim())])
            const dataTareoDetalle = []
            for (let index = 0; index < empleados.length; index++) {
                const empleado = empleados[index];
                const { NombreCC: nombreCentroCostroDelEmpleado = "-" } = consTareoCCPorEmpleado.find(c => c.idEmp.trim() == empleado.emp_code.trim()) || {}
                const { TIPO_PANILLA: tipoPlanilla = "NO TIENE", fecha_ingreso = "" } = planillasEmpleados.find(p => p.DNI.trim() == empleado.emp_code.trim()) || {}
                const resultadoPorEmpleado = result_employees.filter(r => r.emp_code.trim() == empleado.emp_code.trim())
                let fechas = []
                let sumHoras = 0
                let sumMinutos = 0
                let variables = {
                    diasPagados: 0,
                    faltas: 0,
                    LGH: 0,
                    LSGH: 0,
                    VAC: 0,
                    feriados: 0,
                    DSUB: 0,
                    DM: 0,
                    PD: 0,
                    LP: 0,
                    D: 0,
                    COMP: 0,
                    totaldias: diasEnUnMes.length,
                    horasOrdinarias: 0,
                    he25: 0,
                    he35: 0,
                    he100: 0,
                    esHorarioNocturno: false,
                    totalHe25Nocturno: 0,
                    totalHe35Nocturno: 0,
                    totalHe100Nocturno: 0,
                    hferiados: 0,
                    ht: 0,
                    hn: 0
                }
                let fechaIngresoEmpleadoMoment = moment(empleado.fecha_ingreso)
                if (elPeriodoEstaCerrado) {
                    const { CentroCostos = "No Tiene", tipo_planilla = "No Tiene", Variables = [], Registers = [] } = dataTareoJsonPorEmpleados.find(json => json.ID_emp == empleado.id) || {}
                    empleado.CentroCostos = CentroCostos
                    empleado.TIPO_PANILLA = tipo_planilla
                    empleado.variables = Array.isArray(Variables) ? Variables : JSON.parse(Variables)
                    empleado.registers = Array.isArray(Registers) ? Registers : (JSON.parse(Registers)).map(register => {
                        let horas = register.horas
                        let Style = register.Style
                        const currentDateMoment = moment(`${Anio}-${Mes}-${register.dia}`, 'YYYY-MM-DD')
                        if (fechaIngresoEmpleadoMoment.isAfter(currentDateMoment)) {
                            horas = ''
                            Style = {}
                        }
                        return { ...register, horas, Style }
                    })
                    continue;
                }
                empleado.CentroCostos = nombreCentroCostroDelEmpleado
                empleado.TIPO_PANILLA = tipoPlanilla
                //fechaIngresoEmpleadoMoment = moment(fecha_ingreso)
                empleado.registersnight = result_employees_night.filter(r => r.emp_code.trim() == empleado.emp_code.trim())
                empleado.registers = resultadoPorEmpleado
                for (let j = 0; j < diasEnUnMes.length; j++) {
                    const diaDelMes = diasEnUnMes[j];
                    const diaDelMesRellenado = diaDelMes.numero.toString().padStart(2, "0")
                    let fechaActualMoment = moment(`${Anio}-${Mes}-${diaDelMesRellenado}`, "YYYY-MM-DD");


                    const exist_feriado = !(feriadosEnElPeriodo.find(f => diaDelMes.numero == f.dia) == undefined)
                    let TipoHorario = 'F';
                    let horaPorDiaFeriado = 0;
                    let Tiempo_Refrigerio = 0
                    let Es_HorarioNocturno = 0
                    let Permite_HE = 0
                    let Permite_HN = 0
                    let durationHoras = 0
                    let indexReg = -1
                    let Style = {
                        'color': 'black',
                        'border-color': 'transparent',
                        'background': '#ffdf00'
                    }

                    const { CalculaHe100 = 0, duration = 0, Style: styleFind, Tiempo_Refrigerio: tiempoRefrigerio = 0, Horario_Abrev = '', CalculaHFeriado: permiteHFeriado = 0, Permite_HE: permiteHe = 0, Permite_HN: permiteHn = 0, Es_HorarioNocturno: esHorarioNocturno = 0, Id_horario: idhorario = 0, nocturnoParcial = 0 } = listaDeTareoCronogramaPorEmpleadoYDia
                        .find(tareoCronograma => (moment(tareoCronograma.fec_Crono).format("YYYY-MM-DD") == (Anio + "-" + Mes + "-" + diaDelMesRellenado)) && tareoCronograma.emp_code.trim() == empleado.emp_code.trim()) || {}

                    const elEmpleadoTieneHorarioNocturno = esHorarioNocturno == 1
                    variables.esHorarioNocturno = elEmpleadoTieneHorarioNocturno;
                    if (idhorario >= 90) {
                        TipoHorario = Horario_Abrev
                        variables[TipoHorario]++
                    }
                    Es_HorarioNocturno = esHorarioNocturno
                    Permite_HE = permiteHe
                    Permite_HN = permiteHn
                    durationHoras = (duration / 60)
                    Style = styleFind ? JSON.parse(styleFind) : Style

                    Tiempo_Refrigerio = tiempoRefrigerio
                    if (TipoHorario != "D" && TipoHorario != "DM" && TipoHorario != "COMP" && TipoHorario != "VAC") {
                        let reg = {}
                        if (esHorarioNocturno == 0) {
                            indexReg = empleado.registers.findIndex(r => r.dia == diaDelMes.numero)
                            reg = empleado.registers[indexReg];
                        } else {
                            //10 noche 6 addMortalidad
                            indexReg = empleado.registersnight.findIndex(r => r.dia == diaDelMes.numero)
                            reg = empleado.registersnight[indexReg];
                        }
                        if (indexReg !== -1) {
                            reg.Style = Style

                            if (esHorarioNocturno == 0 && empleado.registers[indexReg] && fechaIngresoEmpleadoMoment.isAfter(fechaActualMoment)) {
                                empleado.registers[indexReg].horas = ''
                                empleado.registers[indexReg].Style = {};
                            }
                            if (esHorarioNocturno == 1 && empleado.registersnight[indexReg] && fechaIngresoEmpleadoMoment.isAfter(fechaActualMoment)) {
                                empleado.registersnight[indexReg].horas = ''
                                empleado.registersnight[indexReg].Style = {};
                            }
                            let totalHorasNocturnas = Array.from({ length: Math.ceil(reg.horas) + 1 }, (v, i) => i).reduce((prev, current) => {
                                const f = new Date(reg.entrada)
                                let horaNoc = f.getUTCHours() + current <= 24 ? f.getUTCHours() + current : (f.getUTCHours() + current - 24)
                                if (Permite_HN == 1 && (horaNoc < 6 || horaNoc >= 22)) {
                                    prev += 1
                                }
                                if (nocturnoParcial == 1) {
                                    prev += this.calculoHoraNocturnoParcial(reg.entrada)
                                }
                                return prev;

                            }, 0);


                            reg.Tiempo_Refrigerio_hour = (Tiempo_Refrigerio / 60)
                            reg.Tiempo_Refrigerio_min = Tiempo_Refrigerio

                            reg.Permite_HE = Permite_HE
                            reg.Permite_HN = Permite_HN
                            reg.he25 = 0
                            reg.he35 = 0
                            if (reg.horas > 5) {
                                reg.horas = Number((reg.horas - (Tiempo_Refrigerio / 60)).toFixed(2))
                                reg.minutos = Number((reg.minutos - Tiempo_Refrigerio).toFixed(2))
                                if (Permite_HE == 1 && reg.horas >= 8.5) {
                                    let ext = reg.horas - 8
                                    if (ext > 2) {
                                        reg.he25 = 2
                                        reg.he35 = Number((ext - reg.he25).toFixed(2))
                                    } else {
                                        reg.he25 = Number(ext.toFixed(2))
                                    }
                                }
                            }
                            sumHoras += CalculaHe100 == 1 ? (Number(reg.horas) + horasExtra) : Number(reg.horas)
                            variables.horasOrdinarias += (reg.horas - (reg.he25 + reg.he35))
                            variables.he25 += reg.he25
                            variables.he35 += reg.he35
                            variables.he100 += CalculaHe100 == 1 ? reg.horas : 0
                            reg.hn = 0;
                            if (esHorarioNocturno == 1) {
                                variables.totalHe25Nocturno += reg.h25
                                variables.totalHe35Nocturno += reg.he35
                                variables.totalHe100Nocturno += CalculaHe100 == 1 ? reg.horas : 0;
                                /*    if (nocturnoParcial == 1) {
   
                                       //TODO
                                       totalHorasNocturnas +=this.calculoHoraNocturnoParcial()
                                    } */
                                reg.hn = totalHorasNocturnas;
                            }

                            sumMinutos += reg.minutos
                            variables.hn += reg.hn
                            variables.diasPagados++
                            if (diaDelMes.dia == "D" && Permite_HE == 2) {
                                variables.he100 += reg.horas
                                variables.ht += reg.horas
                            }
                            if (permiteHFeriado == 1) {
                                variables.feriados++
                                variables.hferiados += reg.horas
                                horaPorDiaFeriado = reg.horas
                            }
                            if (exist_feriado == true) {
                                variables.feriados++
                                variables.hferiados += reg.horas
                                variables.ht += reg.horas
                            }
                            variables.ht += reg.hn
                            variables.ht += reg.horas
                            fechas.push(reg);
                        }
                    }

                    if (indexReg == -1) {
                        if (TipoHorario == 'F') {
                            Style = {
                                'color': 'black',
                                'border-color': 'transparent',
                                'background': '#d49b55'
                            }
                            variables.faltas++
                        }
                        fechas.push({
                            dia: diaDelMes.numero,
                            diaLetra: diaDelMes.dia,
                            entrada: '',
                            salida: '',
                            minutos: 0,
                            horas: fechaIngresoEmpleadoMoment.isAfter(fechaActualMoment) ? '' : TipoHorario,
                            Style: fechaIngresoEmpleadoMoment.isAfter(fechaActualMoment) ? {} : Style,
                            he25: 0,
                            he35: 0,
                            hn: 0
                        })
                    }
                    let last = fechas[fechas.length - 1]
                    let ho = 0
                    if (typeof last.horas !== 'string') {
                        ho = Number((last.horas - (last.he25 + last.he35)).toFixed(2))
                    }
                    //let he100 = r.dia == "D" ? (typeof last.horas !== 'string' ? last.horas : 0) : 0
                    let he100 = typeof last.horas !== 'string' ? last.horas : 0
                    let feriadoDia = exist_feriado == true ? 1 : 0
                    let vacaciones = TipoHorario == "VAC" ? 1 : 0
                    let faltas = (TipoHorario == 'F' && indexReg == -1) ? 1 : 0
                    let LGH = TipoHorario == "LGH" ? 1 : 0
                    let LSGH = TipoHorario == "LSGH" ? 1 : 0
                    let DSUB = TipoHorario == "DSUB" ? 1 : 0
                    let DDM = TipoHorario == "DM" ? 1 : 0
                    let DPD = TipoHorario == "D" ? 1 : 0
                    let tot_horas = ho + last.he25 + last.he35 + he100 + last.hn
                    if (feriadoDia == 1) {
                        tot_horas += (typeof last.horas !== 'string' ? last.horas : 0)
                    }
                    let resumenH = {
                        he25: last.he25,
                        totalHe25Nocturno: 0,
                        totalHe35Nocturno: 0,
                        totalHe100Nocturno: 0,
                        he35: last.he35,
                        he100: permiteHe == 1 ? he100 : 0,
                    }
                    if (elEmpleadoTieneHorarioNocturno) {
                        resumenH = {
                            he25: 0,
                            totalHe25Nocturno: last.he25,
                            totalHe35Nocturno: last.he35,
                            totalHe100Nocturno: permiteHe == 1 ? he100 : 0,
                            he35: 0,
                            he100: 0,
                        }
                        variables = { ...variables, ...resumenH }
                    }
                    tot_horas = Number(tot_horas.toFixed(2))
                    dataTareoDetalle.push({
                        id: empleado.id, empCode: empleado.emp_code, departamentoId: Departamento ? Departamento.id : empleado.department_id, periodo: periodo, fecha: Anio + "-" + Mes + "-" + diaDelMes.numero,
                        horas: ho, resumenH25: resumenH.he25,
                        resumentH35: resumenH.he35, resumenH100: resumenH.he100, resumenH25Nocturno: resumenH.totalHe25Nocturno, resumentH35Nocturno: resumenH.totalHe35Nocturno, resumentH100Nocturno: resumenH.totalHe100Nocturno, horasNocturnas: last.hn, vacaciones: vacaciones, esFeriado: horaPorDiaFeriado > 0 ? 1 : 0, faltas: faltas, lgh: LGH, lsgh: LSGH, dsub: DSUB,
                        ddm: DDM, dpd: DPD, totalHoras: tot_horas, usuarioReg: 1, horaPorDiaFeriado
                    })

                }
                console.log("sun",sumHoras)
                fechas.push({
                    dia: "TOTAL",
                    diaLetra: "T",
                    entrada: '',
                    salida: '',
                    minutos: sumMinutos,
                    horas: Number(Number(sumHoras).toFixed(2))
                })
                empleado.variables = variables
                empleado.registers = fechas
            }

            const dataDetalleTareJson = empleados.map(e => [e.id, e.emp_code, Departamento ? Departamento.id : e.department_id, periodo,
            JSON.stringify(e.variables), JSON.stringify(e.registers), e.TIPO_PANILLA, e.CentroCostos])
            const dataTareoDetalleValores = dataTareoDetalle.map(d => [d.id, d.empCode, d.departamentoId, d.periodo, d.fecha, d.horas, d.resumenH25, d.resumentH35, d.resumenH100, d.resumenH25Nocturno, d.resumentH35Nocturno, d.resumentH100Nocturno,
            d.horasNocturnas, d.vacaciones, d.esFeriado, d.faltas, d.lgh, d.lsgh, d.dsub, d.ddm, d.dpd, d.totalHoras, d.usuarioReg, d.horaPorDiaFeriado])
            if (dataTareoDetalleValores.length > 0) {
                await connection.query(`INSERT INTO Tareo_detalle (ID_emp, emp_code, department_id, Periodo, 
                       fec_tareo, HO, H25, H35, H100,H25_N,H35_N, H100_N,HN, Vacaciones, Feriados, Falta, LGH, LSGH, DSUB, DDM,
                       DPD, tot_horas, UsuarioReg,HFeriados) VALUES ?`, [dataTareoDetalleValores])
            }
            await connection.query(`INSERT INTO Tareo_detalle_json (ID_emp, emp_code, department_id, Periodo, Variables, 
                       Registers, tipo_planilla, CentroCostos) VALUES ?`, [dataDetalleTareJson]);
            const tareoFile = this;
            await connection.query("COMMIT");
            let employessOrder = []
            const employessOrderTipoPlanilla = empleados.sort(tareoFile.dynamicSortMultiple("TIPO_PANILLA"))
            for (let index = 0; index < employessOrderTipoPlanilla.length; index++) {
                const lastIndex = empleados.map((e) => e.TIPO_PANILLA).lastIndexOf(employessOrderTipoPlanilla[index].TIPO_PANILLA)
                employessOrder = employessOrder.concat(empleados.slice(index, lastIndex + 1).sort(tareoFile.dynamicSortMultiple("full_name")))
                index = lastIndex;
            }
            json = {
                rows: employessOrder,
                success: true,
                message: "Extracción de iclock_transaction exitoso."
            }
            return json;
        } catch (error) {
            console.error("e", error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }


    },
    calculoHoraNocturnoParcial: function (fechaEntradaEmpleado, horaEntrada = "6am", horaSalida = "6am") {
        const horaEntradaMoment = moment(horaEntrada, "HH")
        let totalHoras = 0;
        const horaSalidaMoment = moment(horaSalida, "HH").add(1, "day")
        const horaEntradaEmpleadoMoment = moment(fechaEntradaEmpleado, "YYYY-MM-DD HH:mm:ss")
        if (horaEntradaEmpleadoMoment.isBefore(horaEntradaMoment)) {
            totalHoras = horaEntradaEmpleadoMoment.subtract(horaEntradaMoment, "hours")

        }
        if (horaEntradaEmpleadoMoment.isAfter(horaSalidaMoment)) {
            totalHoras = horaEntradaEmpleadoMoment.subtract(horaSalidaMoment, "hours")
        }
        return totalHoras;
    },
    getiClockTransactions: async function (Data) {
        let { Mes, Anio, Departamento, diasEnUnMes } = Data
        let json = {}
        let lastDay = new Date(Anio, Mes, 0).getDate()
        let FFM = new Date(Anio, Mes, 0)
        FFM.setDate(FFM.getDate() + 1)
        let DatePlusOne = tareo.formatDate(FFM)
        let Mes_ant = Mes - 1
        if (Mes == 1) {
            Mes_ant = 12
        }
        let fechaIniMesAct = `${Anio}-${Mes}-01`
        let fechaFinMesAct = `${Anio}-${Mes}-${lastDay}`
        let seconDateAct = `${Anio}-${Mes}-02`
        let firstDatePost = DatePlusOne
        console.log("fir", firstDatePost)
        try {
            let Periodo = Anio + "" + Mes
            let result = await tareo.getUsuarios(Data)

            let employees = result.rows

            const pool = await poolPromise
            const cons_feriados = await pool.request().query(`SELECT DATEPART(dd, start_date) as dia FROM Biotime.dbo.att_holiday WHERE 
            (DATEPART(yy, start_date) = ${Anio} AND DATEPART(mm, start_date) = ${Mes})`)

            let feriados = cons_feriados.recordset

            let periodocerrado = true
            let periodoTareo = await db.query(`SELECT * FROM periodo_tareo WHERE YearMonth = ${Periodo}`)
            if (periodoTareo.length != 0) {
                if (periodoTareo[0].Estado == 0) {
                    periodocerrado = true
                } else {
                    periodocerrado = false
                    await db.query(`DELETE FROM Tareo_detalle WHERE Periodo = ${Periodo} and department_id = ${Departamento.id}`)
                    await db.query(`DELETE FROM Tareo_detalle_json WHERE Periodo = ${Periodo} and department_id = ${Departamento.id}`)
                }
            }
            for (let i = 0; i < employees.length; i++) {
                const e = employees[i];
                let fechas = []
                let sumHoras = 0
                let sumMinutos = 0
                let variables = {
                    diasPagados: 0,
                    faltas: 0,
                    LGH: 0,
                    LSGH: 0,
                    VAC: 0,
                    feriados: 0,
                    DSUB: 0,
                    DM: 0,
                    PD: 0,
                    LP: 0,
                    D: 0,
                    COMP: 0,
                    totaldias: diasEnUnMes.length,
                    horasOrdinarias: 0,
                    he25: 0,
                    he35: 0,
                    he100: 0,
                    esHorarioNocturno: false,
                    totalHe25Nocturno: 0,
                    totalHe35Nocturno: 0,
                    totalHe100Nocturno: 0,
                    hferiados: 0,
                    ht: 0,
                    hn: 0
                }
                let rowsTareo = await db.query(`SELECT * FROM Tareo_detalle_json WHERE Periodo = ${Periodo} and 
                ID_emp = ${e.id} and department_id = ${Departamento.id} order by tipo_planilla desc`)
                const horasExtra = 8

                if (periodocerrado == true) {
                    if (rowsTareo.length > 0) {
                        e.CentroCostos = rowsTareo[0].CentroCostos
                        e.TIPO_PANILLA = rowsTareo[0].tipo_planilla
                        e.variables = JSON.parse(rowsTareo[0].Variables)
                        e.registers = JSON.parse(rowsTareo[0].Registers)
                        if (typeof e.fecha_ingreso == 'string' && e.fecha_ingreso != "") {
                            let fi = new Date(e.fecha_ingreso);
                            for (let reg of e.registers) {
                                let current_date = new Date(`${Anio}-${Mes}-${reg.dia}`);
                                if (e.emp_code == "46506796") {

                                    console.log(moment(fi).isAfter(moment(current_date, "YYYY-MM-DD")), moment(current_date, "YYYY-MM-DD").format("YYYY-MM-DD"), current_date, fi)
                                }
                                if (moment(fi).isAfter(moment(current_date, "YYYY-MM-DD"))) {
                                    reg.horas = '';
                                    reg.Style = {};
                                }
                            }
                        }

                    }

                } else {
                    let consTareoCC = await db.query(`SELECT * FROM tareo_centro_costos WHERE idEmp = ? 
                    and Periodo = ?`, [e.emp_code, Anio + "" + Mes])
                    e.CentroCostos = '-'
                    if (consTareoCC.length != 0) {
                        e.CentroCostos = consTareoCC[0].NombreCC
                    }
                    const result_empleado = await pool.request()
                        .query(`SELECT w.P010_CODIG, w.DNI, w.P010_NOMBR, w.TIPO_PANILLA,
                        convert(varchar,w.P010_FINGR,23) as fecha_ingreso  
                        FROM (SELECT P010_FINGR,P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'OBREROS' TIPO_PANILLA 
                                FROM RSPLACAR.DBO.PL0002PERS01 WHERE P010_SITUA='01'   
                                UNION ALL
                                SELECT P010_FINGR,P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'EMPLEADOS' TIPO_PANILLA 
                                FROM RSPLACAR_01.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020') w
                                WHERE w.DNI = ${e.emp_code}`)
                    let fecha_ingreso = null;
                    if (result_empleado.recordset.length != 0) {
                        e.TIPO_PANILLA = result_empleado.recordset[0].TIPO_PANILLA
                        fecha_ingreso = new Date(result_empleado.recordset[0].fecha_ingreso);
                    } else {
                        e.TIPO_PANILLA = "NO TIENE"
                    }
                    const result_employees = await pool.request()
                        .query(`select y.* from (SELECT t.dia, t.entrada, t.salida, COALESCE((DATEDIFF(minute,t.entrada,t.salida)),0) as minutos,
                            COALESCE(ROUND(DATEDIFF(ss,t.entrada,t.salida) / 60.0 / 60.0, 2),0) as horas FROM (
                            SELECT w.dia, MIN(w.entrada) as entrada, MAX(w.salida) as salida FROM(
                            select DAY(MIN(punch_time)) as dia, 
                            CASE WHEN punch_state = 0 THEN MIN(punch_time) END as entrada,
                            CASE WHEN punch_state = 1 THEN MAX(punch_time) END as salida,
                            punch_state
                            from Biotime.dbo.iclock_transaction where emp_code= ${e.emp_code}
                            and year(punch_time) = ${Anio}
                            and month(punch_time) = ${Mes}
                            GROUP BY punch_time, punch_state) w
                            GROUP BY w.dia) t) y where entrada is not null`)
                    //Falta que carlos lo refacotirze
                    const result_employees_night = await pool.request()
                        .query(`exec SP_ListarHorarioNocturno '${fechaIniMesAct.replace(/-/g, "")}','${fechaFinMesAct.replace(/-/g, "")}','${seconDateAct.replace(/-/g, "")}','${firstDatePost.replace(/-/g, "")}','${e.emp_code}'`)

                    e.registersnight = result_employees_night.recordset
                    e.registers = result_employees.recordset
                    for (let j = 0; j < diasEnUnMes.length; j++) {
                        let r = diasEnUnMes[j];
                        let exist = false
                        let exist_feriado = false
                        for (let k = 0; k < feriados.length && exist_feriado == false; k++) {
                            const f = feriados[k];
                            if (f.dia == r.numero) {
                                exist_feriado = true
                            }
                        }
                        let Dia = r.numero
                        if (r.numero < 10) {
                            Dia = '0' + r.numero
                        }
                        let cons_crono = await db.query(`SELECT * FROM Tareo_Cronograma tc
                        INNER JOIN Tareo_ConfigHorario tch ON tch.ID = tc.Id_horario
                        WHERE tc.fec_Crono = ? and tc.emp_code = ?`, [Anio + "-" + Mes + "-" + Dia, e.emp_code])
                        const { CalculaHFeriado: permiteHFeriado = 0, Permite_HE: permiteHe = 0, Permite_HN: permiteHn = 0, Es_HorarioNocturno: esHorarioNocturno = 0 } = cons_crono[0] || {}
                        const elEmpleadoTieneHorarioNocturno = esHorarioNocturno == 1
                        variables.esHorarioNocturno = elEmpleadoTieneHorarioNocturno;
                        let TipoHorario = 'F'
                        let horaPorDiaFeriado = 0;
                        let Tiempo_Refrigerio = 0
                        let Es_HorarioNocturno = 0
                        let Permite_HE = 0
                        let Permite_HN = 0
                        let CalculaHe100 = 0
                        let duration = 0
                        let durationHoras = 0
                        let Style = {
                            'color': 'black',
                            'border-color': 'transparent',
                            'background': '#ffdf00'
                        }
                        if (cons_crono.length != 0) {
                            if (cons_crono[0].Id_horario >= 90) {
                                TipoHorario = cons_crono[0].Horario_Abrev
                                variables[TipoHorario]++
                            }
                            Es_HorarioNocturno = cons_crono[0].Es_HorarioNocturno
                            Permite_HE = cons_crono[0].Permite_HE
                            Permite_HN = cons_crono[0].Permite_HN
                            CalculaHe100 = cons_crono[0].CalculaHe100
                            duration = cons_crono[0].duration
                            durationHoras = (duration / 60)
                            Style = JSON.parse(cons_crono[0].Style)
                            Tiempo_Refrigerio = cons_crono[0].Tiempo_Refrigerio
                        }

                        if (TipoHorario != "D" && TipoHorario != "DM" && TipoHorario != "COMP" && TipoHorario != "VAC") {
                            if (Es_HorarioNocturno == 0) {
                                for (let w = 0; w < e.registers.length && exist == false; w++) {
                                    const reg = e.registers[w];
                                    if (reg.dia == r.numero) {
                                        exist = true
                                        let current_date = new Date(`${Anio}-${Mes}-${r.numero}`);
                                        reg.Style = Style
                                        if (fecha_ingreso) {
                                            e.registers[w].TipoHorario = current_date < fecha_ingreso ? '' : TipoHorario;
                                        } else {
                                            e.registers[w].TipoHorario = '';
                                            e.registers[w].Style = {};
                                        }
                                        reg.Tiempo_Refrigerio_hour = (Tiempo_Refrigerio / 60)
                                        reg.Tiempo_Refrigerio_min = Tiempo_Refrigerio
                                        reg.Permite_HE = Permite_HE
                                        reg.Permite_HN = Permite_HN
                                        reg.he25 = 0
                                        reg.he35 = 0
                                        if (reg.horas > 5) {
                                            reg.horas = Number((reg.horas - (Tiempo_Refrigerio / 60)).toFixed(2))
                                            reg.minutos = Number((reg.minutos - Tiempo_Refrigerio).toFixed(2))
                                            if (Permite_HE == 1 && reg.horas >= 8.5) {
                                                let ext = reg.horas - 8
                                                if (ext > 2) {
                                                    reg.he25 = 2
                                                    reg.he35 = Number((ext - reg.he25).toFixed(2))
                                                } else {
                                                    reg.he25 = Number(ext.toFixed(2))
                                                }
                                            }
                                        }

                                        sumHoras += CalculaHe100 == 1 ? (reg.horas + horasExtra) : reg.horas

                                        reg.hn = 0
                                        variables.horasOrdinarias += (reg.horas - (reg.he25 + reg.he35))
                                        variables.he25 += reg.he25
                                        variables.he35 += reg.he35
                                        variables.he100 += CalculaHe100 == 1 ? reg.horas : 0
                                        sumMinutos += reg.minutos
                                        variables.hn += reg.hn
                                        variables.diasPagados++
                                        if (r.dia == "D" && Permite_HE == 2) {
                                            variables.he100 += reg.horas
                                            variables.ht += reg.horas
                                        }
                                        if (permiteHFeriado == 1) {
                                            variables.feriados++
                                            variables.hferiados += reg.horas
                                            horaPorDiaFeriado = reg.horas
                                        }
                                        if (exist_feriado == true) {
                                            variables.feriados++
                                            variables.hferiados += reg.horas
                                            variables.ht += reg.horas
                                        }
                                        variables.ht += reg.hn
                                        variables.ht += reg.horas
                                        fechas.push(reg);
                                    }
                                }
                            } else {

                                for (let w = 0; w < e.registersnight.length && exist == false; w++) {
                                    const reg = e.registersnight[w];
                                    if (reg.dia == r.numero) {
                                        exist = true
                                        reg.Style = Style
                                        reg.TipoHorario = TipoHorario
                                        reg.Tiempo_Refrigerio_hour = (Tiempo_Refrigerio / 60)
                                        reg.Tiempo_Refrigerio_min = Tiempo_Refrigerio
                                        reg.Permite_HE = Permite_HE
                                        reg.Permite_HN = Permite_HN
                                        reg.Es_HorarioNocturno = Es_HorarioNocturno
                                        reg.he25 = 0
                                        reg.he35 = 0
                                        if (reg.horas > 5) {
                                            reg.horas = Number((reg.horas - (Tiempo_Refrigerio / 60)).toFixed(2))
                                            reg.minutos = Number((reg.minutos - Tiempo_Refrigerio).toFixed(2))
                                            if (Permite_HE == 1 && reg.horas >= 8.5) {
                                                let ext = reg.horas - 8
                                                if (ext > 2) {
                                                    reg.he25 = 2
                                                    reg.he35 = Number((ext - reg.he25).toFixed(2))
                                                } else {
                                                    reg.he25 = Number(ext.toFixed(2))
                                                }
                                            }
                                        }
                                        reg.hn = 0
                                        if (Permite_HN == 1) {
                                            for (let hn = 0; hn < Math.ceil(reg.horas); hn++) {
                                                const f = new Date(reg.entrada)
                                                let horaNoc = f.getUTCHours() + hn <= 24 ? f.getUTCHours() + hn : (f.getUTCHours() + hn - 24)
                                                if (horaNoc >= 22) {
                                                    reg.hn++
                                                }
                                                if (horaNoc < 6) {
                                                    reg.hn++
                                                }
                                            }
                                        }
                                        variables.horasOrdinarias += (reg.horas - (reg.he25 + reg.he35))
                                        variables.he25 += reg.he25
                                        variables.he35 += reg.he35
                                        variables.he100 += CalculaHe100 == 1 ? reg.horas : 0
                                        variables.totalHe25Nocturno += reg.h25
                                        variables.totalHe35Nocturno += reg.he35
                                        variables.totalHe100Nocturno += CalculaHe100 == 1 ? reg.horas : 0;
                                        sumHoras += CalculaHe100 == 1 ? (reg.horas + horasExtra) : reg.horas

                                        sumMinutos += reg.minutos
                                        variables.hn += reg.hn
                                        variables.diasPagados++
                                        if (r.dia == "D" && Permite_HE == 2) {
                                            variables.he100 += reg.horas
                                            variables.ht += reg.horas
                                        }
                                        if (permiteHFeriado == 1) {
                                            variables.feriados++
                                            variables.hferiados += reg.horas
                                            horaPorDiaFeriado = reg.horas
                                        }
                                        if (exist_feriado == true) {
                                            variables.feriados++
                                            variables.hferiados += reg.horas
                                            variables.ht += reg.horas
                                        }
                                        variables.ht += reg.hn
                                        variables.ht += reg.horas
                                        fechas.push(reg)
                                    }
                                }

                            }
                        }
                        if (exist == false) {
                            if (TipoHorario == 'F') {
                                Style = {
                                    'color': 'black',
                                    'border-color': 'transparent',
                                    'background': '#d49b55'
                                }
                                variables.faltas++
                            }
                            fechas.push({
                                dia: r.numero,
                                diaLetra: r.dia,
                                entrada: '',
                                salida: '',
                                minutos: 0,
                                horas: TipoHorario,
                                Style,
                                he25: 0,
                                he35: 0,
                                hn: 0
                            })
                        }

                        let last = fechas[fechas.length - 1]
                        let ho = 0
                        if (typeof last.horas !== 'string') {
                            ho = Number((last.horas - (last.he25 + last.he35)).toFixed(2))
                        }
                        //let he100 = r.dia == "D" ? (typeof last.horas !== 'string' ? last.horas : 0) : 0
                        let he100 = typeof last.horas !== 'string' ? last.horas : 0
                        let feriadoDia = exist_feriado == true ? 1 : 0
                        let vacaciones = TipoHorario == "VAC" ? 1 : 0
                        let faltas = (TipoHorario == 'F' && exist == false) ? 1 : 0
                        let LGH = TipoHorario == "LGH" ? 1 : 0
                        let LSGH = TipoHorario == "LSGH" ? 1 : 0
                        let DSUB = TipoHorario == "DSUB" ? 1 : 0
                        let DDM = TipoHorario == "DM" ? 1 : 0
                        let DPD = TipoHorario == "D" ? 1 : 0
                        let tot_horas = ho + last.he25 + last.he35 + he100 + last.hn
                        if (feriadoDia == 1) {
                            tot_horas += (typeof last.horas !== 'string' ? last.horas : 0)
                        }
                        let resumenH = {
                            he25: last.he25,
                            totalHe25Nocturno: 0,
                            totalHe35Nocturno: 0,
                            totalHe100Nocturno: 0,
                            he35: last.he35,
                            he100: permiteHe == 1 ? he100 : 0,
                        }
                        if (elEmpleadoTieneHorarioNocturno) {
                            resumenH = {
                                he25: 0,
                                totalHe25Nocturno: last.he25,
                                totalHe35Nocturno: last.he35,
                                totalHe100Nocturno: permiteHe == 1 ? he100 : 0,
                                he35: 0,
                                he100: 0,
                            }
                            variables = { ...variables, ...resumenH }
                        }
                        tot_horas = Number(tot_horas.toFixed(2))
                        await db.query(`INSERT INTO Tareo_detalle (ID_emp, emp_code, department_id, Periodo, 
                            fec_tareo, HO, H25, H35, H100,H25_N,H35_N, H100_N,HN, Vacaciones, Feriados, Falta, LGH, LSGH, DSUB, DDM,
                            DPD, tot_horas, UsuarioReg,HFeriados) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?,?,?,?,?)`, [e.id, e.emp_code, Departamento.id, Periodo, Anio + "-" + Mes + "-" + Dia,
                            ho, resumenH.he25, resumenH.he35, resumenH.he100, resumenH.totalHe25Nocturno, resumenH.totalHe35Nocturno, resumenH.totalHe100Nocturno, last.hn, vacaciones, horaPorDiaFeriado > 0 ? 1 : 0, faltas, LGH, LSGH, DSUB,
                            DDM, DPD, tot_horas, 1, horaPorDiaFeriado])


                    }

                    fechas.push({
                        dia: "TOTAL",
                        diaLetra: "T",
                        entrada: '',
                        salida: '',
                        minutos: sumMinutos,
                        horas: Number(sumHoras.toFixed(2))
                    })
                    e.variables = variables
                    e.registers = fechas
                    await db.query(`INSERT INTO Tareo_detalle_json (ID_emp, emp_code, department_id, Periodo, Variables, 
                    Registers, tipo_planilla, CentroCostos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [e.id, e.emp_code, Departamento.id, Periodo,
                    JSON.stringify(e.variables), JSON.stringify(e.registers), e.TIPO_PANILLA, e.CentroCostos])
                }

            }

            const tareoFile = this;
            let employessOrder = []
            const employessOrderTipoPlanilla = employees.sort(tareoFile.dynamicSortMultiple("TIPO_PANILLA"))
            for (let index = 0; index < employessOrderTipoPlanilla.length; index++) {
                const lastIndex = employees.map((e) => e.TIPO_PANILLA).lastIndexOf(employessOrderTipoPlanilla[index].TIPO_PANILLA)
                employessOrder = employessOrder.concat(employees.slice(index, lastIndex + 1).sort(tareoFile.dynamicSortMultiple("full_name")))
                index = lastIndex;
            }
            json = {
                rows: employessOrder,
                success: true,
                message: "Extracción de iclock_transaction exitoso."
            }
        } catch (error) {
            console.log('error :>> ', error);
        }
        return json
    },
    insertCentroCostosFilterByEmployeeAndPeriodo: async function (employees = [], periodoOrigen, periodoDestino) {
        const connection = await mysql.connection();
        let results = await connection.query(`select * from tareo_centro_costos where idEmp in(${employees.join()}) and Periodo=? `, [periodoOrigen]);
        const queryMap = results.map((result) => ([result.idEmp, result.idC, result.NombreCC, periodoDestino]))
        await connection.query("insert into tareo_centro_costos(idEmp,idC,NombreCC,Periodo) values ? ", [queryMap]);

        /*   return new Promise((async (resolve, reject) => {
              db.query(
                  `select * from tareo_centro_costos where idEmp in(${employees.join()}) and Periodo=? `, [periodoOrigen], (err, results) => {
                      if (err) reject(err)
                      const queryMap = results.map((result) => ([result.idEmp, result.idC, result.NombreCC, periodoDestino]))
                      console.log("query map", queryMap)
                      db.query("insert into tareo_centro_costos(idEmp,idC,NombreCC,Periodo) values ? ", [queryMap], (err, results) => {
                          if (err) reject(err)
                          resolve()
                      })
                  })
     
          })) */

    },
    copyCronograma: async function (dataCronograma, user) {

        const { origen, destino, unidadProductiva } = dataCronograma
        const fechaInicioOrigen = moment(origen.fechaInicio)
        const fechaInicioDestino = moment(destino.fechaInicio)
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            let employees = await connection.query(`select DISTINCT t.emp_code,t.department_id,t.fec_Crono,t.Fec_registro,t.ID,t.ID_emp,t.Id_horario,t.Periodo,t.user_reg  from Tareo_Cronograma t where fec_Crono>=? and fec_Crono<=? and department_id=${unidadProductiva.id} order by fec_Crono`, [moment(origen.fechaInicio).format("YYYY-MM-DD"), moment(origen.fechaFin).format("YYYY-MM-DD")])
            let employeeMap1 = []
            for (let index = 0; index < employees.length; index++) {
                const lastIndex = employees.map((e) => moment(e.fec_Crono).format("YYYY-MM-DD")).lastIndexOf(fechaInicioOrigen.format("YYYY-MM-DD"))
                employeeMap1 = employeeMap1.concat(employees.slice(index, lastIndex + 1).map((e) => ({ ...e, fec_crono: fechaInicioDestino.format("YYYY-MM-DD"), periodo: fechaInicioDestino.format("YYYY-MM").replace("-", ""), userReg: user })))
                index = lastIndex;
                fechaInicioOrigen.add(1, "day")
                fechaInicioDestino.add(1, "day")
            }
            if (employees.length == 0) {
                throw { message: "no existe empleados registrados en origen" }
            }
            await this.insertCentroCostosFilterByEmployeeAndPeriodo(employees.map((e) => e.emp_code), moment(origen.fechaInicio).format("YYYY-MM").replace("-", ""), moment(destino.fechaInicio).format("YYYY-MM").replace("-", ""))
            const queryMap = employeeMap1.map((employee) => ([employee.ID_emp, employee.emp_code, employee.department_id, employee.periodo, employee.Id_horario, employee.fec_crono, new Date(), employee.userReg]))
            await connection.query("insert into  Tareo_Cronograma(ID_emp,emp_code,department_id,Periodo,Id_horario,fec_Crono,Fec_registro,user_reg) values ?", [queryMap])
            await connection.query("COMMIT");
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;

        } finally {
            await connection.release();
        }

        /* return new Promise(async (resolve, reject) => {
            db.beginTransaction(function (err) {
                const { origen, destino, unidadProductiva } = dataCronograma
                const fechaInicioOrigen = moment(origen.fechaInicio)
                const fechaInicioDestino = moment(destino.fechaInicio)
                db.query(`select * from tareo_cronograma where fec_Crono>=? and fec_Crono<=? and department_id=${unidadProductiva.id} order by fec_Crono`, [moment(origen.fechaInicio).format("YYYY-MM-DD"), moment(origen.fechaFin).format("YYYY-MM-DD")], async (err, results) => {
                    try {
                        if (err) reject(err)
                        let employees = results;
                        let employeeMap1 = []
                        for (let index = 0; index < employees.length; index++) {
                            const lastIndex = employees.map((e) => moment(e.fec_Crono).format("YYYY-MM-DD")).lastIndexOf(fechaInicioOrigen.format("YYYY-MM-DD"))
                            employeeMap1 = employeeMap1.concat(employees.slice(index, lastIndex + 1).map((e) => ({ ...e, fec_crono: fechaInicioDestino.format("YYYY-MM-DD"), periodo: fechaInicioDestino.format("YYYY-MM").replace("-", ""), userReg: user })))
                            index = lastIndex;
                            fechaInicioOrigen.add(1, "day")
                            fechaInicioDestino.add(1, "day")
                        }
                        if (employees.length == 0) {
                            reject({ message: "no existe empleados registrados en origen" })
                        }
                        await tareoFile.insertCentroCostosFilterByEmployeeAndPeriodo(employees.map((e) => e.emp_code), fechaInicioOrigen.format("YYYY-MM").replace("-", ""), fechaInicioDestino.format("YYYY-MM").replace("-", ""))
                        console.log("sigue el hilo")
                        const queryMap = employeeMap1.map((employee) => ([employee.ID_emp, employee.emp_code, employee.department_id, employee.periodo, employee.Id_horario, employee.fec_crono, new Date(), employee.userReg]))
                        db.query("insert into  tareo_cronograma(ID_emp,emp_code,department_id,Periodo,Id_horario,fec_Crono,Fec_registro,user_reg) values ?", [queryMap], (err, results) => {
                            if (err) reject(err)
                            resolve();
                        })
                    } catch (error) {
                        db.rollback();
                        console.log(error)
                        reject(error)
                    }
                })
            })
        }) */
    },
    verifiedCopyCronograma: async function (data) {
        const connection = await mysql.connection();
        const { destino, unidadProductiva } = data;
        try {
            await connection.query("START TRANSACTION");
            let rows = await connection.query(`SELECT * from Tareo_Cronograma where fec_Crono>=? and fec_Crono<=? and department_id=${unidadProductiva.id}`, [moment(destino.fechaInicio).format("YYYY-MM-DD"), moment(destino.fechaFin).format("YYYY-MM-DD")])
            await connection.query("COMMIT");
            return rows.length == 0
        } catch (a) {
            await connection.query("ROLLBACK");
        } finally {
            await connection.release();
        }
        /* return new Promise((resolve, reject) => {
            const { destino, unidadProductiva } = data;
            db.query(`SELECT * from tareo_cronograma where fec_Crono>=? and fec_Crono<=? and department_id=${unidadProductiva.id}`, [moment(destino.fechaInicio).format("YYYY-MM-DD"), moment(destino.fechaFin).format("YYYY-MM-DD")], (err, results) => {
                if (err) reject(err)
                console.log("res", results)
                resolve(results.length == 0)
            })
        }) */

    },
    getCronograma: async function (Data) {
        let { Mes, Anio, Departamento, diasEnUnMes } = Data
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(`SELECT pe.emp_code, pe.first_name, pe.last_name FROM Biotime.dbo.personnel_employee pe
                LEFT JOIN Biotime.dbo.iclock_transaction it ON pe.id = it.emp_id
                WHERE pe.department_id = ${Departamento.id} GROUP BY pe.emp_code, pe.first_name, pe.last_name`)

            let employees = result.recordset;

            for (let i = 0; i < employees.length; i++) {
                const e = employees[i];
                let consTareoCC = await db.query(`SELECT * FROM tareo_centro_costos WHERE idEmp = ? 
                and Periodo = ?`, [e.emp_code, Anio + "" + Mes])
                e.CentroCostos = '-'
                if (consTareoCC.length != 0) {
                    e.CentroCostos = consTareoCC[0].NombreCC
                }
                const result_empleado = await pool.request()
                    .query(`SELECT w.P010_CODIG, w.DNI, w.P010_NOMBR, w.TIPO_PANILLA ,convert(varchar,w.P010_FINGR,23) as fecha_ingreso FROM 
                    (SELECT P010_FINGR,P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'OBREROS' TIPO_PANILLA 
                            FROM RSPLACAR.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020' 
                            UNION ALL
                            SELECT P010_FINGR,P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'EMPLEADOS' TIPO_PANILLA 
                            FROM RSPLACAR_01.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020') w
                            WHERE w.DNI = ${e.emp_code}`)
                if (result_empleado.recordset.length != 0) {
                    e.TIPO_PANILLA = result_empleado.recordset[0].TIPO_PANILLA
                } else {
                    e.TIPO_PANILLA = "NO TIENE"
                }
                let fechas = []
                for (let j = 0; j < diasEnUnMes.length; j++) {
                    const r = diasEnUnMes[j];
                    let Dia = r.numero
                    if (r.numero < 10) {
                        Dia = '0' + r.numero
                    }
                    let cons_crono = await db.query(`SELECT * FROM Tareo_Cronograma tc
                    INNER JOIN Tareo_ConfigHorario tch ON tch.ID = tc.Id_horario
                    WHERE tc.fec_Crono = ? and tc.emp_code = ?`, [Anio + "-" + Mes + "-" + Dia, e.emp_code])
                    let TipoHorario = ''
                    let Style = {}
                    if (cons_crono.length != 0) {
                        TipoHorario = cons_crono[0].Horario_Abrev
                        Style = JSON.parse(cons_crono[0].Style)
                    }
                    if (TipoHorario == 'F') {
                        Style = {
                            'color': 'black',
                            'border-color': 'transparent',
                            'background': 'rgb(212 155 85)'
                        }
                    }
                    fechas.push({
                        dia: r.numero,
                        diaLetra: r.dia,
                        entrada: '',
                        salida: '',
                        minutos: 0,
                        horas: TipoHorario,
                        Style
                    })
                }
                e.registers = fechas
            }
            const tareoFile = this;
            let employessOrder = []
            const employessOrderTipoPlanilla = result.recordset.sort(tareoFile.dynamicSortMultiple("TIPO_PANILLA"))
            for (let index = 0; index < employessOrderTipoPlanilla.length; index++) {
                const lastIndex = employees.map((e) => e.TIPO_PANILLA).lastIndexOf(employessOrderTipoPlanilla[index].TIPO_PANILLA)
                employessOrder = employessOrder.concat(employees.slice(index, lastIndex + 1).sort(tareoFile.dynamicSortMultiple("last_name")))
                index = lastIndex;
            }

            json = {
                rows: employessOrder,
                success: true,
                message: "Extracción de iclock_transaction exitoso."
            }
        } catch (error) {
            console.log('error :>> ', error);
        }
        return json
    },
    getUsuarios: async (Data) => {
        let { Departamento } = Data
        let json = {}
        try {

            const pool = await poolPromise
            const result = await pool.request()
                .query(`select (
                    select convert(varchar,pl.P010_FINGR,23)   FROM RSPLACAR.DBO.PL0002PERS01 as pl where pl.P010_CODIG=res.emp_code
                   ) as fecha_ingreso,res.* from 
                   (SELECT pe.id, pe.emp_code, pe.first_name, pe.last_name, 
                    CONCAT(pe.first_name, ' ',pe.last_name) as full_name
                     FROM Biotime.dbo.personnel_employee pe
                LEFT JOIN Biotime.dbo.iclock_transaction it ON pe.id = it.emp_id
                WHERE   pe.department_id = ${Departamento.id}
                 GROUP BY pe.id, pe.emp_code, pe.first_name, pe.last_name) res order by res.first_name`)
            let employees = result.recordset;
            json = {
                rows: employees,
                success: true,
                message: "Extracción de usuarios exitoso."
            };
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                error: error.code,
                success: false,
                message: "Error en el servidor ruta /tareo/getUsuarios"
            }
        }
        return json
    },
    getUsuariosSinAdicionales: async (Data) => {
        let { Departamento } = Data
        let json = {}
        try {

            const pool = await poolPromise
            var adicionales = await db.query('SELECT * FROM tareo_cronograma_adicional');
            adicionales = adicionales.map(item => "'"+item.code+"'").join(',');
            
            const result = await pool.request()
                .query(
            `select 
            (select convert(varchar,pl.P010_FINGR,23) FROM RSPLACAR.DBO.PL0002PERS01 as pl where pl.P010_CODIG=res.emp_code) as fecha_ingreso,
            res.* from 
            (SELECT pe.id, pe.emp_code, pe.first_name, pe.last_name, CONCAT(pe.first_name, ' ',pe.last_name) as full_name FROM Biotime.dbo.personnel_employee pe
            LEFT JOIN Biotime.dbo.iclock_transaction it ON pe.id = it.emp_id
            WHERE pe.department_id = ${Departamento.id}
            GROUP BY pe.id, pe.emp_code, pe.first_name, pe.last_name) res 
            WHERE res.emp_code NOT IN (${adicionales})
            order by res.first_name
            `)
            //res.emp_code NOT IN (${adicionales}) AND
            let employees = result.recordset;
            json = {
                rows: employees,
                adicionales: adicionales,
                success: true,
                message: "Extracción de usuarios exitoso."
            };
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                error: error.code,
                success: false,
                message: "Error en el servidor ruta /tareo/getUsuarios"
            }
        }
        return json
    },
    getUsuariosAdicionales: async (Data) => {
        let { Departamento } = Data
        let json = {}
        try {

            const pool = await poolPromise
            var adicionales = await db.query('SELECT * FROM tareo_cronograma_adicional');
            adicionales = adicionales.map(item => "'"+item.code+"'").join(',');
            var query = `
            SELECT pe.id, pe.emp_code, pe.first_name, pe.last_name, CONCAT(pe.first_name, ' ',pe.last_name) as full_name
            FROM Biotime.dbo.personnel_employee pe
            LEFT JOIN Biotime.dbo.iclock_transaction it ON pe.id = it.emp_id
            WHERE pe.emp_code IN (${adicionales})
            GROUP BY pe.id, pe.emp_code, pe.first_name, pe.last_name
            order by pe.first_name
            `;
            console.log('query',query)
            const result = await pool.request()
                .query(query)
            //res.emp_code NOT IN (${adicionales}) AND
            let employees = result.recordset;
            json = {
                rows: employees,
                adicionales: adicionales,
                success: true,
                message: "Extracción de usuarios exitoso."
            };
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                error: error.code,
                success: false,
                message: "Error en el servidor ruta /tareo/getUsuarios"
            }
        }
        return json
    },
    deleteUsuariosAdicionales: async (Data) => {
        let json = {}
        try {
            await db.query(`DELETE FROM tareo_cronograma_adicional WHERE code = ${Data.emp_code}`)
            json = {
                success: true,
                rows: consHorarios,
                message: "Extracción de horarios correctamente"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                error: error.code,
                message: "Error en el servidor ruta /tareo/deleteUsuariosAdicionales"
            }
        }
        return json
    },
    storeUsuariosAdicionales: async (Data) => {
        let json = {}
        try {
            const pool = await poolPromise;
            for (let index = 0; index < Data.length; index++) {
                const element = Data[index];
                db.query(`CALL SP_INSERT_ADICIONAL(${element.emp_code})`)
            }
            //console.log('query',query)
            var adicionales = Data.map(item => "'"+item.emp_code+"'").join(',');
            var query = `
            SELECT pe.id, pe.emp_code, pe.first_name, pe.last_name, CONCAT(pe.first_name, ' ',pe.last_name) as full_name
            FROM Biotime.dbo.personnel_employee pe
            LEFT JOIN Biotime.dbo.iclock_transaction it ON pe.id = it.emp_id
            WHERE pe.emp_code IN (${adicionales})
            GROUP BY pe.id, pe.emp_code, pe.first_name, pe.last_name
            order by pe.first_name
            `;
            
            const result = await pool.request()
                .query(query)
            //res.emp_code NOT IN (${adicionales}) AND
            let employees = result.recordset;
            json = {
                success: true,
                rows: employees,
                message: "Insertar usuarios adicionales exitoso"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                error: error.message,
                message: "Error en el servidor ruta /tareo/storeUsuariosAdicionales"
            }
        }
        return json
    },
    getHorarios: async () => {
        let json = {}
        try {
            let consHorarios = await db.query(`SELECT * FROM Tareo_ConfigHorario`)
            json = {
                success: true,
                rows: consHorarios,
                message: "Extracción de horarios correctamente"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                error: error.code,
                message: "Error en el servidor ruta /tareo/getHorarios"
            }
        }
        return json
    },
    getHorariosByDepartment: async (Data) => {
        let json = {}
        try {
            let consHorarios = await db.query(`SELECT * FROM Tareo_ConfigHorario 
            WHERE idDepartamento = ${Data.Departamento.id} OR ISNULL(idDepartamento)`)
            json = {
                success: true,
                rows: consHorarios,
                message: "Extracción de horarios correctamente"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                error: error.code,
                message: "Error en el servidor ruta /tareo/getHorarios"
            }
        }
        return json
    },
    getCentroCostos: async (Data) => {
        let json = {}
        try {
            let f = new Date()
            let year = f.getFullYear().toString()
            let { Departamento } = Data
            const pool = await poolPromise
            let TDESCRI = `Select C.TDESCRI, A.CT_CENCOS From RSCONCAR..CT0003COST${year.substr(2, 2)} A 
            Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
            WHERE A.CT_CENCOS NOT IN ('00010')
            GROUP BY C.TDESCRI, A.CT_CENCOS
            ORDER BY A.CT_CENCOS asc`;
            const resultQuery = await pool.request()
                .query(TDESCRI)
            let resultTDESCRI = await resultQuery.recordset
            json = {
                success: true,
                rows: resultTDESCRI,
                message: "Extracción de Centro de costos correctamente"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                error: error.code,
                message: "Error en el servidor ruta /tareo/getCentroCostos"
            }
        }
        return json
    },
    diaSemana: (x) => {
        let d = new Date(x);
        var weekday = new Array(7);
        weekday[0] = "Domingo";
        weekday[1] = "Lunes";
        weekday[2] = "Martes";
        weekday[3] = "Miércoles";
        weekday[4] = "Jueves";
        weekday[5] = "Viernes";
        weekday[6] = "Sábado";
        var n = weekday[d.getDay()];
        return n
    },
    diasEntreFechas: (desde, hasta) => {
        var fechaInicio = new Date(desde);
        var fechaFin = new Date(hasta);
        let fechas = []
        while (fechaFin.getTime() >= fechaInicio.getTime()) {
            let yyyy = fechaInicio.getFullYear()
            let mm = (fechaInicio.getMonth() + 1)
            if ((fechaInicio.getMonth() + 1) < 10) {
                mm = "0" + (fechaInicio.getMonth() + 1)
            }
            let dd = fechaInicio.getDate()
            if (fechaInicio.getDate() < 10) {
                dd = "0" + fechaInicio.getDate()
            }
            fechas.push({
                fecha: yyyy + '-' + mm + '-' + dd,
                dia: tareo.diaSemana(Date.parse(yyyy + '/' + mm + '/' + dd))
            })
            fechaInicio.setDate(fechaInicio.getDate() + 1);
        }
        return fechas;
    },
    DatePeriodoSS: (params) => {
        var hoy = new Date(params);
        var mm = hoy.getMonth() + 1;
        var yyyy = hoy.getFullYear();

        if (mm < 10) {
            mm = '0' + mm;
        }
        hoy = yyyy + '' + mm;
        return hoy
    },
    DatePeriodo: (params) => {
        var hoy = new Date(params.split('-').join('/'));
        var mm = hoy.getMonth() + 1;
        var yyyy = hoy.getFullYear();

        if (mm < 10) {
            mm = '0' + mm;
        }
        hoy = yyyy + '' + mm;
        return hoy
    },
    saveCronograma: async (Data) => {
        let json = {}
        try {
            let { Departamento, FechaInicial, FechaFinal, Domingo, Usuario, TipoHorario,
                TipoHorarioSab, UsuarioReg, FechaReg, CC } = Data
            if (tareo.DatePeriodoSS(FechaInicial) == tareo.DatePeriodoSS(FechaFinal)) {
                let periodocerrado = true
                let periodoTareo = await db.query(`SELECT * FROM periodo_tareo WHERE YearMonth = ${tareo.DatePeriodoSS(FechaInicial)}`)
                if (periodoTareo.length != 0) {
                    if (periodoTareo[0].Estado == 0) {
                        periodocerrado = true
                    } else {
                        periodocerrado = false
                    }
                }
                if (periodocerrado == false) {
                    let fechas = tareo.diasEntreFechas(FechaInicial, FechaFinal)
                    let contRegistrados = 0
                    let contActualizados = 0
                    for (let w = 0; w < Usuario.length; w++) {
                        const u = Usuario[w];
                        let consTareoCC = await db.query(`SELECT * FROM tareo_centro_costos WHERE idEmp = ? 
                        and Periodo = ?`, [u.emp_code, tareo.DatePeriodo(fechas[0].fecha)])
                        if (consTareoCC.length == 0) {
                            await db.query(`INSERT INTO tareo_centro_costos (idEmp, idC, NombreCC, Periodo) 
                            VALUES (?,?,?,?)`, [u.emp_code, CC.CT_CENCOS, CC.TDESCRI, tareo.DatePeriodo(fechas[0].fecha)])
                        } else {
                            if (consTareoCC[0].CT_CENCOS != CC.CT_CENCOS) {
                                await db.query(`UPDATE tareo_centro_costos SET idC = ?, NombreCC = ? 
                                WHERE idtareo_centro_costos = ?`, [CC.CT_CENCOS, CC.TDESCRI, consTareoCC[0].idtareo_centro_costos])
                            }
                        }
                        for (let i = 0; i < fechas.length; i++) {
                            const f = fechas[i];
                            let idHorario = 0
                            if (f.dia == "Sábado" && Departamento.dept_code == '00001') {
                                idHorario = TipoHorarioSab.ID
                            } else if (f.dia == "Domingo" && Domingo == true) {
                                idHorario = 99
                            } else {
                                idHorario = TipoHorario.ID
                            }
                            let consCrono = await db.query(`SELECT * FROM Tareo_Cronograma WHERE ID_emp = ? and fec_Crono = ?`,
                                [u.id, f.fecha])
                            if (consCrono.length == 0) {
                                await db.query(`INSERT INTO Tareo_Cronograma (ID_emp, emp_code, department_id, Periodo,
                                    Id_horario, fec_Crono, Fec_registro, user_reg) VALUES (?,?,?,?,?,?,?,?)`, [u.id,
                                u.emp_code, Departamento.id, tareo.DatePeriodo(f.fecha), idHorario, f.fecha,
                                new Date(FechaReg), UsuarioReg])
                                contRegistrados++
                            } else {
                                //UPDATE
                                await db.query(`UPDATE Tareo_Cronograma SET department_id = ?, Periodo = ?, Id_horario = ?, 
                                Fec_registro = ?, user_reg = ? WHERE ID = ?`, [Departamento.id, tareo.DatePeriodo(f.fecha), idHorario,
                                new Date(FechaReg), UsuarioReg, consCrono[0].ID])
                                contActualizados++
                            }
                        }
                    }
                    json = {
                        success: true,
                        message: "Registro de horarios realizado correctamente.",
                        contRegistrados,
                        contActualizados,
                        icon: 'success'
                    }
                } else {
                    json = {
                        success: true,
                        message: "El Periodo se encuentra cerrado, elija otro, por favor.",
                        icon: 'warning'
                    }
                }
            } else {
                json = {
                    success: true,
                    message: "Los periodos no coinciden, elegir fechas en un mismo periodo.",
                    icon: 'warning'
                }
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                error: error.code,
                message: "Error en el servidor -> /tareo/saveCronograma",
                icon: 'error'
            }
        }
        return json
    },
    editObservacionDeHorario: async (observacion, idHorario) => {
        return new Promise((resolve, reject) => {
            db.query(`update Tareo_ConfigHorario set Observacion='${observacion}' where ID=${idHorario}`, (err, results) => {
                if (err) reject(err)
                resolve()
            })
        })
    },
    saveHorario: async (Data) => {
        let json = {}
        try {
            if (Data.TipoHorario == 'Horario') {
                let { Departamento, Permite_HE, Permite_HN, Refrigerio, Es_HorarioNocturno, Permite_Hora_100_porciento, alias, Horario_Abrev,
                    Tiempo_Refrigerio, bgColor, Usuario_Registro, duration, Horario_Inicio, Observacion, CalculaHFeriado, nocturnoParcial } = Data

                let cons_ID = await db.query(`SELECT MAX(ID) as ID FROM Tareo_ConfigHorario WHERE ID < 90`)
                let ID = 1
                if (cons_ID.length != 0) {
                    ID = (cons_ID[0].ID + 1)
                }
                await db.query(`INSERT INTO Tareo_ConfigHorario (ID, alias, in_time, duration, 
                    Permite_HE, Permite_HN, Refrigerio, Tiempo_Refrigerio, Es_HorarioNocturno, Horario_Abrev, 
                    Style, Estado, Usuario_Registro, idDepartamento, CalculaHe100, Observacion,CalculaHFeriado, nocturnoParcial) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [ID, alias, Horario_Inicio, duration, Permite_HE, Permite_HN, Refrigerio,
                    Tiempo_Refrigerio, Es_HorarioNocturno, Horario_Abrev, JSON.stringify({
                        "color": "black",
                        "border-color": "transparent", "background": bgColor
                    }), 1, Usuario_Registro,
                    Departamento.id, Permite_Hora_100_porciento == 1 ? 1 : 0, Observacion, CalculaHFeriado, nocturnoParcial])

            } else {
                let { alias, Horario_Abrev, bgColor, Usuario_Registro, Observacion } = Data
                let cons_ID = await db.query(`SELECT MAX(ID) as ID FROM Tareo_ConfigHorario WHERE ID > 90`)
                let ID = 1
                if (cons_ID.length != 0) {
                    ID = (cons_ID[0].ID + 1)
                }
                await db.query(`INSERT INTO Tareo_ConfigHorario (ID, alias, Horario_Abrev, Estado, Usuario_Registro, 
                Style, Observacion) VALUES (?,?,?,?,?,?,?)`, [ID, alias, Horario_Abrev, 1, Usuario_Registro,
                    JSON.stringify({ "color": "black", "border-color": "transparent", "background": bgColor }), Observacion])
            }

            json = {
                success: true,
                message: "Inserción realizada correctamente",
                icon: "success"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor -> /tareo/saveHorario",
                error: error.code,
                icon: "error"
            }
        }
        return json
    },
    exportExcel: async function (Data) {
        let json = {}
        try {
            const tareoFile = this;
            let { diasEnUnMes, Mes, Anio, rows } = Data
            let rutaTareo = "/template/Tareo.xlsx";
            if (fs.existsSync("./template/Tareo.xlsx")) {
                await fs.unlinkSync("./template/Tareo.xlsx")
            }

            workbook.xlsx.readFile(`./template/PlantillaTareo.xlsx`)
                .then(async function (work) {
                    return new Promise((resolve, reject) => {
                        workbook.eachSheet(async function (worksheet, sheetId) {
                            worksheet.getCell("E1").value = "DIAS"
                            worksheet.getCell("E1").alignment = { vertical: "middle", horizontal: "center" }
                            worksheet.mergeCells(1, 5, 1, diasEnUnMes.length + 4)
                            const initColDays = 5;
                            tareoFile.generateDiasExcel(diasEnUnMes, worksheet);
                            const headers = [{
                                name: "TOTAL HORAS",
                                bgc: "FFFFFF",
                                nameVariable: "totalH"
                            },
                            {
                                name: "DIAS PAGADO",
                                bgc: "FFFFFF",
                                nameVariable: "diasPagados"
                            },
                            {
                                name: "LIC PAGADA",
                                bgc: "E5B8B7",
                                nameVariable: "LGH"
                            },
                            {
                                name: "LSGH",
                                bgc: "FFFFFF",
                                nameVariable: "LSGH"
                            },
                            {
                                name: "VACACIONES",
                                bgc: "92D050",
                                nameVariable: "VAC"
                            },
                            {
                                name: "DIAS FERIADOS",
                                bgc: "E5B8B7",
                                nameVariable: "feriados"
                            },
                            {
                                name: "DIAS SUB",
                                bgc: "FFFFFF",
                                nameVariable: "DSUB"
                            },
                            {
                                name: "DIAS D.M",
                                bgc: "FFFFFF",
                                nameVariable: "DM"
                            },
                            {
                                name: "PERMISOS/DOMING",
                                bgc: "FFFFFF",
                                nameVariable: "D"
                            },
                            {
                                name: "DIAS FALTAS",
                                bgc: "FF0000",
                                nameVariable: "faltas"
                            },
                            {
                                name: "T. DIAS",
                                bgc: "BFBFBF",
                                nameVariable: "totaldias"
                            },
                            {
                                name: "H. ORD",
                                bgc: "BFBFBF",
                                nameVariable: "horasOrdinarias"
                            },
                            {
                                name: "H.E 25",
                                bgc: "FFFF00",
                                nameVariable: "he25"
                            }, {
                                name: "H.E 35",
                                bgc: "92D050",
                                nameVariable: "he35"
                            }, {
                                name: "H.E 100",
                                bgc: "8DB3E2",
                                nameVariable: "he100"
                            }, {
                                name: "H. FERIADO",
                                bgc: "D99594",
                                nameVariable: "hferiados"
                            }, {
                                name: "HT",
                                bgc: "BFBFBF",
                                nameVariable: "ht"
                            },
                            {
                                name: "HORAS NOCTURNA",
                                bgc: "548DD4",
                                nameVariable: "hn"
                            },
                            {
                                name: "H.E 35 NOCTURNA",
                                bgc: "548DD4",
                                nameVariable: "totalHe25Nocturno"
                            },
                            {
                                name: "H.E 100 NOCTURNA",
                                bgc: "548DD4",
                                nameVariable: "totalHe35Nocturno"
                            },
                            {
                                name: "H.E 25 NOCTURNA",
                                bgc: "548DD4",
                                nameVariable: "totalHe100Nocturno"
                            },
                            {
                                name: "PROMEDIO HORAS",
                                bgc: "FFFFFF",
                                nameVariable: "promedioH"
                            }
                            ]
                            tareoFile.generateHeaderVariables(headers, worksheet, diasEnUnMes.length + initColDays)
                            for (let i = 0; i < rows.length; i++) {
                                const c = rows[i]
                                if (!c.registers) {
                                    continue;
                                }

                                let cell = i + 4
                                worksheet.getCell('A' + (cell)).border = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" }
                                }
                                worksheet.getCell('A' + (cell)).font = {
                                    name: 'Calibri',
                                    size: 7
                                }
                                worksheet.getCell('A' + (cell)).value = c.TIPO_PANILLA
                                worksheet.getCell('B' + (cell)).border = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" }
                                }
                                worksheet.getCell('B' + (cell)).font = {
                                    name: 'Calibri',
                                    size: 7
                                }
                                worksheet.getCell('B' + (cell)).value = c.CentroCostos
                                worksheet.getCell('C' + (cell)).border = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" }
                                }
                                worksheet.getCell('C' + (cell)).font = {
                                    name: 'Calibri',
                                    size: 7
                                }
                                worksheet.getCell('C' + (cell)).value = c.emp_code
                                worksheet.getCell('D' + (cell)).border = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" }
                                }
                                worksheet.getCell('D' + (cell)).font = {
                                    name: 'Calibri',
                                    size: 7
                                }
                                worksheet.getCell('D' + (cell)).value = c.last_name + " " + c.first_name
                                tareoFile.generateDataRegisterExcel(c.registers, worksheet, cell)
                                const total = c.registers.find((r) => r.dia == "TOTAL");
                                const diasPagados = c.variables.diasPagados;
                                tareoFile.generateBodyVariables({ ...c.variables, totalH: total.horas, promedioH: parseFloat(diasPagados) === 0 ? 0 : parseFloat(parseFloat(total.horas) / parseFloat(diasPagados)).toFixed(2) }, headers, worksheet, diasEnUnMes.length + initColDays, cell)
                            }
                            worksheet.columns.forEach(function (column, i) {
                                if (column["_number"] >= 3 && column["_number"] <= diasEnUnMes.length + 2) {
                                    column.width = 4;
                                }
                            });
                            setTimeout(() => resolve(), 2000);
                        })
                    }).then(data => {
                        workbook.xlsx.writeFile("./template/Tareo.xlsx").then(function () {
                            console.log("xls file is written.");
                        });
                    })
                });
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                icon: "success",
                rutaTareo
            }
        } catch (error) {
            console.log('error :>> ', error)
            json = {
                error: error.code,
                message: "Error en el servidor",
                icon: "error",
                success: false
            }
        }
        return json
    },
    getEmailsRrhh: function () {
        return new Promise((resolve, reject) => {
            db.query("select correo from destinatario_rrhh", (err, results) => {
                if (err) reject(err)
                resolve(results.map(result => result.correo))
            })
        })
    },
    exportBufferExelConsultaDetall: async function (params) {
        const rutaTemplateConsultaDetalle = "/template/tareoConsultaDetalle.xlsx";
        try {
            let { data, fechaIni, fechaFin, destinatarios } = params;
            if (fs.existsSync(`.${rutaTemplateConsultaDetalle}`)) {
                fs.unlinkSync(`.${rutaTemplateConsultaDetalle}`);
            }
            await workbook.xlsx.readFile("./template/PlantillaTareoConsultaDetallev2.xlsx");
            workbook.eachSheet(async (worksheet, sheetId) => {
                tareo.cuerpoExcelConsultaDetallada(worksheet, fechaIni, fechaFin, data);
            })
            const bufferExcel = await workbook.xlsx.writeBuffer()
            console.log('se cargo el buffer del excel cron');
            sendEmailModel.sendEmail(`Consulta semanal de asistencias de las fechas: ${fechaIni} al ${fechaFin}`, destinatarios, `<strong>Se filtran las asistencias detalladas de los empleados administrativos</strong>`, '"Supergen SA" <infosupergen@gmail.com>', [{ filename: "consulta detalle.xlsx", content: Buffer.from(bufferExcel) }])
        } catch (error) {
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateConsultaDetalle,
                error: error.message
            }
            console.error(json)
        }
    },
    exportExcelConsultaDetalle: async function (params) {

        const rutaTemplateConsultaDetalle = "/template/tareoConsultaDetalle.xlsx";
        try {

            let { data, fechaIni, fechaFin } = params;
            if (fs.existsSync(`.${rutaTemplateConsultaDetalle}`)) {
                fs.unlinkSync(`.${rutaTemplateConsultaDetalle}`);
            }

            workbook.xlsx.readFile("./template/PlantillaTareoConsultaDetallev2.xlsx").then((work) => {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        tareo.cuerpoExcelConsultaDetallada(worksheet, fechaIni, fechaFin, data);
                        setTimeout(() => resolve(), 2000);

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateConsultaDetalle}`).then(() => {
                        console.log('xls file is write');
                    })
                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                path: rutaTemplateConsultaDetalle
            }

        } catch (error) {
            console.log(error);

            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateCPHI
            }
        }
        return json;
    },

    cuerpoExcelConsultaDetallada: function (worksheet, fechaIni, fechaFin, data) {
        try {
            worksheet.name = 'Asistencia';
            const totalDays = moment(fechaFin).diff(moment(fechaIni), 'd');
            let workersAsistance = [];

            tareo.generateDatesInFormatExcelTableConsultaDetallev2(totalDays, fechaIni, worksheet);
            tareo.generateHeadersAsistRefriSaliInFormatExcelTableConsultaDetallev2(totalDays, worksheet);

            workersAsistance = tareo.dataInFormatExcelTableConsultaDetallev2(data, fechaIni, totalDays);
            
            console.log(' total $$$$$$$$ ', JSON.stringify(workersAsistance));
            tareo.generateDataInFormatExcelTableConsultaDetallev2(totalDays, fechaIni, worksheet, workersAsistance);


        } catch (error) {
            console.error(error)
        }
    },
    generateDatesInFormatExcelTableConsultaDetallev2: function (totalIteraciones, fechaIni, worksheet) {
        const totalColumnsMerge = 8;
        let initialPositionRow = 5;
        let initialPositionColumn = 3;
        let finalPositionRow = 5;
        let finalPositionColumn = 10;

        let row = worksheet.getRow(5);
        let rowInitialPosition = initialPositionRow;
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        const styleCell = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '002060' }
        }
        const styleCell2 = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '366092' }
        }
        const fontStyle = {
            bold: true,
        }
        const fontStyle1 = {
            bold: true,
            color: { argb: 'FFFFFF' }
        }

        for (let i = 0; i <= totalIteraciones; i++) {
            if (i == 0) {
                worksheet.mergeCells(initialPositionRow, initialPositionColumn, finalPositionRow, finalPositionColumn);
                row.getCell(initialPositionRow).value = moment(fechaIni).format('DD-MM-YYYY');
                row.getCell(initialPositionRow).alignment = { vertical: "middle", horizontal: "center" };
                row.getCell(initialPositionRow).fill = styleCell;
                row.getCell(initialPositionRow).border = borderStyles;
                row.getCell(initialPositionRow).font = fontStyle1;


            } else {
                initialPositionColumn += totalColumnsMerge;
                finalPositionColumn += totalColumnsMerge;
                //rowInitialPosition += totalColumnsMerge;
                if((i % 2) == 0){
                    worksheet.mergeCells(initialPositionRow, initialPositionColumn, finalPositionRow, finalPositionColumn);
                    row.getCell(initialPositionColumn).value = moment(moment(fechaIni), 'DD-MM-YYYY').add(i, 'd').format('DD-MM-YYYY');
                    row.getCell(initialPositionColumn).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(initialPositionColumn).fill = styleCell;
                    row.getCell(initialPositionColumn).border = borderStyles;
                    row.getCell(initialPositionColumn).font = fontStyle1;
                } else {
                    worksheet.mergeCells(initialPositionRow, initialPositionColumn, finalPositionRow, finalPositionColumn);
                    row.getCell(initialPositionColumn).value = moment(moment(fechaIni), 'DD-MM-YYYY').add(i, 'd').format('DD-MM-YYYY');
                    row.getCell(initialPositionColumn).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(initialPositionColumn).fill = styleCell2;
                    row.getCell(initialPositionColumn).border = borderStyles;
                    row.getCell(initialPositionColumn).font = fontStyle;
                }
                

            }
        }
    },
    generateHeadersAsistRefriSaliInFormatExcelTableConsultaDetallev2: function (totalIteraciones, worksheet) {
        const totalColumnsMerge = 8;
        //turno 1
        let initialPositionRowTurno1 = 6;
        let initialPositionColumnTurno1 = 3;
        let finalPositionRowTurno1 = 6;
        let finalPositionColumnTurno1 = 6;

        let initialPositionRowTurno1Ingreso = 8;
        let initialPositionColumnTurno1Ingreso = 3;
        let initialPositionRowTurno1IngresoSede = 8;
        let initialPositionColumnTurno1IngresoSede = 4;
        let initialPositionRowTurno1Salida = 8;
        let initialPositionColumnTurno1Salida = 5;
        let initialPositionRowTurno1SalidaSede = 8;
        let initialPositionColumnTurno1SalidaSede = 6;

        //turno 2
        let initialPositionRowTurno2 = 6;
        let initialPositionColumnTurno2 = 7;
        let finalPositionRowTurno2 = 6;
        let finalPositionColumnTurno2 = 10;

        let initialPositionRowTurno2Ingreso = 7;
        let initialPositionColumnTurno2Ingreso = 7;
        let initialPositionRowTurno2IngresoSede = 7;
        let initialPositionColumnTurno2IngresoSede = 8;
        let initialPositionRowTurno2Salida = 7;
        let initialPositionColumnTurno2Salida = 9;
        let initialPositionRowTurno2SalidaSede = 7;
        let initialPositionColumnTurno2SalidaSede = 10;

        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };

        const styleCellTitle = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '002060' }
        }
        const styleCellTitle2 = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '366092' }
        }
        const styleCellTurno1 = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '92CDDC' }
        }
        const styleCellTurno2 = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'A6A6A6' }
        }
        const styleCellTurno12 = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DAEEF3' }
        }
        const styleCellTurno22 = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D9D9D9' }
        }

        const fontStyle = {
            bold: true,
        }
        const fontStyle1 = {
            bold: true,
            color: { argb: 'FFFFFF' },
        }

        let row4 = worksheet.getRow(4);
        let row6 = worksheet.getRow(6);
        let row7 = worksheet.getRow(7);
        for (let i = 0; i <= totalIteraciones; i++) {
            if (i == 0) {
                worksheet.mergeCells(4, initialPositionColumnTurno1, 4, finalPositionColumnTurno2);
                row4.getCell(initialPositionColumnTurno1).value = 'DIA';
                row4.getCell(initialPositionColumnTurno1).alignment = { vertical: "middle", horizontal: "center" };
                row4.getCell(initialPositionColumnTurno1).fill = styleCellTitle;
                row4.getCell(initialPositionColumnTurno1).border = borderStyles;
                row4.getCell(initialPositionColumnTurno1).font = fontStyle1;
                // Asistencia
                worksheet.mergeCells(initialPositionRowTurno1, initialPositionColumnTurno1, finalPositionRowTurno1, finalPositionColumnTurno1);
                row6.getCell(initialPositionColumnTurno1).value = 'TURNO 1'
                row6.getCell(initialPositionColumnTurno1).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(initialPositionColumnTurno1).fill = styleCellTurno1;
                row6.getCell(initialPositionColumnTurno1).border = borderStyles;
                row6.getCell(initialPositionColumnTurno1).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1Ingreso).value = 'INGRESO'
                row7.getCell(initialPositionColumnTurno1Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1Ingreso).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1Ingreso).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1Ingreso).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1IngresoSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno1IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1IngresoSede).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1IngresoSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1IngresoSede).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1Salida).value = 'SALIDA'
                row7.getCell(initialPositionColumnTurno1Salida).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1Salida).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1Salida).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1Salida).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1SalidaSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno1SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1SalidaSede).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1SalidaSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1SalidaSede).font = fontStyle;

                worksheet.mergeCells(initialPositionRowTurno2, initialPositionColumnTurno2, finalPositionRowTurno2, finalPositionColumnTurno2);
                row6.getCell(initialPositionColumnTurno2).value = 'TURNO 2'
                row6.getCell(initialPositionColumnTurno2).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(initialPositionColumnTurno2).fill = styleCellTurno2;
                row6.getCell(initialPositionColumnTurno2).border = borderStyles;
                row6.getCell(initialPositionColumnTurno2).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2Ingreso).value = 'INGRESO'
                row7.getCell(initialPositionColumnTurno2Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2Ingreso).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2Ingreso).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2Ingreso).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2IngresoSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno2IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2IngresoSede).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2IngresoSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2IngresoSede).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2Salida).value = 'SALIDA'
                row7.getCell(initialPositionColumnTurno2Salida).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2Salida).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2Salida).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2Salida).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2SalidaSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno2SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2SalidaSede).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2SalidaSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2SalidaSede).font = fontStyle;

            } else {
                initialPositionColumnTurno1 += totalColumnsMerge;
                finalPositionColumnTurno1 += totalColumnsMerge;
                initialPositionColumnTurno1Ingreso += totalColumnsMerge;
                initialPositionColumnTurno1IngresoSede += totalColumnsMerge;
                initialPositionColumnTurno1Salida += totalColumnsMerge;
                initialPositionColumnTurno1SalidaSede += totalColumnsMerge;

                initialPositionColumnTurno2 += totalColumnsMerge;
                finalPositionColumnTurno2 += totalColumnsMerge;
                initialPositionColumnTurno2Ingreso += totalColumnsMerge;
                initialPositionColumnTurno2IngresoSede += totalColumnsMerge;
                initialPositionColumnTurno2Salida += totalColumnsMerge;
                initialPositionColumnTurno2SalidaSede += totalColumnsMerge;
                if((i%2)==0){
                    worksheet.mergeCells(4, initialPositionColumnTurno1, 4, finalPositionColumnTurno2);
                    row4.getCell(initialPositionColumnTurno1).value = 'DIA';
                    row4.getCell(initialPositionColumnTurno1).alignment = { vertical: "middle", horizontal: "center" };
                    row4.getCell(initialPositionColumnTurno1).fill = styleCellTitle;
                    row4.getCell(initialPositionColumnTurno1).border = borderStyles;
                    row4.getCell(initialPositionColumnTurno1).font = fontStyle1;    
                } else {
                    worksheet.mergeCells(4, initialPositionColumnTurno1, 4, finalPositionColumnTurno2);
                    row4.getCell(initialPositionColumnTurno1).value = 'DIA';
                    row4.getCell(initialPositionColumnTurno1).alignment = { vertical: "middle", horizontal: "center" };
                    row4.getCell(initialPositionColumnTurno1).fill = styleCellTitle2;
                    row4.getCell(initialPositionColumnTurno1).border = borderStyles;
                    row4.getCell(initialPositionColumnTurno1).font = fontStyle;    
                }
                
                worksheet.mergeCells(initialPositionRowTurno1, initialPositionColumnTurno1, finalPositionRowTurno1, finalPositionColumnTurno1);
                row6.getCell(initialPositionColumnTurno1).value = 'TURNO 1'
                row6.getCell(initialPositionColumnTurno1).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(initialPositionColumnTurno1).fill = styleCellTurno1;
                row6.getCell(initialPositionColumnTurno1).border = borderStyles;
                row6.getCell(initialPositionColumnTurno1).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1Ingreso).value = 'INGRESO'
                row7.getCell(initialPositionColumnTurno1Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1Ingreso).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1Ingreso).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1Ingreso).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1IngresoSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno1IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1IngresoSede).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1IngresoSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1IngresoSede).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1Salida).value = 'SALIDA'
                row7.getCell(initialPositionColumnTurno1Salida).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1Salida).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1Salida).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1Salida).font = fontStyle;

                row7.getCell(initialPositionColumnTurno1SalidaSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno1SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno1SalidaSede).fill = styleCellTurno12;
                row7.getCell(initialPositionColumnTurno1SalidaSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno1SalidaSede).font = fontStyle;

                worksheet.mergeCells(initialPositionRowTurno2, initialPositionColumnTurno2, finalPositionRowTurno2, finalPositionColumnTurno2);
                row6.getCell(initialPositionColumnTurno2).value = 'TURNO 2'
                row6.getCell(initialPositionColumnTurno2).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(initialPositionColumnTurno2).fill = styleCellTurno2;
                row6.getCell(initialPositionColumnTurno2).border = borderStyles;
                row6.getCell(initialPositionColumnTurno2).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2Ingreso).value = 'INGRESO'
                row7.getCell(initialPositionColumnTurno2Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2Ingreso).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2Ingreso).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2Ingreso).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2IngresoSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno2IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2IngresoSede).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2IngresoSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2IngresoSede).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2Salida).value = 'SALIDA'
                row7.getCell(initialPositionColumnTurno2Salida).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2Salida).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2Salida).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2Salida).font = fontStyle;

                row7.getCell(initialPositionColumnTurno2SalidaSede).value = 'SEDE'
                row7.getCell(initialPositionColumnTurno2SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                row7.getCell(initialPositionColumnTurno2SalidaSede).fill = styleCellTurno22;
                row7.getCell(initialPositionColumnTurno2SalidaSede).border = borderStyles;
                row7.getCell(initialPositionColumnTurno2SalidaSede).font = fontStyle;

            }
        }
    },
    generateDatesInFormatExcelTableConsultaDetalle: function (totalIteraciones, fechaIni, worksheet) {
        const totalColumnsMerge = 10;
        let initialPositionRow = 4;
        let initialPositionColumn = 3;
        let finalPositionRow = 4;
        let finalPositionColumn = 12;

        let row = worksheet.getRow(4);
        let rowInitialPosition = initialPositionRow;
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        const styleCell = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'bf9000' }
        }
        const fontStyle = {
            bold: true,
        }

        for (let i = 0; i <= totalIteraciones; i++) {
            if (i == 0) {
                worksheet.mergeCells(initialPositionRow, initialPositionColumn, finalPositionRow, finalPositionColumn);
                row.getCell(initialPositionRow).value = moment(fechaIni).format('YYYY-MM-DD');
                row.getCell(initialPositionRow).alignment = { vertical: "middle", horizontal: "center" };
                row.getCell(initialPositionRow).fill = styleCell;
                row.getCell(initialPositionRow).border = borderStyles;
                row.getCell(initialPositionRow).font = fontStyle;


            } else {
                initialPositionColumn += totalColumnsMerge;
                finalPositionColumn += totalColumnsMerge;
                rowInitialPosition += totalColumnsMerge;
                worksheet.mergeCells(initialPositionRow, initialPositionColumn, finalPositionRow, finalPositionColumn);
                row.getCell(rowInitialPosition).value = moment(moment(fechaIni), 'YYYY-MM-DD').add(i, 'd').format('YYYY-MM-DD');
                row.getCell(rowInitialPosition).alignment = { vertical: "middle", horizontal: "center" };
                row.getCell(rowInitialPosition).fill = styleCell;
                row.getCell(rowInitialPosition).border = borderStyles;
                row.getCell(rowInitialPosition).font = fontStyle;

            }
        }
    },
    generateHeadersAsistRefriSaliInFormatExcelTableConsultaDetalle: function (totalIteraciones, worksheet) {
        const totalColumnsMerge = 10;

        // Asistencia
        let initialPositionRowAsist = 5;
        let initialPositionColumnAsist = 3;
        let finalPositionRowAsist = 5;
        let finalPositionColumnAsist = 5;

        let initialPositionRowAsistIngre = 6;
        let initialPositionColumnAsistIngre = 3;
        let initialPositionRowAsistEsta = 6;
        let initialPositionColumnAsistEsta = 4;
        let initialPositionRowAsistObs = 6;
        let initialPositionColumnAsistObs = 5;


        // Refrigerio
        let initialPositionRowRefri = 5;
        let initialPositionColumnRefri = 6;
        let finalPositionRowRefri = 5;
        let finalPositionColumnRefri = 9;

        let initialPositionRowRefriSali = 6;
        let initialPositionColumnRefriSali = 6;
        let initialPositionRowRefriIngre = 6;
        let initialPositionColumnRefriIngre = 7;
        let initialPositionRowRefriEsta = 6;
        let initialPositionColumnRefriEsta = 8;
        let initialPositionRowRefriObs = 6;
        let initialPositionColumnRefriObs = 9;


        // Salida
        let initialPositionRowSali = 5;
        let initialPositionColumnSali = 10;
        let finalPositionRowSali = 5;
        let finalPositionColumnSali = 12;

        let initialPositionRowSaliIngre = 6;
        let initialPositionColumnSaliIngre = 10;
        let initialPositionRowSaliEsta = 6;
        let initialPositionColumnSaliEsta = 11;
        let initialPositionRowSaliObs = 6;
        let initialPositionColumnSaliObs = 12;




        let row5 = worksheet.getRow(5);
        let row6 = worksheet.getRow(6);
        let rowInitialPositionAsist = initialPositionColumnAsist;
        let rowInitialPositionAsistIngre = initialPositionColumnAsistIngre;
        let rowInitialPositionAsistEsta = initialPositionColumnAsistEsta;
        let rowInitialPositionAsistObs = initialPositionColumnAsistObs;

        let rowInitialPositionRefri = initialPositionColumnRefri;
        let rowInitialPositionRefriSali = initialPositionColumnRefriSali;
        let rowInitialPositionRefriIngre = initialPositionColumnRefriIngre;
        let rowInitialPositionRefriEsta = initialPositionColumnRefriEsta;
        let rowInitialPositionRefriObs = initialPositionColumnRefriObs;

        let rowInitialPositionSali = initialPositionColumnSali;
        let rowInitialPositionSaliIngre = initialPositionColumnSaliIngre;
        let rowInitialPositionSaliEsta = initialPositionColumnSaliEsta;
        let rowInitialPositionSaliObs = initialPositionColumnSaliObs;

        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };

        const styleCellAsist = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'bfbfbf' }
        }
        const styleCellRefri = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '8faadc' }
        }
        const styleCellSali = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'a9d18e' }
        }

        const fontStyle = {
            bold: true,
        }

        for (let i = 0; i <= totalIteraciones; i++) {
            if (i == 0) {
                // Asistencia
                worksheet.mergeCells(initialPositionRowAsist, initialPositionColumnAsist, finalPositionRowAsist, finalPositionColumnAsist);
                row5.getCell(rowInitialPositionAsist).value = 'ASISTENCIA'
                row5.getCell(rowInitialPositionAsist).alignment = { vertical: "middle", horizontal: "center" };
                row5.getCell(rowInitialPositionAsist).fill = styleCellAsist;
                row5.getCell(rowInitialPositionAsist).border = borderStyles;
                row5.getCell(rowInitialPositionAsist).font = fontStyle;

                row6.getCell(rowInitialPositionAsistIngre).value = 'INGRESO'
                row6.getCell(rowInitialPositionAsistIngre).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionAsistIngre).fill = styleCellAsist;
                row6.getCell(rowInitialPositionAsistIngre).border = borderStyles;
                row6.getCell(rowInitialPositionAsistIngre).font = fontStyle;

                row6.getCell(rowInitialPositionAsistEsta).value = 'ESTADO'
                row6.getCell(rowInitialPositionAsistEsta).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionAsistEsta).fill = styleCellAsist;
                row6.getCell(rowInitialPositionAsistEsta).border = borderStyles;
                row6.getCell(rowInitialPositionAsistEsta).font = fontStyle;

                row6.getCell(rowInitialPositionAsistObs).value = 'OBS.'
                row6.getCell(rowInitialPositionAsistObs).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionAsistObs).fill = styleCellAsist;
                row6.getCell(rowInitialPositionAsistObs).border = borderStyles;
                row6.getCell(rowInitialPositionAsistObs).font = fontStyle;


                // Refrigerio
                worksheet.mergeCells(initialPositionRowRefri, initialPositionColumnRefri, finalPositionRowRefri, finalPositionColumnRefri);
                row5.getCell(rowInitialPositionRefri).value = 'REFRIGERIO'
                row5.getCell(rowInitialPositionRefri).alignment = { vertical: "middle", horizontal: "center" };
                row5.getCell(rowInitialPositionRefri).fill = styleCellRefri;
                row5.getCell(rowInitialPositionRefri).border = borderStyles;
                row5.getCell(rowInitialPositionRefri).font = fontStyle;

                row6.getCell(rowInitialPositionRefriSali).value = 'SALIDA'
                row6.getCell(rowInitialPositionRefriSali).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriSali).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriSali).border = borderStyles;
                row6.getCell(rowInitialPositionRefriSali).font = fontStyle;

                row6.getCell(rowInitialPositionRefriIngre).value = 'INGRESO'
                row6.getCell(rowInitialPositionRefriIngre).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriIngre).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriIngre).border = borderStyles;
                row6.getCell(rowInitialPositionRefriIngre).font = fontStyle;

                row6.getCell(rowInitialPositionRefriEsta).value = 'ESTADO'
                row6.getCell(rowInitialPositionRefriEsta).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriEsta).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriEsta).border = borderStyles;
                row6.getCell(rowInitialPositionRefriEsta).font = fontStyle;

                row6.getCell(rowInitialPositionRefriObs).value = 'OBS.'
                row6.getCell(rowInitialPositionRefriObs).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriObs).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriObs).border = borderStyles;
                row6.getCell(rowInitialPositionRefriObs).font = fontStyle;


                // Salida
                worksheet.mergeCells(initialPositionRowSali, initialPositionColumnSali, finalPositionRowSali, finalPositionColumnSali);
                row5.getCell(rowInitialPositionSali).value = 'SALIDA'
                row5.getCell(rowInitialPositionSali).alignment = { vertical: "middle", horizontal: "center" };
                row5.getCell(rowInitialPositionSali).fill = styleCellSali;
                row5.getCell(rowInitialPositionSali).border = borderStyles;
                row5.getCell(rowInitialPositionSali).font = fontStyle;

                row6.getCell(rowInitialPositionSaliIngre).value = 'INGRESO'
                row6.getCell(rowInitialPositionSaliIngre).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionSaliIngre).fill = styleCellSali;
                row6.getCell(rowInitialPositionSaliIngre).border = borderStyles;
                row6.getCell(rowInitialPositionSaliIngre).font = fontStyle;

                row6.getCell(rowInitialPositionSaliEsta).value = 'ESTADO'
                row6.getCell(rowInitialPositionSaliEsta).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionSaliEsta).fill = styleCellSali;
                row6.getCell(rowInitialPositionSaliEsta).border = borderStyles;
                row6.getCell(rowInitialPositionSaliEsta).font = fontStyle;

                row6.getCell(rowInitialPositionSaliObs).value = 'OBS.'
                row6.getCell(rowInitialPositionSaliObs).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionSaliObs).fill = styleCellSali;
                row6.getCell(rowInitialPositionSaliObs).border = borderStyles;
                row6.getCell(rowInitialPositionSaliObs).font = fontStyle;

            } else {
                // Asistencia
                initialPositionColumnAsist += totalColumnsMerge;
                finalPositionColumnAsist += totalColumnsMerge;
                rowInitialPositionAsist += totalColumnsMerge;
                worksheet.mergeCells(initialPositionRowAsist, initialPositionColumnAsist, finalPositionRowAsist, finalPositionColumnAsist);
                row5.getCell(rowInitialPositionAsist).value = 'ASISTENCIA'
                row5.getCell(rowInitialPositionAsist).alignment = { vertical: "middle", horizontal: "center" };
                row5.getCell(rowInitialPositionAsist).fill = styleCellAsist;
                row5.getCell(rowInitialPositionAsist).border = borderStyles;
                row5.getCell(rowInitialPositionAsist).font = fontStyle;

                rowInitialPositionAsistIngre += totalColumnsMerge;
                row6.getCell(rowInitialPositionAsistIngre).value = 'INGRESO'
                row6.getCell(rowInitialPositionAsistIngre).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionAsistIngre).fill = styleCellAsist;
                row6.getCell(rowInitialPositionAsistIngre).border = borderStyles;
                row6.getCell(rowInitialPositionAsistIngre).font = fontStyle;

                rowInitialPositionAsistEsta += totalColumnsMerge;
                row6.getCell(rowInitialPositionAsistEsta).value = 'ESTADO'
                row6.getCell(rowInitialPositionAsistEsta).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionAsistEsta).fill = styleCellAsist;
                row6.getCell(rowInitialPositionAsistEsta).border = borderStyles;
                row6.getCell(rowInitialPositionAsistEsta).font = fontStyle;

                rowInitialPositionAsistObs += totalColumnsMerge;
                row6.getCell(rowInitialPositionAsistObs).value = 'OBS.'
                row6.getCell(rowInitialPositionAsistObs).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionAsistObs).fill = styleCellAsist;
                row6.getCell(rowInitialPositionAsistObs).border = borderStyles;
                row6.getCell(rowInitialPositionAsistObs).font = fontStyle;



                // Refrigerio
                initialPositionColumnRefri += totalColumnsMerge;
                finalPositionColumnRefri += totalColumnsMerge;
                rowInitialPositionRefri += totalColumnsMerge;
                worksheet.mergeCells(initialPositionRowRefri, initialPositionColumnRefri, finalPositionRowRefri, finalPositionColumnRefri);
                row5.getCell(rowInitialPositionRefri).value = 'REFRIGERIO'
                row5.getCell(rowInitialPositionRefri).alignment = { vertical: "middle", horizontal: "center" };
                row5.getCell(rowInitialPositionRefri).fill = styleCellRefri;
                row5.getCell(rowInitialPositionRefri).border = borderStyles;
                row5.getCell(rowInitialPositionRefri).font = fontStyle;

                rowInitialPositionRefriSali += totalColumnsMerge;
                row6.getCell(rowInitialPositionRefriSali).value = 'SALIDA'
                row6.getCell(rowInitialPositionRefriSali).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriSali).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriSali).border = borderStyles;
                row6.getCell(rowInitialPositionRefriSali).font = fontStyle;

                rowInitialPositionRefriIngre += totalColumnsMerge;
                row6.getCell(rowInitialPositionRefriIngre).value = 'INGRESO'
                row6.getCell(rowInitialPositionRefriIngre).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriIngre).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriIngre).border = borderStyles;
                row6.getCell(rowInitialPositionRefriIngre).font = fontStyle;

                rowInitialPositionRefriEsta += totalColumnsMerge;
                row6.getCell(rowInitialPositionRefriEsta).value = 'ESTADO'
                row6.getCell(rowInitialPositionRefriEsta).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriEsta).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriEsta).border = borderStyles;
                row6.getCell(rowInitialPositionRefriEsta).font = fontStyle;

                rowInitialPositionRefriObs += totalColumnsMerge;
                row6.getCell(rowInitialPositionRefriObs).value = 'OBS.'
                row6.getCell(rowInitialPositionRefriObs).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionRefriObs).fill = styleCellRefri;
                row6.getCell(rowInitialPositionRefriObs).border = borderStyles;
                row6.getCell(rowInitialPositionRefriObs).font = fontStyle;


                // Salida
                initialPositionColumnSali += totalColumnsMerge;
                finalPositionColumnSali += totalColumnsMerge;
                rowInitialPositionSali += totalColumnsMerge;
                worksheet.mergeCells(initialPositionRowSali, initialPositionColumnSali, finalPositionRowSali, finalPositionColumnSali);
                row5.getCell(rowInitialPositionSali).value = 'SALIDA'
                row5.getCell(rowInitialPositionSali).alignment = { vertical: "middle", horizontal: "center" };
                row5.getCell(rowInitialPositionSali).fill = styleCellSali;
                row5.getCell(rowInitialPositionSali).border = borderStyles;
                row5.getCell(rowInitialPositionSali).font = fontStyle;

                rowInitialPositionSaliIngre += totalColumnsMerge;
                row6.getCell(rowInitialPositionSaliIngre).value = 'SALIDA'
                row6.getCell(rowInitialPositionSaliIngre).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionSaliIngre).fill = styleCellSali;
                row6.getCell(rowInitialPositionSaliIngre).border = borderStyles;
                row6.getCell(rowInitialPositionSaliIngre).font = fontStyle;

                rowInitialPositionSaliEsta += totalColumnsMerge;
                row6.getCell(rowInitialPositionSaliEsta).value = 'ESTADO'
                row6.getCell(rowInitialPositionSaliEsta).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionSaliEsta).fill = styleCellSali;
                row6.getCell(rowInitialPositionSaliEsta).border = borderStyles;
                row6.getCell(rowInitialPositionSaliEsta).font = fontStyle;

                rowInitialPositionSaliObs += totalColumnsMerge;
                row6.getCell(rowInitialPositionSaliObs).value = 'OBS.'
                row6.getCell(rowInitialPositionSaliObs).alignment = { vertical: "middle", horizontal: "center" };
                row6.getCell(rowInitialPositionSaliObs).fill = styleCellSali;
                row6.getCell(rowInitialPositionSaliObs).border = borderStyles;
                row6.getCell(rowInitialPositionSaliObs).font = fontStyle;

            }
        }
    },
    generateDataInFormatExcelTableConsultaDetallev2: function (totalIteraciones, fechaIni, worksheet, workersAsistance) {
        const totalColumnsMerge = 8;
        let countRow = 8;

        let defaultPositionColumnTurno1Ingreso = 3;
        let defaultPositionColumnTurno1IngresoSede = 4;
        let defaultPositionColumnTurno1Salida = 5;
        let defaultPositionColumnTurno1SalidaSede = 6;

        let defaultPositionColumnTurno2Ingreso = 7;
        let defaultPositionColumnTurno2IngresoSede = 8;
        let defaultPositionColumnTurno2Salida = 9;
        let defaultPositionColumnTurno2SalidaSede = 10;

        let initialPositionRowNombre = countRow;
        let initialPositionColumnNombre = 1;

        let row = worksheet.getRow(countRow);
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };

        const styleCellNombre = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '999999' }
        }
        const styleCellTitle = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '002060' }
        }
        const styleCell1 = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DBE5F0' }
        }

        const fontStyle = {
            bold: false,
            size: 9,
        }

        var value = '';
        workersAsistance.forEach(worker => {
            row.getCell(initialPositionColumnNombre).value = worker.nombre;
            row.getCell(initialPositionColumnNombre).alignment = { vertical: "middle", horizontal: "center" };
            // row.getCell(rowInitialPositionNombre).fill = styleCellNombre;
            row.getCell(initialPositionColumnNombre).border = borderStyles;
            row.getCell(initialPositionColumnNombre).font = fontStyle;

            row.getCell(2).value = worker.departamento;
            row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
            // row.getCell(rowInitialPositionNombre).fill = styleCellNombre;
            row.getCell(2).border = borderStyles;
            row.getCell(2).font = fontStyle;

            for (let i = 0; i <= totalIteraciones; i++) {
                if((i%2)==0){
                    var styleCell2 = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'DBE5F0' }
                    }
                } else {
                    var styleCell2 = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFF' }
                    }
                }
                if (i == 0) {
                    // Asistencia
                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno1.entrada;
                    row.getCell(defaultPositionColumnTurno1Ingreso).value = value;
                    row.getCell(defaultPositionColumnTurno1Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1Ingreso).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1Ingreso).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1Ingreso).font = fontStyle;

                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno1.entrada_sede;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).value = value;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1IngresoSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).font = fontStyle;

                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno1.salida;
                    row.getCell(defaultPositionColumnTurno1Salida).value = value;
                    row.getCell(defaultPositionColumnTurno1Salida).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1Salida).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1Salida).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1Salida).font = fontStyle;

                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno1.salida_sede;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).value = value;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1SalidaSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).font = fontStyle;

                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno2.entrada;
                    row.getCell(defaultPositionColumnTurno2Ingreso).value = value;
                    row.getCell(defaultPositionColumnTurno2Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2Ingreso).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2Ingreso).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2Ingreso).font = fontStyle;

                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno2.entrada_sede;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).value = value;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2IngresoSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).font = fontStyle;

                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno2.salida;
                    row.getCell(defaultPositionColumnTurno2Salida).value = value;
                    row.getCell(defaultPositionColumnTurno2Salida).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2Salida).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2Salida).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2Salida).font = fontStyle;

                    value = worker[moment(fechaIni).format('YYYY-MM-DD')].turno2.salida_sede;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).value = value;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2SalidaSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).font = fontStyle;

                } else {
                    let keyDate = moment(moment(fechaIni), 'YYYY-MM-DD').add(i, 'd').format('YYYY-MM-DD');
                    defaultPositionColumnTurno1Ingreso += totalColumnsMerge;
                    value = worker[keyDate].turno1.entrada;
                    row.getCell(defaultPositionColumnTurno1Ingreso).value = value;
                    row.getCell(defaultPositionColumnTurno1Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1Ingreso).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1Ingreso).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1Ingreso).font = fontStyle;
                    
                    defaultPositionColumnTurno1IngresoSede += totalColumnsMerge;
                    value = worker[keyDate].turno1.entrada_sede;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).value = value;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1IngresoSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1IngresoSede).font = fontStyle;

                    defaultPositionColumnTurno1Salida += totalColumnsMerge;
                    value = worker[keyDate].turno1.salida;
                    row.getCell(defaultPositionColumnTurno1Salida).value = value;
                    row.getCell(defaultPositionColumnTurno1Salida).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1Salida).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1Salida).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1Salida).font = fontStyle;

                    defaultPositionColumnTurno1SalidaSede += totalColumnsMerge;
                    value = worker[keyDate].turno1.salida_sede;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).value = value;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno1SalidaSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno1SalidaSede).font = fontStyle;

                    defaultPositionColumnTurno2Ingreso += totalColumnsMerge;
                    value = worker[keyDate].turno2.entrada;
                    row.getCell(defaultPositionColumnTurno2Ingreso).value = value;
                    row.getCell(defaultPositionColumnTurno2Ingreso).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2Ingreso).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2Ingreso).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2Ingreso).font = fontStyle;

                    defaultPositionColumnTurno2IngresoSede += totalColumnsMerge;
                    value = worker[keyDate].turno2.entrada_sede;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).value = value;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2IngresoSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2IngresoSede).font = fontStyle;

                    defaultPositionColumnTurno2Salida += totalColumnsMerge;
                    value = worker[keyDate].turno2.salida;
                    row.getCell(defaultPositionColumnTurno2Salida).value = value;
                    row.getCell(defaultPositionColumnTurno2Salida).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2Salida).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2Salida).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2Salida).font = fontStyle;

                    defaultPositionColumnTurno2SalidaSede += totalColumnsMerge;
                    value = worker[keyDate].turno2.salida_sede;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).value = value;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(defaultPositionColumnTurno2SalidaSede).fill = styleCell2;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).border = borderStyles;
                    row.getCell(defaultPositionColumnTurno2SalidaSede).font = fontStyle;
                }
            }
            countRow++;
            defaultPositionColumnTurno1Ingreso = 3;
            defaultPositionColumnTurno1IngresoSede = 4;
            defaultPositionColumnTurno1Salida = 5;
            defaultPositionColumnTurno1SalidaSede =6;
            defaultPositionColumnTurno2Ingreso = 7;
            defaultPositionColumnTurno2IngresoSede = 8;
            defaultPositionColumnTurno2Salida = 9;
            defaultPositionColumnTurno2SalidaSede = 10;
            row = worksheet.getRow(countRow);
        })

    },
    generateDataInFormatExcelTableConsultaDetalle: function (totalIteraciones, fechaIni, worksheet, workersAsistance) {
        const totalColumnsMerge = 10;
        let countRow = 7;
        let defaultPositionColumnAsistIngre = 3;
        let defaultPositionColumnAsistEsta = 4;
        let defaultPositionColumnAsistObs = 5;
        let defaultPositionColumnRefriSali = 6;
        let defaultPositionColumnRefriIngre = 7
        let defaultPositionColumnRefriEsta = 8;
        let defaultPositionColumnRefriObs = 9;
        let defaultPositionColumnSaliIngre = 10;
        let defaultPositionColumnSaliEsta = 11;
        let defaultPositionColumnSaliObs = 12;

        let initialPositionRowNombre = countRow;
        let initialPositionColumnNombre = 2;

        // Asistencia
        let initialPositionRowAsistIngre = countRow;
        let initialPositionColumnAsistIngre = defaultPositionColumnAsistIngre;
        let initialPositionRowAsistEsta = countRow;
        let initialPositionColumnAsistEsta = defaultPositionColumnAsistEsta;
        let initialPositionRowAsistObs = countRow;
        let initialPositionColumnAsistObs = defaultPositionColumnAsistObs;

        // Refrigerio
        let initialPositionRowRefriSali = countRow;
        let initialPositionColumnRefriSali = defaultPositionColumnRefriSali;
        let initialPositionRowRefriIngre = countRow;
        let initialPositionColumnRefriIngre = defaultPositionColumnRefriIngre;
        let initialPositionRowRefriEsta = countRow;
        let initialPositionColumnRefriEsta = defaultPositionColumnRefriEsta;
        let initialPositionRowRefriObs = countRow;
        let initialPositionColumnRefriObs = defaultPositionColumnRefriObs;

        // Salida
        let initialPositionRowSaliIngre = countRow;
        let initialPositionColumnSaliIngre = defaultPositionColumnSaliIngre;
        let initialPositionRowSaliEsta = countRow;
        let initialPositionColumnSaliEsta = defaultPositionColumnSaliEsta;
        let initialPositionRowSaliObs = countRow;
        let initialPositionColumnSaliObs = defaultPositionColumnSaliObs;

        let row = worksheet.getRow(countRow);
        let rowInitialPositionNombre = initialPositionColumnNombre;

        let rowInitialPositionAsistIngre = initialPositionColumnAsistIngre;
        let rowInitialPositionAsistEsta = initialPositionColumnAsistEsta;
        let rowInitialPositionAsistObs = initialPositionColumnAsistObs;

        let rowInitialPositionRefriSali = initialPositionColumnRefriSali;
        let rowInitialPositionRefriIngre = initialPositionColumnRefriIngre;
        let rowInitialPositionRefriEsta = initialPositionColumnRefriEsta;
        let rowInitialPositionRefriObs = initialPositionColumnRefriObs;

        let rowInitialPositionSaliIngre = initialPositionColumnSaliIngre;
        let rowInitialPositionSaliEsta = initialPositionColumnSaliEsta;
        let rowInitialPositionSaliObs = initialPositionColumnSaliObs;

        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };

        const styleCellNombre = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '999999' }
        }
        const styleCellAsist = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'bfbfbf' }
        }

        const styleCellRefri = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '8faadc' }
        }
        const styleCellSali = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'a9d18e' }
        }

        const fontStyle = {
            bold: false,
            size: 9,
        }

        workersAsistance.forEach(worker => {
            row.getCell(rowInitialPositionNombre).value = worker.nombre;
            row.getCell(rowInitialPositionNombre).alignment = { vertical: "middle", horizontal: "center" };
            // row.getCell(rowInitialPositionNombre).fill = styleCellNombre;
            row.getCell(rowInitialPositionNombre).border = borderStyles;
            row.getCell(rowInitialPositionNombre).font = fontStyle;

            rowInitialPositionAsistIngre = defaultPositionColumnAsistIngre;
            rowInitialPositionAsistEsta = defaultPositionColumnAsistEsta;
            rowInitialPositionAsistObs = defaultPositionColumnAsistObs;

            rowInitialPositionRefriSali = defaultPositionColumnRefriSali;
            rowInitialPositionRefriIngre = defaultPositionColumnRefriIngre;
            rowInitialPositionRefriEsta = defaultPositionColumnRefriEsta;
            rowInitialPositionRefriObs = defaultPositionColumnRefriObs;

            rowInitialPositionSaliIngre = defaultPositionColumnSaliIngre;
            rowInitialPositionSaliEsta = defaultPositionColumnSaliEsta;
            rowInitialPositionSaliObs = defaultPositionColumnSaliObs;

            for (let i = 0; i <= totalIteraciones; i++) {
                if (i == 0) {
                    // Asistencia
                    row.getCell(rowInitialPositionAsistIngre).value = worker[moment(fechaIni).format('YYYY-MM-DD')].asistencia.hora_entra;
                    row.getCell(rowInitialPositionAsistIngre).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionAsistIngre).fill = styleCellAsist;
                    row.getCell(rowInitialPositionAsistIngre).border = borderStyles;
                    row.getCell(rowInitialPositionAsistIngre).font = fontStyle;

                    row.getCell(rowInitialPositionAsistEsta).value = worker[moment(fechaIni).format('YYYY-MM-DD')].asistencia.estado;
                    row.getCell(rowInitialPositionAsistEsta).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionAsistEsta).fill = styleCellAsist;
                    row.getCell(rowInitialPositionAsistEsta).border = borderStyles;
                    row.getCell(rowInitialPositionAsistEsta).font = fontStyle;

                    row.getCell(rowInitialPositionAsistObs).value = worker[moment(fechaIni).format('YYYY-MM-DD')].asistencia.observacion;
                    row.getCell(rowInitialPositionAsistObs).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionAsistObs).fill = styleCellAsist;
                    row.getCell(rowInitialPositionAsistObs).border = borderStyles;
                    row.getCell(rowInitialPositionAsistObs).font = fontStyle;


                    // Refrigerio
                    row.getCell(rowInitialPositionRefriSali).value = worker[moment(fechaIni).format('YYYY-MM-DD')].refrigerio.hora_sali_refri;
                    row.getCell(rowInitialPositionRefriSali).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriSali).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriSali).border = borderStyles;
                    row.getCell(rowInitialPositionRefriSali).font = fontStyle;

                    row.getCell(rowInitialPositionRefriIngre).value = worker[moment(fechaIni).format('YYYY-MM-DD')].refrigerio.hora_entra_refri;
                    row.getCell(rowInitialPositionRefriIngre).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriIngre).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriIngre).border = borderStyles;
                    row.getCell(rowInitialPositionRefriIngre).font = fontStyle;

                    row.getCell(rowInitialPositionRefriEsta).value = worker[moment(fechaIni).format('YYYY-MM-DD')].refrigerio.estado;
                    row.getCell(rowInitialPositionRefriEsta).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriEsta).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriEsta).border = borderStyles;
                    row.getCell(rowInitialPositionRefriEsta).font = fontStyle;

                    row.getCell(rowInitialPositionRefriObs).value = worker[moment(fechaIni).format('YYYY-MM-DD')].refrigerio.observacion;
                    row.getCell(rowInitialPositionRefriObs).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriObs).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriObs).border = borderStyles;
                    row.getCell(rowInitialPositionRefriObs).font = fontStyle;


                    // Salida
                    row.getCell(rowInitialPositionSaliIngre).value = worker[moment(fechaIni).format('YYYY-MM-DD')].salida.hora_sali;
                    row.getCell(rowInitialPositionSaliIngre).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionSaliIngre).fill = styleCellSali;
                    row.getCell(rowInitialPositionSaliIngre).border = borderStyles;
                    row.getCell(rowInitialPositionSaliIngre).font = fontStyle;

                    row.getCell(rowInitialPositionSaliEsta).value = worker[moment(fechaIni).format('YYYY-MM-DD')].salida.estado;
                    row.getCell(rowInitialPositionSaliEsta).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionSaliEsta).fill = styleCellSali;
                    row.getCell(rowInitialPositionSaliEsta).border = borderStyles;
                    row.getCell(rowInitialPositionSaliEsta).font = fontStyle;

                    row.getCell(rowInitialPositionSaliObs).value = worker[moment(fechaIni).format('YYYY-MM-DD')].salida.observacion;
                    row.getCell(rowInitialPositionSaliObs).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionSaliObs).fill = styleCellSali;
                    row.getCell(rowInitialPositionSaliObs).border = borderStyles;
                    row.getCell(rowInitialPositionSaliObs).font = fontStyle;

                } else {
                    // Asistencia
                    let keyDate = moment(moment(fechaIni), 'YYYY-MM-DD').add(i, 'd').format('YYYY-MM-DD');

                    rowInitialPositionAsistIngre += totalColumnsMerge;
                    row.getCell(rowInitialPositionAsistIngre).value = worker[keyDate].asistencia.hora_entra;
                    row.getCell(rowInitialPositionAsistIngre).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionAsistIngre).fill = styleCellAsist;
                    row.getCell(rowInitialPositionAsistIngre).border = borderStyles;
                    row.getCell(rowInitialPositionAsistIngre).font = fontStyle;

                    rowInitialPositionAsistEsta += totalColumnsMerge;
                    row.getCell(rowInitialPositionAsistEsta).value = worker[keyDate].asistencia.estado;
                    row.getCell(rowInitialPositionAsistEsta).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionAsistEsta).fill = styleCellAsist;
                    row.getCell(rowInitialPositionAsistEsta).border = borderStyles;
                    row.getCell(rowInitialPositionAsistEsta).font = fontStyle;

                    rowInitialPositionAsistObs += totalColumnsMerge;
                    row.getCell(rowInitialPositionAsistObs).value = worker[keyDate].asistencia.observacion;
                    row.getCell(rowInitialPositionAsistObs).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionAsistObs).fill = styleCellAsist;
                    row.getCell(rowInitialPositionAsistObs).border = borderStyles;
                    row.getCell(rowInitialPositionAsistObs).font = fontStyle;



                    // Refrigerio
                    rowInitialPositionRefriSali += totalColumnsMerge;
                    row.getCell(rowInitialPositionRefriSali).value = worker[keyDate].refrigerio.hora_sali_refri;
                    row.getCell(rowInitialPositionRefriSali).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriSali).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriSali).border = borderStyles;
                    row.getCell(rowInitialPositionRefriSali).font = fontStyle;

                    rowInitialPositionRefriIngre += totalColumnsMerge;
                    row.getCell(rowInitialPositionRefriIngre).value = worker[keyDate].refrigerio.hora_entra_refri;
                    row.getCell(rowInitialPositionRefriIngre).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriIngre).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriIngre).border = borderStyles;
                    row.getCell(rowInitialPositionRefriIngre).font = fontStyle;

                    rowInitialPositionRefriEsta += totalColumnsMerge;
                    row.getCell(rowInitialPositionRefriEsta).value = worker[keyDate].refrigerio.estado;
                    row.getCell(rowInitialPositionRefriEsta).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriEsta).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriEsta).border = borderStyles;
                    row.getCell(rowInitialPositionRefriEsta).font = fontStyle;

                    rowInitialPositionRefriObs += totalColumnsMerge;
                    row.getCell(rowInitialPositionRefriObs).value = worker[keyDate].refrigerio.observacion;
                    row.getCell(rowInitialPositionRefriObs).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionRefriObs).fill = styleCellRefri;
                    row.getCell(rowInitialPositionRefriObs).border = borderStyles;
                    row.getCell(rowInitialPositionRefriObs).font = fontStyle;


                    // Salida
                    rowInitialPositionSaliIngre += totalColumnsMerge;
                    row.getCell(rowInitialPositionSaliIngre).value = worker[keyDate].salida.hora_sali;
                    row.getCell(rowInitialPositionSaliIngre).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionSaliIngre).fill = styleCellSali;
                    row.getCell(rowInitialPositionSaliIngre).border = borderStyles;
                    row.getCell(rowInitialPositionSaliIngre).font = fontStyle;

                    rowInitialPositionSaliEsta += totalColumnsMerge;
                    row.getCell(rowInitialPositionSaliEsta).value = worker[keyDate].salida.estado;
                    row.getCell(rowInitialPositionSaliEsta).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionSaliEsta).fill = styleCellSali;
                    row.getCell(rowInitialPositionSaliEsta).border = borderStyles;
                    row.getCell(rowInitialPositionSaliEsta).font = fontStyle;

                    rowInitialPositionSaliObs += totalColumnsMerge;
                    row.getCell(rowInitialPositionSaliObs).value = worker[keyDate].salida.observacion;
                    row.getCell(rowInitialPositionSaliObs).alignment = { vertical: "middle", horizontal: "center" };
                    // row.getCell(rowInitialPositionSaliObs).fill = styleCellSali;
                    row.getCell(rowInitialPositionSaliObs).border = borderStyles;
                    row.getCell(rowInitialPositionSaliObs).font = fontStyle;


                }
            }
            countRow++;
            row = worksheet.getRow(countRow);
        })

    },
    dataInFormatExcelTableConsultaDetallev2: function (data, fechaIni, totalDays) {
        const estructureBase = {
            turno1: {entrada:'',entrada_sede:'',salida:'',salida_sede:''},
            turno2: {entrada:'',entrada_sede:'',salida:'',salida_sede:''}
        }
        
        let workersNames = data.filter(function (item, index, self) {
            return index === self.findIndex((t) => (t.nombre == item.nombre));
        }).map(item => item.nombre);

        let workersAsistance = [];
        console.log('workernames',data);
        
        workersNames.forEach(name => {
            let dataObject = {};
            for (let i = 0; i <= totalDays; i++) {
                if (i == 0) {
                    dataObject['nombre'] = name;
                    dataObject['departamento'] = '';
                    dataObject[moment(fechaIni).format('YYYY-MM-DD')] = JSON.parse(JSON.stringify(estructureBase));
                } else {
                    dataObject[moment(moment(fechaIni), 'YYYY-MM-DD').add(i, 'd').format('YYYY-MM-DD')] = JSON.parse(JSON.stringify(estructureBase));
                }
            }
            workersAsistance.push(dataObject);
        })

        data.forEach(item => {
            let index = workersAsistance.findIndex(worker => worker.nombre === item.nombre);

            if (index != -1) {
                workersAsistance[index]['departamento'] = item.departament_name;
                if(workersAsistance[index][item.fecha] != undefined){
                    workersAsistance[index][item.fecha].turno1.entrada = item.hora_entra;
                    workersAsistance[index][item.fecha].turno1.entrada_sede = item.terminal_entra;
                    workersAsistance[index][item.fecha].turno1.salida = item.hora_sali_refri;
                    workersAsistance[index][item.fecha].turno1.salida_sede = item.terminal_sali_refri;
                    workersAsistance[index][item.fecha].turno2.entrada = item.hora_entra_refri;
                    workersAsistance[index][item.fecha].turno2.entrada_sede = item.terminal_entra_refri;
                    workersAsistance[index][item.fecha].turno2.salida = item.hora_sali;
                    workersAsistance[index][item.fecha].turno2.salida_sede = item.terminal_sali;
                }
            }

        })

        return workersAsistance;
    },
    dataInFormatExcelTableConsultaDetalle: function (data, fechaIni, totalDays) {
        const estructureBase = {
            asistencia: { hora_entra: '', estado: '', observacion: '' },
            refrigerio: { hora_sali_refri: '', hora_entra_refri: '', estado: '', observacion: '' },
            salida: { hora_sali: '', estado: '', observacion: '' }
        }

        let workersNames = data.filter(function (item, index, self) {
            return index === self.findIndex((t) => (t.nombre == item.nombre));
        }).map(item => item.nombre);

        let workersAsistance = [];

        workersNames.forEach(name => {
            let dataObject = {};
            for (let i = 0; i <= totalDays; i++) {
                if (i == 0) {
                    dataObject['nombre'] = name;
                    dataObject[moment(fechaIni).format('YYYY-MM-DD')] = JSON.parse(JSON.stringify(estructureBase));
                } else {
                    dataObject[moment(moment(fechaIni), 'YYYY-MM-DD').add(i, 'd').format('YYYY-MM-DD')] = JSON.parse(JSON.stringify(estructureBase));
                }
            }
            workersAsistance.push(dataObject);
        })

        data.forEach(item => {
            let index = workersAsistance.findIndex(worker => worker.nombre === item.nombre);

            if (index != -1) {
                workersAsistance[index][item.fecha].asistencia.hora_entra = item.hora_entra;
                workersAsistance[index][item.fecha].refrigerio.hora_entra_refri = item.hora_entra_refri;
                workersAsistance[index][item.fecha].refrigerio.hora_sali_refri = item.hora_sali_refri;
                workersAsistance[index][item.fecha].salida.hora_sali = item.hora_sali;
            }

        })

        return workersAsistance;
    },
    generateBodyVariables: function (variables, headers = [], worksheet, lastInitCol, rowInit = 4) {
        const initRow = worksheet.getRow(rowInit)
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        headers.forEach((header, index) => {
            initRow.getCell(index + lastInitCol).value = Number(variables[header.nameVariable]).toFixed(2)
            initRow.getCell(index + lastInitCol).font = {
                name: 'Calibri',
                size: 7
            }

            initRow.getCell(index + lastInitCol).alignment = { vertical: "middle", horizontal: "center" }
            initRow.getCell(index + lastInitCol).border = borderStyles


        })
    },
    generateHeaderVariables: function (headers = [], worksheet, lastInitCol) {
        const initRow = worksheet.getRow(3)
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        headers.forEach((header, index) => {
            worksheet.mergeCells(1, index + lastInitCol, 3, index + lastInitCol)
            initRow.getCell(index + lastInitCol).value = header.name
            initRow.getCell(index + lastInitCol).font = {
                name: 'Calibri',
                size: 7
            }
            initRow.getCell(index + lastInitCol).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: header.bgc }
            }
            initRow.getCell(index + lastInitCol).alignment = { vertical: "middle", horizontal: "center", textRotation: 90 }
            initRow.getCell(index + lastInitCol).border = borderStyles

        })
    },
    generateDataRegisterExcel: function (registers = [], worksheet, initRow = 1, initCol = 5) {
        const row = worksheet.getRow(initRow);
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        registers.forEach((register, index) => {
            if (register.dia != "TOTAL") {
                row.getCell(index + initCol).value = register.horas
                row.getCell(index + initCol).border = borderStyles;
                row.getCell(index + initCol).font = {
                    name: 'Calibri',
                    size: 7
                }
                row.getCell(index + initCol).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: (register.Style.background || "").replace("#", "") },
                    bgColor: { argb: (register.Style.background || "").replace("#", "") }
                }
            }
        })
    },
    generateDiasExcel: function (dias = [], worksheet, initColumn = 5) {
        let counterColumn = initColumn;
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        const rowDias = worksheet.getRow(2);
        const rowLetrasDias = worksheet.getRow(3);
        dias.forEach((dataElement) => {
            rowDias.getCell(counterColumn).value = dataElement.numero;
            rowDias.getCell(counterColumn).font = {
                size: 6,
                name: 'Calibri'
            }
            rowDias.getCell(counterColumn).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '83add8' }
            }
            rowDias.getCell(counterColumn).alignment = { vertical: "middle", horizontal: "center", wrapText: true }
            rowDias.getCell(counterColumn).border = borderStyles
            rowLetrasDias.getCell(counterColumn).value = dataElement.dia;
            rowLetrasDias.getCell(counterColumn).font = {
                size: 6,
                name: 'Calibri'
            }
            if (dataElement.dia != "L") {
                rowLetrasDias.getCell(counterColumn).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '83add8' }
                }
            }
            rowLetrasDias.getCell(counterColumn).alignment = { vertical: "middle", horizontal: "center", wrapText: true }
            rowLetrasDias.getCell(counterColumn).border = borderStyles
            counterColumn++;
        })


    },
    getMotivos: async () => {
        let json = {}
        try {
            let rows = await db.query(`SELECT * FROM motivos_concar`)
            json = {
                success: true,
                message: "Extracción de Motivos realizada satisfactoriamente.",
                rows
            }
        } catch (err) {
            console.log("error", err.code)
            json = {
                success: false,
                message: "Error en la ruta /tareo/getMotivos",
                error: err.code
            }
        }
        return json
    },
    getTipoTrabajadores: async () => {
        let json = {}
        try {
            const pool = await poolPromise
            const rows = await pool.request()
                .query(`SELECT w.TIPO_PLANILLA FROM (SELECT P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'OBREROS' TIPO_PLANILLA 
                                FROM RSPLACAR.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020' 
                                UNION ALL
                                SELECT P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'EMPLEADOS' TIPO_PLANILLA 
                                FROM RSPLACAR_01.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020') w
                                GROUP BY w.TIPO_PLANILLA`)
            json = {
                success: true,
                message: "Extracción de Tipo de Trabajadores realizada satisfactoriamente.",
                rows: rows.recordset
            }
        } catch (err) {
            console.log("error", err.code)
            json = {
                success: false,
                message: "Error en la ruta /tareo/getTipoTrabajadores",
                error: err.code
            }
        }
        return json
    },
    exportMotivos: async (Data) => {
        let { FechaInicial, FechaFinal, Motivo, TipoTrabajador } = Data
        let json = {}
        try {
            const pool = await poolPromise
            let employees_consult = await db.query(`SELECT * FROM Tareo_detalle WHERE fec_tareo BETWEEN ? and ? GROUP BY emp_code ORDER BY idTareoDetalle`, [FechaInicial, FechaFinal])
            let rows = []
            for (let i = 0; i < employees_consult.length; i++) {
                const r = employees_consult[i];
                const result_empleado = await pool.request()
                    .query(`SELECT w.P010_CODIG, w.DNI, w.P010_NOMBR, w.TIPO_PLANILLA FROM (SELECT P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'OBREROS' TIPO_PLANILLA 
                            FROM RSPLACAR.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020' 
                            UNION ALL
                            SELECT P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'EMPLEADOS' TIPO_PLANILLA 
                            FROM RSPLACAR_01.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020') w
                            WHERE w.DNI = ${r.emp_code}`)
                if (typeof result_empleado.recordset[0] != "undefined") {
                    if (result_empleado.recordset[0].TIPO_PLANILLA == TipoTrabajador.TIPO_PLANILLA) {
                        let HORAS = ''
                        let query = ''
                        switch (Motivo.Motivo) {
                            case "421":
                                query = `SELECT * FROM Tareo_detalle WHERE emp_code = ? and Falta = 1 and fec_tareo BETWEEN ? and ?`
                                break;
                            case "002":
                                query = `SELECT * FROM Tareo_detalle WHERE emp_code = ? and LGH = 1 and fec_tareo BETWEEN ? and ?`
                                break;
                            case "1":
                                query = `SELECT emp_code, SUM(HO) AS HO FROM Tareo_detalle WHERE emp_code = ? and fec_tareo BETWEEN ? and ?`
                                HORAS = 'HO'
                                break;
                            case "131":
                                query = `SELECT emp_code, SUM(H25) AS H25 FROM Tareo_detalle WHERE emp_code = ? and fec_tareo BETWEEN ? and ?`
                                HORAS = 'H25'
                                break;
                            case "135":
                                query = `SELECT emp_code, SUM(H35) AS H35 FROM Tareo_detalle WHERE emp_code = ? and fec_tareo BETWEEN ? and ?`
                                HORAS = 'H35'
                                break;
                            case "118":
                                query = `SELECT emp_code, SUM(H100) AS H100 FROM Tareo_detalle WHERE emp_code = ? and fec_tareo BETWEEN ? and ?`
                                HORAS = 'H100'
                                break;
                            case "053":
                                query = `SELECT emp_code, SUM(HN) AS HN FROM Tareo_detalle WHERE emp_code = ? and fec_tareo BETWEEN ? and ?`
                                HORAS = 'HN'
                                break;
                            case "111":
                                query = `SELECT emp_code, SUM(HFeriados) AS HF FROM Tareo_detalle WHERE emp_code = ? and fec_tareo BETWEEN ? and ?`
                                HORAS = 'HF'
                                break;
                            default:
                                query = `SELECT emp_code, SUM(HO) AS HO FROM Tareo_detalle WHERE emp_code = ? and fec_tareo BETWEEN ? and ?`
                                HORAS = 'HO'
                                break;
                        }
                        let minirow = await db.query(query, [r.emp_code, new Date(FechaInicial), new Date(FechaFinal)])
                        minirow.forEach(e => {
                            e.P010_NOMBR = result_empleado.recordset[0].P010_NOMBR
                            if (Motivo.Tipo == 1) {
                                e.fec_tareo = tareo.formatDate(e.fec_tareo)
                                e.contador = 1
                            } else {
                                e.contador = e[HORAS]
                            }
                            if (e.contador != 0) {
                                rows.push(e)
                            }
                        });
                    }
                }
            }
            let rowsExport = []
            for (let j = 0; j < rows.length; j++) {
                const r = rows[j];
                rowsExport.push({
                    "CODIGO": r.emp_code,
                    "NÚMERO DOCUMENTO": r.emp_code,
                    "NOMBRE": r.P010_NOMBR,
                    "MOTIVO": Motivo.Motivo,
                    "DESCRIPCION": Motivo.Descripcion,
                    "HORAS/DIAS": r.contador,
                    "IMPORTE": '',
                    "F. INICIAL": r.fec_tareo,
                    "F. FINAL": r.fec_tareo,
                    "TIPO DE DIAS SUBSIDIADOS o NO LABORADOS": '07',
                    "PERIODO (AAAA-AAAA)": '',
                    "NRO. CIIT": '',
                    "OBSERVACION": ''
                })
            }
            console.log("rowsExport", rowsExport)
            json = {
                success: true,
                message: "Exportación de Motivos realizada correctamente.",
                rows,
                rowsExport,
                Motivo
            }
        } catch (error) {
            console.log("error", error)
            json = {
                success: false,
                message: "Error en la ruta /tareo/exportMotivos",
                error: error.code
            }
        }
        return json
    }
};
module.exports = tareo;

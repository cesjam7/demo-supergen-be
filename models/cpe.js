const db=require('../dbconnection');
const { poolPromise } = require('../dbconnectionMSSQL')
const axios=require("axios");
const invoice_types={
    'BV':'03',
    'FT':'01',
    'NC':'07',
    'ND':'08'
};
const estadoCP={
    "-":"-",
	"0":"NO EXISTE",
	"1":"ACEPTADO",
	"2":"ANULADO",
	"3":"AUTORIZADO",
	"4":"NO AUTORIZADO"
};
/*
const estadoRUC={
    "-":"-",
	"00":"ACTIVO",
	"01":"BAJA PROVISIONAL",
	"02":"BAJA PROV. POR OFICIO",
	"03":"SUSPENSION TEMPORAL",
	"10":"BAJA DEFINITIVA",
	"11":"BAJA DE OFICIO",
	"12":"BAJA MULT.INSCR. Y OTROS ",
	"20":"NUM. INTERNO IDENTIF.",
	"21":"OTROS OBLIGADOS",
	"22":"INHABILITADO-VENT.UNICA",
	"30":"ANULACION - ERROR SUNAT"
};
const condicion={
    "-":"-",
	"00":"HABIDO",
	"01":"NO HALLADO SE MUDO DE DOMICILIO",
	"02":"NO HALLADO FALLECIO",
	"03":"NO HALLADO NO EXISTE DOMICILIO",
	"04":"NO HALLADO CERRADO",
	"05":"NO HALLADO NRO.PUERTA NO EXISTE",
	"06":"NO HALLADO DESTINATARIO DESCONOCIDO",
	"07":"NO HALLADO RECHAZADO",
	"08":"NO HALLADO OTROS MOTIVOS",
	"09":"PENDIENTE",
	"10":"NO APLICABLE",
	"11":"POR VERIFICAR",
	"12":"NO HABIDO",
	"20":"NO HALLADO",
	"21":"NO EXISTE LA DIRECCION DECLARADA",
	"22":"DOMICILIO CERRADO",
	"23":"NEGATIVA RECEPCION X PERSONA CAPAZ",
	"24":"AUSENCIA DE PERSONA CAPAZ",
	"25":"NO APLICABLE X TRAMITE DE REVERSION",
	"40":"DEVUELTO"
};*/
class Cpe{
   query=`select id,type,serie,correlative,client_document,name,total,coin,
   date_format(emition_date,'%d/%m/%Y') as emition_date,state,message,
   if(state in(1,2),'label-success','label-danger') as color from cpe_invoices
    where date_format(emition_date,'%Y-%m-%d') BETWEEN`;
    ruc_emisor="20552543549";
  async export({from,to}){
    var Excel = require('exceljs');
    var workbook = new Excel.Workbook();
    const rows=await db.query(`${this.query}  '${from}' and '${to}'`);
     if(rows && rows.length>0){
      await workbook.xlsx.readFile("./template/CPE-TEMPLATE.xlsx");
      const sheet = workbook.getWorksheet(1);
      sheet.getCell("A1").value=`CONSULTA CPE MASIVA ${this.ruc_emisor}`;
      sheet.getCell("A2").value=`DEL ${from} AL ${to}`;
      let filename=`CONSULTA CPE MASIVA ${this.ruc_emisor} DEL ${from} AL ${to}.xlsx`;
      let cells=[
        {cell:'A',column:'type'},
        {cell:'B',column:(row,_)=>{
          return `${row.serie}-${row.correlative}`;
        }},
        {cell:"C",column:"client_document"},
        {cell:"D",column:"name"},
        {cell:"E",column:"total"},
        {cell:"F",column:"coin"},
        {cell:"G",column:"emition_date"},
        {cell:"H",column:(row,cell)=>{
          if(['1','2'].includes(row.state)){
            cell.font={color: {argb: "4caf50"}};
            
          }else{
            cell.font={color: {argb: "f44336"}};
          }
          return row.message;
        }},
      ];
      const border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
         let index=5;
       for(let row of rows){
        for(let c of cells){
          let cell=sheet.getCell(`${c.cell}${index}`);
          cell.border=border;
        
         
          if(typeof c.column=="function"){
            cell.value=c.column(row,cell);
          }else{
            cell.value=row[c.column];
          }
        }
        index++;
       }

       const buffer = await workbook.xlsx.writeBuffer();
       return {  filename, b64: buffer.toString("base64") };
     }
     return null;
  }
  async find({from,to}){
    let sql=`select 
    F5_CTD as type,F5_CNUMSER as serie,F5_CNUMDOC as correlative,
    convert(varchar,F5_DFECDOC,23) AS emition_date,rtrim(F5_CCODCLI) as client_document,F5_CNOMBRE as name,
    F5_NSALDO as total,F5_CCODMON as coin
    from  RSFACCAR.dbo.FT0003ACUC  where CONVERT(VARCHAR,F5_DFECDOC,23) BETWEEN '${from}' and '${to}'`;
    const pool =await poolPromise;
    const {recordset}=await pool.query(sql);
 
    for(let rec of recordset){
        await db.query("call sp_save_cpe_invoice(?,?,?,?,?,?,?,?)",[
            rec.type,rec.serie,rec.correlative,rec.client_document,rec.name,rec.total,rec.coin,rec.emition_date
        ]);
    }
    const rows=await db.query(`${this.query}  '${from}' and '${to}'`);
    
   return rows;
  }
  async find_in_sunat(rows){
      let success=[];
   for(let row of rows){
    try{
    const{data}=await  axios.post('https://ww1.sunat.gob.pe/ol-ti-itconsultaunificadalibre/consultaUnificadaLibre/consultaIndividual',
     this.formUrlEncoded({
        token:`03AGdBq251XsD958pHXPeVoBW6fy-WljthfND8FgdVLm_lQ5fCEwpmwci6tvSiXS4jMwYL-HlNet42VU6BybUziMaZGknIDk-pL0Gk3ir3Sb54Ct_Az_hhjMtxUXBtnq6LSiYBV8DqV7K4q07x7fRzy0onapCfc9DXPOZVRB2r7h5Jh2Q4mS4JWHF6FzDA7rTvXWsGl9mwLHtsDmgxu-Gkn0nogXBaMvUe3VdZrOLo8Ho0H0Ic3cwx8dlC9pUMQFOG37nORlDv5XbDQ0kMrVfQAK6hIxoPFc1zmo3P4ZiGLxqqaPR7FDxvC9MdBBbN6FY3b0l5yHhwJOQ_HW0Xx7LHtOTnnsA6Vc_3t5A5GcevdUWi58EFCYnmG40ZJeCuDhC2oGmoAM6opMJHU9ofZtJJt8xH0mHMxBOiFdAvSocRHCc8S8tZDl0i-EyUDdYByQG7aHQ2xRm311tJ`,
        monto:(Math.abs(parseFloat(row.total))).toFixed(2),
        numDocRecep:row.client_document,
        codDocRecep:row.client_document.length==8?1:6,
        fechaEmision:row.emition_date,
        numero:parseInt(row.correlative),
        numeroSerie:row.serie,
        codComp:invoice_types[row.type],
        numRuc:this.ruc_emisor
     }));
  
      let result=JSON.parse(data);
        if(result.data){
            await db.query(`update cpe_invoices set state=?,message=? where id=?`,
            [result.data.estadoCp,estadoCP[result.data.estadoCp],row.id]);
           success.push({
            state:result.data.estadoCp,
            message:estadoCP[result.data.estadoCp],
            index:row.index
        });
        }
     }catch(err){
       console.error(err);
     }
   }
  
   return success;
  }
  formUrlEncoded (x){
   return Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '');
  }
  
   
}
module.exports=new Cpe();

const sql = require('mssql')
var os = require('os');
let hostname = os.hostname();

//CONFIGURACION Y CONEXION MSSQL
var config = {
    server: 'OMBC-DESKTOP-H0',
    user: 'sa',
    password: '123',
    database: 'DBCostsSG',
    options: {
      encrypt: false,
      enableArithAbort : true
    }
};

if(hostname == "DESKTOP-DQHFQMM"){
  config = {
      server: 'DESKTOP-DQHFQMM',
      user: 'sa',
      password: '123',
      database: 'DBCostsSG',
      options: {
        encrypt: false,
        enableArithAbort : true
      }
  };
}

//SERVER SQL SUPERGEN
// if(hostname == 'SUPERGEN'){
  config = {
    server: '190.187.114.60',
    user: 'sa',
    password: 'Supergen321',
    database: 'DBCostsSG',
    options: {
      encrypt: false,
      enableArithAbort : true
    }
  };
// }

const poolPromise =  sql.connect(config)
.then(pool => {
  console.log('Connected to MSSQL '+config.database) 
  return pool
})
.catch(err => console.log('Database Connection Failed! Bad Config: ', err))

//CONFIGURACION Y CONEXION PARA FACCAR
// const configFACCAR = {
//   server: 'OMBC-DESKTOP-H0',
//   user: 'sa',
//   password: '123',
//   database: 'RSFACCAR',
//   options: {
//     encrypt: false,
//     enableArithAbort : true
//   }
// };

// const poolPromise2 = new sql.ConnectionPool(configFACCAR)
// .connect()
// .then(pool => {
//   console.log('Connected to MSSQL RSFACCAR') 
//   return pool
// })
// .catch(err => console.log('Database Connection Failed! Bad Config: ', err))

module.exports = {
sql, poolPromise
}
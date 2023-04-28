const express = require('express')
const router = express.Router()
const clientes = require('../models/clientes');
const auth = require('../middlewares/auth')

router.get('/getClientes_Trabajadores', async(req, res, next) => {
    let rows = await clientes.getClientes_Trabajadores();
    res.json(rows);
})

module.exports = router
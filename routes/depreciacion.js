const express = require('express')
const router = express.Router()
const Depreciacion = require('../models/depreciacion');
const auth = require('../middlewares/auth')

router.post('/getData', auth.isAuth, async (req, res,next) => {
  let rows = await Depreciacion.getData(req.body);
  res.json(rows);
})

router.post('/guardarProyeccion', auth.isAuth, async (req, res,next) => {
  let rows = await Depreciacion.guardarProyeccion(req.body);
  res.json(rows);
})
module.exports = router
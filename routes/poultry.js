let express = require('express');
let router = express.Router();
var fs = require('fs');
let poultry = require('../models/poultry');
var path = require('path');
let urlPoultry = "https://poultry2.spacetouch.tech/api/warehouses/by-code?";

router.post('/getInfo',async (req,res,next) => {
    let respuesta = await poultry.getInfo(req.body, urlPoultry);
    res.json(respuesta)
})

router.post('/getInfoDelphus',async (req,res,next) => {
    let respuesta = await poultry.getInfoDelphus(req.body);
    res.json(respuesta)
})

router.post("/importacion-pesajes",async (req,res,next) => {
    let respuesta = await poultry.importarPesaje(req.body);
    res.json(respuesta)
})

router.post("/reajuste-alimentos",async (req,res,next) => {
    let respuesta = await poultry.ExcelRA(req.body);
    if(respuesta.success == true){
        respuesta.rutaCompletaRA = "/supergen-be"+respuesta.rutaRA
        res.json(respuesta)
    }else{
        res.json({
            success : false,
            message : "Ocurrió un error en el servidor."
        })
    }
})

router.get("/getLotes",async (req,res,next) => {
    let rows = await poultry.getLotes();
    res.json(rows);
})

module.exports=router;
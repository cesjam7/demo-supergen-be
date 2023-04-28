var express = require('express');
var router = express.Router();
var cargos = require('../models/cargos');
const auth = require('../middlewares/auth')

router.post('/', auth.isAuth,async function(req,res,next){
    let rows = await cargos.addCargo(req.body);
    let rows2 = await cargos.addDetalleCargo(req.body, rows.insertId);
    res.json(rows2);
});
router.get('/:id?', auth.isAuth,async function(req,res,next){
    
    if(req.params.id > 0){
        cargos.getCargoById(req.params.id,function(err,rows){
            
            if(err)
            {
                res.json(err);
            }
            else{
                res.json(rows);
            }
        });
    }else if(req.params.id == "ultimo-registro"){
        cargos.selectMaxId(function(err,rows){
            if(err){
                res.json(err);
            }else{
                if(rows[0].maxId == null){
                    res.json(1);
                }else{
                    res.json(rows[0].maxId + 1);
                }
            }
        });
    }else if(req.params.id == "getLotesCompararProd"){
        let rows = await cargos.getLotesCompararProd()
        res.json(rows);
    }else {
        let rows = await cargos.getAllCargos()
        res.json(rows);
    }
});
router.get('/cargasdet/:id', auth.isAuth,function(req,res,next){

    cargos.getCargoById(req.params.id,function(err,rows){
        console.log("reqparamsid:",req.params.id);

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(rows);
        }

    });
});
router.get('/detalledet/:id', auth.isAuth, async function(req,res,next){

    let rows = await cargos.getCargodetById(req.params.id);
    res.json(rows);
});
router.get('/resumen/:id', auth.isAuth, async function(req,res,next){

    let rows = await cargos.selectResumenById(req.params.id);
    res.json(rows);
});
router.get('/idLote/:id/idCarga/:id', auth.isAuth,function(req,res,next){

    cargos.selectLotexidcargas(req.body,function(err,rows){
        console.log("reqparamsid:",req.body);
        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(rows);
        }
   
    });
});
router.delete('/:id', auth.isAuth,async function(req,res){
 let result=await cargos.deleteCargoById(req.params.id);
  res.json(result);
});
router.put('/bloquear/:id', auth.isAuth,async function(req,res,next){
    let rows = await cargos.UpdateEstado(0,req.params.id);
    res.json(rows);
});
router.put('/desbloquear/:id', auth.isAuth,async function(req,res,next){
    let rows = await cargos.UpdateEstado(1,req.params.id);
    res.json(rows);
});
router.put('/eliminar/:id', auth.isAuth,async function(req,res,next){
    let rows = await cargos.UpdateEstado(2,req.params.id);
    res.json(rows);
});
router.put('/updatecargos', auth.isAuth,async function(req,res,next){
    let rows = await cargos.UpdateCargo(req.body);
    res.json(rows);
});
router.put('/updatepedidos', auth.isAuth,async function(req,res,next){
    let rows1 = await cargos.UpdatePedidos(req.body);
    res.json(rows1);
});

module.exports=router;
 
 
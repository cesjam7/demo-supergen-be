var express = require('express');
var router = express.Router();
var produccionPeso = require('../models/produccionPeso');
const auth = require('../middlewares/auth')
var mortalidad1 = require('../models/produccionMortalidad');
var produccionHuevos = require('../models/produccionHuevos');
router.get('/:id?', auth.isAuth,function(req,res,next){
    if(req.params.id > 0){
        produccionPeso.getAllStandardlotes(req.params.id,function(err,rows){
            if(err){
                res.json(err);
            }else{
                res.json(rows);
            }

        });
    }else if(req.params.id == "getStandardHembra"){
        produccionPeso.getStandardHembra(function(err,rows){
             if(err)
             {
                 res.json(err);
             }
             else{
                 res.json(rows);
             }
         });
    }else if(req.params.id == "getStandardMacho"){
        produccionPeso.getStandardMacho(function(err,rows){
             if(err)
             {
                 res.json(err);
             }
             else{
                 res.json(rows);
             }
         });
    }else{
        produccionPeso.getproduccionPesoById(req.params.id,function(err,rows){
            if(err){
                res.json(err);
            }else{
                res.json(rows);
            }
        });
    }
});
router.get('/getStdHembra/:semana/:tipoGenero', auth.isAuth,function(req,res,next){    
    produccionPeso.getStdHembra(req.params, function(err,rows){
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
});
router.get('/semana/:id?', auth.isAuth,async function(req,res,next){
    let rows = await produccionPeso.getPesoSemana(req.params.id)
    res.json(rows);
});
router.post('/semana/grupal', auth.isAuth,async function(req,res,next){
    let rows = await produccionPeso.postPesoSemana(req.body)
    res.json(rows);
});
router.get('/pesojson/:id?', auth.isAuth,function(req,res,next){
    produccionPeso.getPesoJsonByIdProduccion(req.params.id,function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
})
router.get('/produccion/:id?', auth.isAuth,async function(req,res,next){
    let rows = await produccionPeso.getMortalidadProduccion(req.params.id);
    res.json(rows);
})
router.get('/dia/:idProduccion/:edad', auth.isAuth,function(req,res,next){
    console.log('params', req.params);
    produccionPeso.getmortalidadDia(req.params.idProduccion, req.params.edad,function(err,rows){
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/ultimo-dia/:id?', auth.isAuth,function(req,res,next){
    produccionPeso.getPesoUltimoDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/stdPeso/:idProduccion/:id/:semana', auth.isAuth,function(req,res,next){
    produccionPeso.getPesoSTD(req.params.idProduccion,req.params.id,req.params.semana,function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
 })
router.post('/modal/', auth.isAuth,async function(req,res,next){
    req.body.Semana = req.body.semana;
    let count = await mortalidad1.verifyMortalidad(req.body);
    if(count.length == 0){
        res.json({
            "message":"Primero registre Datos en Mortalidad",
            "success": false
        })
    }else{
        let count2 = await produccionHuevos.verifyProdHuevosSem(req.body);
        if(count2.length == 0){
            res.json({
                "message": "Primero registre datos en Produccion de Huevos",
                "success": false
            })
        }else{
            let rows = await produccionPeso.addPesoModal(req.body);
            res.json(rows);
        }
        
    }
});
router.put('/:id', auth.isAuth,function(req,res,next){
    produccionPeso.updatePeso(req.params.id,req.body,function(err,rows){
        if(err){
            res.json(err);
        } else{
            res.json(rows);
        }
    });
});

module.exports=router;
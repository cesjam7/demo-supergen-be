const multer = require("multer")
const path = require("path")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "firmas/" + req.user)
    },
    filename: (req, file, cb) => {
        cb(null, "firma.jpg")
    },

})
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        const ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.PNG') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    },
})
module.exports = upload;
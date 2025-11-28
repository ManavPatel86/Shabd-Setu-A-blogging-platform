import multer from 'multer'

const storage = multer.diskStorage({
    //FOR Dos

//     limits: {
//      fileSize: 2000000 // Compliant: 2MB 
//   },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

function fileFilter(req, file, cb) {

    const allowedFiles = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp']
    if (!allowedFiles.includes(file.mimetype)) {
        cb(new Error('Only images are allowed.'), false)
    } else {
        cb(null, true)
    }

}

const upload = multer({ storage: storage, fileFilter: fileFilter })

export default upload
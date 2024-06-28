const aws = require("aws-sdk");
const multer = require("multer");

const s3 = new aws.S3({
  accessKeyId: "",
  secretAccessKey: ""
});

const multerUpload = multer({
    fileFilter:(req, file, cb)=>{
        if (file.mimetype.match(/\/(mp4|mov|mkv)$/)) {
            cb(null, true);
        }else{
            cb(new Error(`Unsupported file type ${extname(file.originalname)}`), false)
        }
    }
});

const uploadToS3 = async (file)=>{
    const {originalname} = file;
    const params = {
        Bucket: 'henceforthsolutions',
        Key: originalname,
        Body: file.buffer,
        ACL: 'public-read'
    }
    return await s3.upload(params).promise();
}

module.exports = {uploadToS3, multerUpload};
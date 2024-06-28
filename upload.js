const express = require("express");
const multer = require("multer");
const uuid = require("uuid").v4;
const {extname} = require("path");
const {uploadToS3,multerUpload} = require("./config/uploadS3");
const {segmentation} = require("./helper/segmentation");

const app = express();
// const upload = require('./config/multer');

app.get("/", (req, res)=>{
    res.send("working");
});

app.post("/video",multerUpload.single('video'), async (req, res)=>{
    try {
        console.log("reached");
        console.log(req.file.buffer);
        // const result = await uploadToS3(req.file);
        // res.json({
        //     msg: "uploaded",
        //     data: result
        // });

        //converting file 
        await segmentation(req.file.buffer);

    } catch (error) {
        console.log(error);
        res.json({
            msg: "error while uploading"
        })
    }
});

app.listen(8000, ()=>{
    console.log("app listening on port 8000");
});

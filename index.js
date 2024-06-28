'use strict';

const express = require('express');
const path = require('path');
const cors = require('cors');
var fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8000;
const hlsDirectory = path.join(__dirname, 'temp/chunks');
const Multer = require("multer");

// Enable CORS for all routes
app.use(cors());
const multer = Multer()
// Serve the HLS files from the hlsDirectory
// app.use('/hls', express.static(hlsDirectory));

// Route to serve the master playlist
app.put('/videos/:filename', multer.single('temp'),(req, res) => {
    const filename = req.params.filename;
    console.log("reached");
    console.log(req.file);
    // const filePath = path.join(hlsDirectory, `${filename}_master.m3u8`);
    // const filePath = path.join(hlsDirectory, filename);
    // ffmpeg -re -i /home/hf/Desktop/projects/Nodejs/hlc/videos/video2.mp4 -b:v:0 1000k -b:v:1 256k -b:a:0 64k -b:a:1 32k \
    // -map 0:v -map 0:a -map 0:v -map 0:a -f hls -var_stream_map "v:0,a:0 v:1,a:1" \
    // http://localhost:8000/videos/out_%v.m3u8

    // // res.sendFile(filePath);

    //  fs.readFile(filePath, function (error, content) {
    // //   res.writeHead(200, { "Access-Control-Allow-Origin": "*" });
    //   if (error) {
    //     console.log("error occured",error);
    //     res.end();
    //   } else {
    //     console.log("file => ", content);
    //     res.end(content, "utf-8");
    //   }
    // });
});
// app.get('/videos/:filename', (req, res) => {
//   const filename = req.params.filename;
//   console.log("reached get");
//   console.log(filename);
// });
// Start the server
app.listen(PORT, () => {
    console.log(`HLS streaming server is running on http://localhost:${PORT}`);
});

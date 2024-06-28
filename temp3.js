const { spawn } = require("child_process");
const path = require("path");
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const fs = require('fs');

function createHlsStream(resolution, fileBaseName) {
    let counter = 1;
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn("ffmpeg", [
      "-i",
      "/home/hf/Desktop/projects/Nodejs/hlc/videos/video2.mp4",
      "-vf",
      `scale=${resolution.width}:${resolution.height}`,
      "-b:v",
      resolution.bitrate,
      "-hls_time",
      "10",
      "-hls_list_size",
      "0",
      "-f",
      "hls",
      "-",
    ]);

    let outputBuffers = [];

    ffmpegProcess.stdout.on("data", (data) => {
      outputBuffers.push(data);
      console.log("Received data chunk");
    });

    ffmpegProcess.stderr.on("data", (data) => {
      if(outputBuffers.length){
        fs.writeFile("/home/hf/Desktop/projects/Nodejs/hlc/temp2/chunks/test"+counter+".m3u8", Buffer.concat(outputBuffers),  "binary",function(err) { });
        counter++;
        outputBuffers = []
      }
      console.error(`stderr: ${data}`);
    });

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        const outputBuffer = Buffer.concat(outputBuffers);
        console.log("FFmpeg processing finished");
        resolve({
          playlist: `#EXT-X-STREAM-INF:BANDWIDTH=${resolution.bitrate.replace(
            "k",
            "000"
          )},RESOLUTION=${resolution.width}x${
            resolution.height
          }\n${fileBaseName}_${resolution.label}.m3u8\n`,
          buffer: outputBuffer,
        });
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpegProcess.on("error", (err) => {
      reject(err);
    });
  });
}

// Example usage:
const resolution = {
  width: 426,
  height: 240,
  bitrate: "400k",
  label: "426x240",
};
const fileBaseName = "video2";

createHlsStream(resolution, fileBaseName)
  .then((result) => {
    console.log("Playlist:", result.playlist);
    fs.writeFile("test", result.buffer,  "binary",function(err) { });

    // Do something with result.buffer, which contains the HLS segments
  })
  .catch((err) => {
    console.error("Error creating HLS stream:", err);
  });

app.listen(PORT, () => {
  console.log(`HLS streaming server is running on http://localhost:${PORT}`);
  createHlsStream(resolution,fileBaseName);
});

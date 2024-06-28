'use strict';

const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk');
const { PassThrough } = require('stream');

const app = express();
const PORT = process.env.PORT || 8000;

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

// Enable CORS for all routes
app.use(cors());

const resolutions = [
    { width: 1920, height: 1080, bitrate: '5000k', label: '1080p' },
    { width: 1280, height: 720, bitrate: '2800k', label: '720p' },
    { width: 854, height: 480, bitrate: '1400k', label: '480p' },
    { width: 640, height: 360, bitrate: '800k', label: '360p' },
    { width: 426, height: 240, bitrate: '400k', label: '240p' }
];

const uploadToS3 = (buffer, key) => {
    return s3.upload({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType: 'application/vnd.apple.mpegurl'
    }).promise();
};

const getHlsCommand = (buffer, resolution, fileBaseName) => {
    return new Promise((resolve, reject) => {
        const outputBuffers = [];
        const passThrough = new PassThrough();
        
        ffmpeg()
            .input('/home/hf/Desktop/projects/Nodejs/hlc/videos/video2.mp4')
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
                `-vf scale=${resolution.width}:${resolution.height}`,
                `-b:v ${resolution.bitrate}`,
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ])
            .output(passThrough)
            .on('end', () => {
                const outputBuffer = Buffer.concat(outputBuffers);
                resolve({
                    playlist: `#EXT-X-STREAM-INF:BANDWIDTH=${resolution.bitrate.replace('k', '000')},RESOLUTION=${resolution.width}x${resolution.height}\n${fileBaseName}_${resolution.label}.m3u8\n`,
                    buffer: outputBuffer
                });
            })
            .on('error', (err) => reject(err))
            .pipe(passThrough, { end: true });

        passThrough.on('data', (chunk) => outputBuffers.push(chunk));
    });
};

// Endpoint to receive video buffer and process it
app.post('/upload', express.raw({ type: 'video/*', limit: '500mb' }), async (req, res) => {
    const buffer = req.body;
    const fileBaseName = `video_${Date.now()}`;
    const masterPlaylist = `#EXTM3U\n`;

    try {
        const results = await Promise.all(
            resolutions.map(res => getHlsCommand(buffer, res, fileBaseName))
        );

        const playlists = results.map(result => result.playlist).join('');
        const masterPlaylistBuffer = Buffer.from(masterPlaylist + playlists);

        // Upload the master playlist to S3
        await uploadToS3(masterPlaylistBuffer, `${fileBaseName}_master.m3u8`);

        // Upload the individual renditions to S3
        await Promise.all(results.map((result, index) =>
            uploadToS3(result.buffer, `${fileBaseName}_${resolutions[index].label}.m3u8`)
        ));

        // Respond with the URL to the master playlist
        res.json({
            masterPlaylistUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileBaseName}_master.m3u8`
        });

    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`HLS streaming server is running on http://localhost:${PORT}`);
});

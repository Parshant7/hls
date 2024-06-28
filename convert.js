'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, './videos'); // Change to videos directory
const dest = path.join(__dirname, './temp/chunks');

const startTime = new Date();
console.info('> Start reading files', startTime);

const resolutions = [
    { width: 1920, height: 1080, bitrate: '5000k' },
    { width: 1280, height: 720, bitrate: '2800k' },
    { width: 854, height: 480, bitrate: '1400k' },
    { width: 640, height: 360, bitrate: '800k' },
    { width: 426, height: 240, bitrate: '400k' }
];

fs.readdir(dir, (readDirError, files) => {
    if (readDirError) {
        console.error(readDirError);
        return;
    }

    const countFiles = files.length;
    files.map(async (file, index) => {
        const fileName = path.join(dir, file);
        const fileBaseName = path.parse(file).name;
        const masterPlaylist = `${dest}/${fileBaseName}_master.m3u8`;

        // Generate renditions
        const renditions = resolutions.map(async (res, resIndex) => {
            const renditionDest = `${dest}/${fileBaseName}_${res.width}x${res.height}`;
            const command = `ffmpeg -i ${fileName} -vf scale=${res.width}:${res.height} -b:v ${res.bitrate} -hls_time 10 -hls_list_size 0 -f hls ${renditionDest}.m3u8`;
            console.log(command);

            try {
                await exec(command);
                return `#EXT-X-STREAM-INF:BANDWIDTH=${res.bitrate.replace('k', '000')},RESOLUTION=${res.width}x${res.height}\n${fileBaseName}_${res.width}x${res.height}.m3u8\n`;
            } catch (err) {
                console.error(`Error generating rendition ${res.width}x${res.height} for file ${fileName}:`, err);
                return '';
            }
        });

        // Wait for all renditions to finish
        const renditionPlaylists = await Promise.all(renditions);

        // Create master playlist
        fs.writeFile(masterPlaylist, '#EXTM3U\n' + renditionPlaylists.join(''), writeFileError => {
            if (writeFileError) {
                console.error(`Error writing master playlist for file ${fileName}:`, writeFileError);
            }
        });

        if (countFiles - 1 === index) {
            const endTime = new Date();
            console.info('< End Preparing files', endTime);
        }
    });
});
// ffmpeg -i /home/hf/Desktop/projects/Nodejs/hlc/videos/video2.mp4 -vf scale=426:240 -b:v 400k -hls_time 10 -hls_list_size 0 -f hls /home/hf/Desktop/projects/Nodejs/hlc/temp/chunks/video2_426x240.m3u8
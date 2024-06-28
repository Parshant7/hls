const util = require('util');
const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");
const { PassThrough } = require('stream');

let counter = 1;

const resolutions = [
    // { width: 1920, height: 1080, bitrate: '5000k', label: '1080p' },
    // { width: 1280, height: 720, bitrate: '2800k', label: '720p' },
    // { width: 854, height: 480, bitrate: '1400k', label: '480p' },
    // { width: 640, height: 360, bitrate: '800k', label: '360p' },
    { width: 426, height: 240, bitrate: '400k', label: '240p' }
];

const getHlsCommand = (buffer, resolution, fileBaseName) => {
    return new Promise((resolve, reject) => {
        const outputBuffers = [];
        const passThrough = new PassThrough();

            ffmpeg()
            .input('/home/hf/Desktop/projects/Nodejs/hlc/videos/video2.mp4')
            .outputOptions([
                `-vf scale=${resolution.width}:${resolution.height}`,
                `-b:v ${resolution.bitrate}`,
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ])            
            // .outputFormat("null")
            .output("/home/hf/Desktop/projects/Nodejs/hlc/temp2/chunks/")
            .on('data', (data)=>{
                console.log("this is data ", data)
            })
            // .output(path.join('/home/hf/Desktop/projects/Nodejs/hlc/temp/chunks', `${fileBaseName}_${resolution.label}.m3u8`))
            .on('end', (data,data2) => {
                console.log("data ",data);
                console.log("data2 ",data2);
                const outputBuffer = Buffer.concat(outputBuffers);
                console.log("output buffer",outputBuffers);
                resolve({
                    playlist: `#EXT-X-STREAM-INF:BANDWIDTH=${resolution.bitrate.replace('k', '000')},RESOLUTION=${resolution.width}x${resolution.height}\n${fileBaseName}_${resolution.label}.m3u8\n`,
                    buffer: outputBuffer
                });
            })
            .on('error', (err) => reject(err))
            .run()
            // .pipe(passThrough, { end: true });

            // passThrough.on('data', (chunk) => outputBuffers.push(chunk));

            // .outputFormat
            // .output(`/home/hf/Desktop/projects/Nodejs/hlc/temp2/chunks/${fileBaseName}_${resolution.width}x${resolution.height}.m3u8`)
            // video2_426x240.m3u8            
// ffmpeg -i /home/hf/Desktop/projects/Nodejs/hlc/videos/video2.mp4 -vf scale=426:240 -b:v 400k -hls_time 10 -hls_list_size 0 -f hls http://localhost:8000/videos/temp
        // command.on('start', (cmd) => console.log(cmd))
        //     .on('data', (chunk) => {outputBuffers.push(chunk); console.log("counter ", counter++)})
        //     .on('end', () => {
        //         const outputBuffer = Buffer.concat(outputBuffers);
        //         console.log("outputBuffer ", outputBuffer);
        //         resolve({
        //             playlist: `#EXT-X-STREAM-INF:BANDWIDTH=${resolution.bitrate.replace('k', '000')},RESOLUTION=${resolution.width}x${resolution.height}\n${fileBaseName}_${resolution.label}.m3u8\n`,
        //             buffer: outputBuffer
        //         });
        //     })
        //     .on('error', (err) => {console.log(err); reject(err)})
        //     .pipe(PassThrough, { end: true });

        // command.run();
    });
};

module.exports.segmentation = async(fileBuffer)=>{
    // const randomName = 
    const fileBaseName = `video_${Date.now()}`;
    // const masterPlaylist = `${fileBaseName}_master.m3u8`;
    const masterPlaylist = `#EXTM3U\n`;

    // const results = await Promise.all(
    //     resolutions.map(res => getHlsCommand(fileBuffer, res, fileBaseName))
    // );
    getHlsCommand(fileBuffer, resolutions[0], fileBaseName)
    // const playlists = results.map(result => result.playlist).join('');
    // results.forEach((result)=>{
    //     console.log(result);
    // })
    // const masterPlaylistBuffer = Buffer.from(masterPlaylist+playlists);
}
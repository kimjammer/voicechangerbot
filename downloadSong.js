const youtubedl = require('youtube-dl-exec');

module.exports = {
    async execute(URL) {
        try {
            let output = await youtubedl(URL, {
                preferFreeFormats: true,
                noWarnings: true,
                paths: "./musicDownloads",
                output: "music.%(ext)s",
                format: "bestaudio"
            })
            return 0;
        }catch (e){
            console.log(e);
            return -1;
        }
    }
}
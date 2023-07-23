const child_process = require("child_process");
const { condaLocation, condaEnvName } = require('./config.json')

module.exports = {
    async execute() {
        return new Promise((resolve, reject) => {
            //Run the python script that will split the song into vocal and instrumental
            const python = child_process.spawn(condaLocation, ['run', '-n', condaEnvName, 'python3', '../voicechangerbot/processMusicSplit.py'], {cwd:"../Retrieval-based-Voice-Conversion-WebUI", shell: true});
            python.on("error", (e) => {
                console.log(e);
            })

            // collect data from script
            python.stdout.on('data', function (data) {
                console.log('Pipe data from python script ...');
                console.log(data.toString());
            });

            // in close event we are sure that stream from child process is closed
            python.on('close', (code) => {
                console.log(`child process close all stdio with code ${code}`);
                if (code === 0) {
                    resolve(0);
                }else {
                    reject(-1);
                }
            });
        })
    }
}
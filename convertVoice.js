const child_process = require("child_process");
const { condaLocation, condaEnvName } = require('./config.json')

module.exports = {
    async execute(pitchcontrol, voice) {
        let f0up_key;
        if (pitchcontrol === "nochange") {
            f0up_key = "0";
        }else if (pitchcontrol === "pitchup") {
            f0up_key = "12";
        }else if (pitchcontrol === "pitchdown") {
            f0up_key = "-12";
        }

        return new Promise((resolve, reject) => {
            //Run the python script that will split the song into vocal and instrumental
            const python = child_process.spawn(condaLocation, ['run', '-n', condaEnvName, 'python3', './infer_batch_rvc.py', f0up_key, '../voicechangerbot/vocalSeparated', `../voicechangerbot/indexFiles/${voice}.index`,'harvest', '../voicechangerbot/generatedVoice', `./weights/${voice}.pth`,'0.8','cuda:0','True','4','0','1','0.33'], {cwd:"../Retrieval-based-Voice-Conversion-WebUI", shell: true});

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
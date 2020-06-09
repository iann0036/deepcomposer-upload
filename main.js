#!/usr/bin/env node

const fs = require('fs')
const request = require('request');
const aws4 = require('aws4');
const AWS = require('aws-sdk');
const parseMidi = require('midi-file').parseMidi;
const writeMidi = require('midi-file').writeMidi;
const cliargs = require('commander');
const pjson = require('./package.json');

function uploadSampleToDeepComposer(cliopts) {
    const inputFh = fs.readFileSync(cliopts.inputFilename);

    let chain = new AWS.CredentialProviderChain();
    chain.resolve((err, awscreds) => {
        let midiFile = parseMidi(inputFh);
        let tempo = 600000;
        let deltaCumulative = 0;
        midiFile.tracks.forEach(track => {
            track.forEach(action => {
                if (action.type == 'setTempo') {
                    tempo = action.microsecondsPerBeat;
                }
            });
        });
        let filteredactions = midiFile.tracks.pop().filter(action => {
            if (action.type == 'setTempo') {
                tempo = action.microsecondsPerBeat;
            }
            if (['noteOn', 'noteOff', 'endOfTrack'].includes(action.type) && deltaCumulative < midiFile.header.ticksPerBeat * 31) {
                if (action.deltaTime) {
                    deltaCumulative += action.deltaTime;
                }
                return true;
            }
            return false;
        });

        console.log("Tempo: " + tempo);
        console.log("Ticks per beat: " + midiFile.header.ticksPerBeat);
        console.log("Cumulative delta time: " + deltaCumulative);

        midiFile.header = {
            'format': 1,
            'numTracks': 2,
            'ticksPerBeat': midiFile.header.ticksPerBeat
        };
        midiFile.tracks = [
            [
                { deltaTime: 0, meta: true, type: 'trackName', text: '' },
                {
                    deltaTime: 0,
                    meta: true,
                    type: 'setTempo',
                    microsecondsPerBeat: tempo
                },
                { deltaTime: 0, meta: true, type: 'endOfTrack' }
            ],
            [
                { deltaTime: 0, meta: true, type: 'trackName', text: '' },
                { deltaTime: 0, channel: 0, type: 'programChange', programNumber: 0 }
            ].concat(filteredactions)
        ];

        let inputMidiB64 = Buffer.from(writeMidi(midiFile)).toString('base64');
        let jsonBody = {
            'inputMidi': inputMidiB64,
            'modelId': cliopts.modelId,
            'name': cliopts.sampleName,
            'modelType': 'SAMPLE',
            'inputMidiSource': 'VIRTUAL'
        };
        if (cliopts.maxPercentageRemoved && cliopts.maxNotesAdded && cliopts.samplingIterations && cliopts.creativeRisk) {
            jsonBody['inferenceHyperParameters'] = {
                "maxPercentageOfInitialNotesRemoved": parseInt(cliopts.maxPercentageRemoved),
                "maxNotesAdded": parseInt(cliopts.maxNotesAdded),
                "samplingIterations": parseInt(cliopts.samplingIterations),
                "temperature": parseFloat(cliopts.creativeRisk)
            };
        }
        let awsreq = aws4.sign({
            service: 'deepcomposer',
            region: 'us-east-1',
            method: 'POST',
            path: '/compositions',
            headers: {
                'Content-Type': 'application/x-amz-json-1.1',
                'X-Amz-Target': 'DeepComposer.CreateComposition'
            },
            body: JSON.stringify(jsonBody)
        }, {
            secretAccessKey: awscreds.secretAccessKey,
            accessKeyId: awscreds.accessKeyId
        });
        
        request.post({
            url: 'https://' + awsreq.hostname + awsreq.path,
            headers: awsreq.headers,
            body: awsreq.body
        }, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
            }
            try {
                let msg = JSON.parse(body);
                if (msg.composition) {
                    if (cliopts.outputFilename) {
                        fs.writeFileSync(cliopts.outputFilename, msg.composition.outputMidi, 'base64');
                        console.log('Wrote ' + cliopts.outputFilename);
                    } else {
                        console.log('Uploaded MIDI file');
                    }
                } else {
                    console.log(msg);
                }
            } catch(err) {
                console.log(body);
            }
        });
    });
}

if (require.main === module) { // if main prog.
    let validation = false;
    cliargs
        .version(pjson.version)
        .requiredOption('-i, --input-filename <filename>', 'filename for input MIDI file')
        .requiredOption('-n, --sample-name <name>', 'name of the sample being uploaded')
        .option('-m, --model-id <id>', 'the model ID to generate against', 'genre-rock-1')
        .option('-o, --output-filename <filename>', 'filename for output MIDI file')
        .option('--max-percentage-removed <number>', 'the maximum percentage of initial notes removed (0-100) (autoregressive only)')
        .option('--max-notes-added <number>', 'the maximum notes to be added (50-1000) (autoregressive only)')
        .option('--sampling-iterations <number>', 'the sampling iterations (0-100) (autoregressive only)')
        .option('--creative-risk <number>', 'the creative risk factor (0.5-6) (autoregressive only)')
        .action(async (opts) => {
            await uploadSampleToDeepComposer(opts);
        });

    cliargs.parse(process.argv);
}

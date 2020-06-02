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
        let filteredactions = midiFile.tracks.pop().filter(action => {
            if (action.type == 'setTempo') {
                tempo = action.microsecondsPerBeat;
            }
            return ['noteOn', 'noteOff', 'endOfTrack'].includes(action.type);
        });

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
        let awsreq = aws4.sign({
            service: 'deepcomposer',
            region: 'us-east-1',
            method: 'POST',
            path: '/compositions',
            headers: {
                'Content-Type': 'application/x-amz-json-1.1',
                'X-Amz-Target': 'DeepComposer.CreateComposition'
            },
            body: JSON.stringify({
                'inputMidi': inputMidiB64,
                'modelId': cliopts.modelId,
                'name': cliopts.sampleName,
                'modelType': 'SAMPLE',
                'inputMidiSource': 'VIRTUAL'
            })
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
        .action(async (opts) => {
            await uploadSampleToDeepComposer(opts);
        });

    cliargs.parse(process.argv);
}

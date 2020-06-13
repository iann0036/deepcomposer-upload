# deepcomposer-upload

<span class="badge-npmversion"><a href="https://npmjs.org/package/deepcomposer-upload" title="View this project on NPM"><img src="https://img.shields.io/npm/v/deepcomposer-upload.svg" alt="NPM version" /></a></span>

> Upload a single-track MIDI to the AWS DeepComposer service

## Installation

```
npm i -g deepcomposer-upload
```

## Usage

Input MIDI files should have a tempo that remains static. Only the first 8 bars will be processed.

```
deepcomposer-upload -i input.mid -n nameoftrack -m genre-rock-1 -o output.mid
```

```
deepcomposer-upload \
  -i input.mid \
  -n nameoftrack \
  -m ar-cnn-bach \
  -o output.mid \
  --max-percentage-removed 100 \
  --max-notes-added 50 \
  --sampling-iterations 100 \
  --creative-risk 1.5
```

#### -i, --input-filename &lt;filename&gt; (Required)

The filename of the input MIDI file

#### -n, --sample-name &lt;name&gt;

The name of the sample, used to register in Music studio (required when uploading)

#### -m, --model-id &lt;id&gt;

The ID of the model used to generate new tracks, defaults to `genre-rock-1`

###### GAN-based

* `genre-rock-1`
* `genre-pop-1`
* `genre-jazz-1`
* `genre-joco-1`
* `genre-symphony-1`

###### Autoregressive-based

* `ar-cnn-bach`

#### -o, --output-filename &lt;filename&gt;

The name of the output filename of the generated MIDI file, if you wish to save it

#### --max-percentage-removed &lt;number&gt;

_Autoregressive only_

The maximum percentage of initial notes removed (0-100)

#### --max-notes-added &lt;number&gt;

_Autoregressive only_

The maximum notes to be added (50-1000)

#### --sampling-iterations &lt;number&gt;

_Autoregressive only_

The sampling iterations (0-100)

#### --creative-risk &lt;number&gt;

_Autoregressive only_

As risk increases, compositions will become more experimental (0.5-6)

#### --list-tracks

Lists tracks in the input MIDI file, and ignores uploading to the DeepComposer service

#### --track-number &lt;number&gt;

Selects the track number to process, as shown by `--list-tracks`

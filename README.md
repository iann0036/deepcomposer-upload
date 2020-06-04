# deepcomposer-upload

<span class="badge-npmversion"><a href="https://npmjs.org/package/deepcomposer-upload" title="View this project on NPM"><img src="https://img.shields.io/npm/v/deepcomposer-upload.svg" alt="NPM version" /></a></span>

> Upload a single-track MIDI to the AWS DeepComposer service

## Installation

```
npm i -g deepcomposer-upload
```

## Usage

Input MIDI files should have a single track and 8 bars or less, tempo should remain static.

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

#### -i, --input-filename (Required)

The filename of the input MIDI file

#### -n, --sample-name (Required)

The name of the sample, used to register in Music studio

#### -m, --model-id

The ID of the model used to generate new tracks, defaults to `genre-rock-1`

###### GAN-based

* `genre-rock-1`
* `genre-pop-1`
* `genre-jazz-1`
* `genre-joco-1`
* `genre-symphony-1`

###### Autoregressive-based

* `ar-cnn-bach`

#### -o, --output-filename

The name of the output filename of the generated MIDI file, if you wish to save it

#### --max-percentage-removed

_Autoregressive only_

The maximum percentage of initial notes removed (0-100)

#### --max-notes-added

_Autoregressive only_

The maximum notes to be added (50-1000)

#### --sampling-iterations

_Autoregressive only_

The sampling iterations (0-100)

#### --creative-risk

_Autoregressive only_

As risk increases, compositions will become more experimental (0.5-6)

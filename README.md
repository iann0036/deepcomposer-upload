# deepcomposer-upload

> Upload a single-track MIDI to the AWS DeepComposer service

## Installation

```
npm i -g deepcomposer-upload
```

## Usage

```
deepcomposer-upload --input-filename input.mid --sample-name nameoftrack --model-id genre-rock-1 --output-filename output.mid
```

Input MIDI files should be a single track and 8 bars or less, tempo should remain static.

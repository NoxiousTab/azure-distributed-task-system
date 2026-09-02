# tessdata

This folder needs `eng.traineddata` from Tesseract's official trained-data repo before
`image-to-text` will work. It's not checked into source (it's a multi-MB binary file
that doesn't belong in git history).

Download it from:
https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata

(the standard/full-accuracy set - there's also a `tessdata_fast` and `tessdata_best`
repo from the same org if you want to trade accuracy for size/speed later)

Save it as:
worker/tessdata/eng.traineddata

`worker.csproj` copies everything in this folder to the build output directory, and
`ImageToTextHandler` reads from `<output dir>/tessdata` at runtime - so once the file
is here, a normal `dotnet build` / `func start` picks it up with no other config.

If you later want more languages, drop the matching `.traineddata` file in here too
(e.g. `fra.traineddata`) - the handler would need a small change to accept a language
parameter, currently it's hardcoded to `"eng"`.

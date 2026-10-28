## bunkr-download 1.0.0

First public release: preview a Bunkr album, pick the files you want and download them, with resumable downloads, a queue and a CLI.

### Downloads

| File | What it is |
|---|---|
| `bunkr-download-1.0.0-portable.exe` | Desktop app for Windows 10/11 (x64). Nothing to install: download and run. |
| `bunkr-download-extension-v1.0.0.zip` | Chrome extension (beta) with the same app in a browser tab. |

**Windows SmartScreen:** the app is not code-signed yet, so Windows may show "Windows protected your PC" on the first launch. Click **More info → Run anyway**.

**Chrome extension:** unzip the file into a folder you keep, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick that folder.

**CLI:** needs Node.js 20 or newer. Clone the repository, run `npm install`, then `node src/index.js --help`.

### Highlights

- Album preview with thumbnails, names and exact sizes; click, Shift+click and Select all.
- Filters by type, name, extension and size; sort and thumbnail size.
- Resumable downloads: Stop keeps partial files and the next run continues them; Retry failed.
- Check disk: finds files that are missing, incomplete or broken in your folder, locally only.
- Download queue for several albums, saved albums, album search by title.
- Discreet view and name cipher for privacy; two themes.
- Retries with backoff, speed limit, proxy, Bunkr maintenance handling, free disk space check.

See the [README](https://github.com/hongseoul/bunkr-download#readme) for the full feature list and usage guide.

Not affiliated with Bunkr. Download only content you own or are allowed to download.

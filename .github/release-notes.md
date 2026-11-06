## bunkr-download 1.1.0

A friendlier download queue: every album keeps its own folder, shows its size, and the queue warns you before a drive runs out of space.

### Downloads

| File | What it is |
|---|---|
| `bunkr-download-1.1.0-portable.exe` | Desktop app for Windows 10/11 (x64). Nothing to install: download and run. |
| `bunkr-download-extension-v1.1.0.zip` | Chrome extension (beta) with the same app in a browser tab. |

**Windows SmartScreen:** the app is not code-signed yet, so Windows may show "Windows protected your PC" on the first launch. Click **More info → Run anyway**.

**Chrome extension:** unzip the file into a folder you keep, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick that folder. To update, replace the folder's contents and click the reload button on the extension card.

**CLI:** needs Node.js 20 or newer. Clone the repository, run `npm install`, then `node src/index.js --help`.

### What's new

- **Queue: a folder per album.** The **Save to** chip under the Add albums box sets where the albums you add next go. Every queued album remembers its folder (shown on its row), so you can add a few albums, switch the folder and add more. **Change folder for all waiting…** moves every album that has not downloaded yet to one folder. Albums queued by 1.0.0 keep the folder they would have used.
- **Queue: album sizes and free-space warning.** Each row shows the album's size (only the selected files count). Above the list, every drive the queue saves to gets a line with the queue's total and the drive's free space: green when it fits, amber when little space will be left, red when it will not fit, and the album where space runs out is marked **won't fit**. Free space is checked in the desktop app only.
- **Search links work in the link field.** Pasting a balbums.st search link (for example `https://balbums.st/?search=beach&mode=strict`) opens that same search in the app, with its mode, sort and page size, instead of failing with "Not an album URL".
- **Dismiss the progress panel.** After a download finishes, an × button hides its progress panel.

See the [README](https://github.com/hongseoul/bunkr-download#readme) for the full feature list and usage guide.

Not affiliated with Bunkr. Download only content you own or are allowed to download.

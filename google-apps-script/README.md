# Google Sheets Response Storage

## Setup

1. Create a new Google Sheet.
2. Open `Extensions` -> `Apps Script`.
3. Delete the default code.
4. Paste the contents of `Code.gs` into Apps Script.
5. Click `Save`.
6. Click `Deploy` -> `New deployment`.
7. Select type `Web app`.
8. Set `Execute as` to `Me`.
9. Set `Who has access` to `Anyone`.
10. Click `Deploy`.
11. Copy the Web app URL.
12. In `app/page.js`, replace:

```js
const GOOGLE_SHEETS_WEB_APP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

with your copied URL.

## CSV Export

In Google Sheets, use `File` -> `Download` -> `Comma Separated Values (.csv)`.

The script stores one row per participant per case. For example, if one participant completes 18 cases, the sheet receives 18 rows.

# Face Inpainting User Study

A small Next.js and Tailwind CSS website for a master thesis user study comparing face inpainting outputs.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal, usually `http://localhost:3000`.

## Edit the study

The main file is `app/page.js`.

- Change `TOTAL_STUDY_CASES` to match how many complete image sets you have.
- Replace `GOOGLE_SHEETS_WEB_APP_URL` with your Google Apps Script Web app URL.
- Put all image files in `public/images/`.

Each case should include one reference/original image, one mask or occluded image, and three method outputs.

## Store responses in Google Sheets

The app submits responses to Google Sheets through a small Apps Script web app.
See `google-apps-script/README.md` and paste `google-apps-script/Code.gs` into Apps Script.

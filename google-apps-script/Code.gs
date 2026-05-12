const SHEET_NAME = "Responses";

const HEADERS = [
  "submittedAt",
  "participantId",
  "totalCases",
  "caseId",
  "maskType",
  "imageA_method",
  "imageA_src",
  "imageB_method",
  "imageB_src",
  "imageC_method",
  "imageC_src",
  "mostRealistic_label",
  "mostRealistic_method",
  "facialConsistency_label",
  "facialConsistency_method",
  "visualNaturalness_label",
  "visualNaturalness_method",
  "responsesJson"
];

function doPost(e) {
  const payload = JSON.parse(e.parameter.payload || e.postData.contents);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(spreadsheet);

  ensureHeaderRow(sheet);

  const rows = payload.responses.map((response) => {
    const outputA = findOutput(response.outputOrder, "A");
    const outputB = findOutput(response.outputOrder, "B");
    const outputC = findOutput(response.outputOrder, "C");
    const answers = response.answers || {};

    return [
      payload.submittedAt,
      payload.participantId,
      payload.totalCases,
      response.caseId,
      response.maskType,
      outputA.method,
      outputA.src,
      outputB.method,
      outputB.src,
      outputC.method,
      outputC.src,
      getAnswerLabel(answers.mostRealistic),
      getAnswerMethod(answers.mostRealistic),
      getAnswerLabel(answers.facialConsistency),
      getAnswerMethod(answers.facialConsistency),
      getAnswerLabel(answers.visualNaturalness),
      getAnswerMethod(answers.visualNaturalness),
      payload.responsesJson
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(spreadsheet) {
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaderRow(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
}

function findOutput(outputOrder, label) {
  return outputOrder.find((output) => output.label === label) || { method: "", src: "" };
}

function getAnswerLabel(answer) {
  return answer ? answer.selectedLabel : "";
}

function getAnswerMethod(answer) {
  return answer ? answer.selectedMethod : "";
}

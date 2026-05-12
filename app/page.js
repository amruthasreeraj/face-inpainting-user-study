"use client";

import { useEffect, useState } from "react";

const GOOGLE_SHEETS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbw7KC-58DPUaLMB1KBqeT2zDIiqtfId6WEVKaMbM7SIBrj6qprIZUw5_r3NLFXi4JIH/exec";

// The app expects image files named like:
// img_001_original.png, img_001_mask.png, img_001_hybrid.png,
// img_001_diffusion.png, img_001_exemplar.png
// Continue the same pattern up to the last case you have added.
// Change this if you add or remove study cases.
const TOTAL_STUDY_CASES = 60;

const studyCases = Array.from({ length: TOTAL_STUDY_CASES }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");

  return {
    id: `img_${number}_semantic_run1`,
    maskType: "Semantic region",
    reference: `/images/img_${number}_original.png`,
    mask: `/images/img_${number}_mask.png`,
    outputs: [
      { method: "Hybrid", src: `/images/img_${number}_hybrid.png` },
      { method: "Diffusion-only", src: `/images/img_${number}_diffusion.png` },
      { method: "Exemplar", src: `/images/img_${number}_exemplar.png` }
    ]
  };
});

const questions = [
  {
    id: "mostRealistic",
    label: "Which image looks most realistic?"
  },
  {
    id: "facialConsistency",
    label: "Which image preserves facial consistency best?"
  },
  {
    id: "visualNaturalness",
    label: "Which image looks most visually natural?"
  }
];

function shuffleArray(items) {
  return [...items]
    .map((item) => ({ item, sortKey: Math.random() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ item }) => item);
}

function makeRandomizedCases(cases) {
  return cases.map((studyCase) => {
    const labels = ["A", "B", "C"];
    const randomizedOutputs = shuffleArray(studyCase.outputs).map((output, index) => ({
      ...output,
      label: labels[index]
    }));

    return {
      ...studyCase,
      randomizedOutputs
    };
  });
}

function getSelectedMethod(currentCase, selectedLabel) {
  return (
    currentCase.randomizedOutputs.find((output) => output.label === selectedLabel)?.method ?? ""
  );
}

export default function Home() {
  const [randomizedCases, setRandomizedCases] = useState([]);
  const [participantId, setParticipantId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitState, setSubmitState] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setRandomizedCases(makeRandomizedCases(studyCases));
    setParticipantId(`P-${Date.now().toString().slice(-6)}`);
  }, []);

  if (randomizedCases.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-4">
        <p className="text-sm font-medium text-slate-700">Loading study...</p>
      </main>
    );
  }

  const currentCase = randomizedCases[currentIndex];
  const currentAnswers = answers[currentCase.id] ?? {};
  const isCurrentCaseComplete = questions.every((question) => currentAnswers[question.id]);
  const isLastCase = currentIndex === randomizedCases.length - 1;
  const progressText = `Case ${currentIndex + 1} of ${randomizedCases.length}`;

  function updateAnswer(questionId, selectedLabel) {
    const selectedMethod = getSelectedMethod(currentCase, selectedLabel);

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [currentCase.id]: {
        ...previousAnswers[currentCase.id],
        [questionId]: {
          selectedLabel,
          selectedMethod
        }
      }
    }));
  }

  function goToPreviousCase() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function goToNextCase() {
    if (!isCurrentCaseComplete) return;
    setCurrentIndex((index) => Math.min(index + 1, randomizedCases.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildSubmissionPayload() {
    const responses = randomizedCases.map((studyCase) => ({
      caseId: studyCase.id,
      maskType: studyCase.maskType,
      outputOrder: studyCase.randomizedOutputs.map((output) => ({
        label: output.label,
        method: output.method,
        src: output.src
      })),
      answers: answers[studyCase.id] ?? {}
    }));

    return {
      _subject: `Face inpainting study response: ${participantId}`,
      participantId,
      submittedAt: new Date().toISOString(),
      totalCases: randomizedCases.length,
      responses,
      responsesJson: JSON.stringify(responses)
    };
  }

  async function submitStudy() {
    if (!isCurrentCaseComplete || submitState === "submitting") return;

    setSubmitState("submitting");
    setSubmitMessage("");

    const payload = buildSubmissionPayload();

    try {
      if (GOOGLE_SHEETS_WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
        throw new Error("Google Apps Script URL is not configured yet.");
      }

      submitPayloadWithHiddenForm(payload);
      setSubmitState("success");
      setSubmitMessage("Thank you. Your responses have been submitted.");
    } catch (error) {
      console.error(error);
      setSubmitState("error");
      setSubmitMessage(
        `The submission could not be sent. ${error.message || "Please check the Google Apps Script URL and try again."}`
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 border-b border-stone-300 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-wide text-teal-700">
                Face inpainting study
              </p>
              <h1 className="text-3xl font-semibold text-slate-950">
                Image comparison task
              </h1>
            </div>
            <div className="w-full max-w-xs">
              <label
                htmlFor="participantId"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Participant ID
              </label>
              <input
                id="participantId"
                value={participantId}
                onChange={(event) => setParticipantId(event.target.value)}
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-teal-700 focus:ring-2"
              />
            </div>
          </div>
        </header>

        {submitState === "success" ? (
          <section className="rounded border border-teal-300 bg-white p-8 text-center">
            <h2 className="mb-3 text-2xl font-semibold text-slate-950">Study complete</h2>
            <p className="text-slate-700">{submitMessage}</p>
          </section>
        ) : !hasStarted ? (
          <section className="rounded border border-stone-300 bg-white p-6 sm:p-8">
            <h2 className="mb-5 text-2xl font-semibold text-slate-950">
              Important Instructions
            </h2>

            <div className="space-y-5 text-base leading-7 text-slate-700">
              <p>You will be shown:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>one original image,</li>
                <li>one masked image,</li>
                <li>and a set of 3 reconstructed experimental images.</li>
              </ul>

              <p>
                For each set, please answer the evaluation questions based on your
                visual judgment.
              </p>

              <p>Please focus mainly on:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>the face/person,</li>
                <li>facial consistency,</li>
                <li>and natural appearance,</li>
              </ul>

              <p>
                rather than overall picture quality or background details.
              </p>

              <p>
                The study contains approximately {randomizedCases.length} image sets.
                Ideally, each set should take around 20-30 seconds, but you may take
                as much time as needed.
              </p>

              <p>
                There are no right or wrong answers. Please select the image you
                personally find most realistic and visually natural.
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setHasStarted(true)}
                className="rounded bg-teal-700 px-6 py-3 text-sm font-semibold text-white"
              >
                Start study
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-5 flex flex-col gap-3 border-b border-stone-300 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{progressText}</p>
                <h2 className="text-xl font-semibold text-slate-950">{currentCase.id}</h2>
                <p className="text-sm text-slate-600">Mask type: {currentCase.maskType}</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-stone-200 md:w-64">
                <div
                  className="h-full bg-teal-700 transition-all"
                  style={{
                    width: `${((currentIndex + 1) / randomizedCases.length) * 100}%`
                  }}
                />
              </div>
            </section>

            <section className="mb-8 grid gap-4 md:grid-cols-2">
              <ImagePanel title="Reference / original" src={currentCase.reference} />
              <ImagePanel title="Mask / occluded image" src={currentCase.mask} />
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-950">
                Output images
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {currentCase.randomizedOutputs.map((output) => (
                  <ImagePanel
                    key={output.label}
                    title={`Image ${output.label}`}
                    src={output.src}
                  />
                ))}
              </div>
            </section>

            <section className="mb-8 rounded border border-stone-300 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Questions</h2>
              <div className="space-y-5">
                {questions.map((question) => (
                  <fieldset key={question.id}>
                    <legend className="mb-2 font-medium text-slate-900">
                      {question.label}
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {["A", "B", "C"].map((label) => (
                        <label
                          key={label}
                          className={`flex cursor-pointer items-center justify-center rounded border px-4 py-3 text-sm font-medium transition ${
                            currentAnswers[question.id]?.selectedLabel === label
                              ? "border-teal-700 bg-teal-50 text-teal-900"
                              : "border-stone-300 bg-stone-50 text-slate-800 hover:border-teal-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${currentCase.id}-${question.id}`}
                            value={label}
                            checked={currentAnswers[question.id]?.selectedLabel === label}
                            onChange={() => updateAnswer(question.id, label)}
                            className="sr-only"
                          />
                          Image {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </section>

            {submitState === "error" && (
              <p className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                {submitMessage}
              </p>
            )}

            <nav className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goToPreviousCase}
                disabled={currentIndex === 0}
                className="rounded border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {isLastCase ? (
                <button
                  type="button"
                  onClick={submitStudy}
                  disabled={!isCurrentCaseComplete || submitState === "submitting"}
                  className="rounded bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitState === "submitting" ? "Submitting..." : "Submit study"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextCase}
                  disabled={!isCurrentCaseComplete}
                  className="rounded bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next case
                </button>
              )}
            </nav>
          </>
        )}
      </div>
    </main>
  );
}

function submitPayloadWithHiddenForm(payload) {
  const iframeName = "google-sheets-submit-frame";
  let iframe = document.querySelector(`iframe[name="${iframeName}"]`);

  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = GOOGLE_SHEETS_WEB_APP_URL;
  form.target = iframeName;
  form.style.display = "none";

  const input = document.createElement("input");
  input.name = "payload";
  input.value = JSON.stringify(payload);

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function ImagePanel({ title, src }) {
  return (
    <figure className="rounded border border-stone-300 bg-white p-3">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded bg-stone-100">
        <img
          src={src}
          alt={title}
          className="h-full w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
      <figcaption className="mt-3 text-center text-sm font-medium text-slate-800">
        {title}
      </figcaption>
    </figure>
  );
}

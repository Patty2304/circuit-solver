// ====== SCREEN NAVIGATION ======
const screenWelcome = document.getElementById("screen-welcome");
const screenMenu = document.getElementById("screen-menu");
const screenRLC = document.getElementById("screen-rlc");
const screenOpamp = document.getElementById("screen-opamp");
const screenFilters = document.getElementById("screen-filters");

function showScreen(screen) {
  [screenWelcome, screenMenu, screenRLC, screenOpamp, screenFilters].forEach(
    (s) => s.classList.remove("active")
  );
  screen.classList.add("active");
}

// Buttons
document.getElementById("btn-start").addEventListener("click", () => {
  showScreen(screenMenu);
});

document.getElementById("btn-back-to-welcome").addEventListener("click", () => {
  showScreen(screenWelcome);
});

document.getElementById("btn-go-rlc").addEventListener("click", () => {
  showScreen(screenRLC);
});

document.getElementById("btn-go-opamp").addEventListener("click", () => {
  showScreen(screenOpamp);
});

document.getElementById("btn-go-filters").addEventListener("click", () => {
  showScreen(screenFilters);
});

document.getElementById("btn-rlc-back-menu").addEventListener("click", () => {
  showScreen(screenMenu);
});

document.getElementById("btn-opamp-back-menu").addEventListener("click", () => {
  showScreen(screenMenu);
});

document
  .getElementById("btn-filters-back-menu")
  .addEventListener("click", () => {
    showScreen(screenMenu);
  });

// ====== HELPER ======
function fmt(value, decimals = 3) {
  if (!isFinite(value)) return "NaN";
  return Number(value).toFixed(decimals);
}

// ====== RLC SECTION ======
const rlcTypeSelect = document.getElementById("rlcType");
const rlcHint = document.getElementById("rlcHint");
const rlcInputs = document.getElementById("rlcInputs");
const rlcResults = document.getElementById("rlcResults");

function updateRlcInputs() {
  const type = rlcTypeSelect.value;

  if (type === "rc") {
    rlcHint.textContent =
      "RC low-pass filter driven by sinusoidal input. Calculates cutoff frequency and gain at test frequency.";
    rlcInputs.innerHTML = `
      <div class="field-row">
        <div class="field">
          <label for="rc-vs">Input Amplitude V<sub>s</sub> (V peak)</label>
          <input type="number" id="rc-vs" value="5" step="0.1" />
        </div>
        <div class="field">
          <label for="rc-f">Test Frequency f (Hz)</label>
          <input type="number" id="rc-f" value="1000" step="10" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="rc-r">Resistance R (kΩ)</label>
          <input type="number" id="rc-r" value="10" step="0.1" />
        </div>
        <div class="field">
          <label for="rc-c">Capacitance C (nF)</label>
          <input type="number" id="rc-c" value="1" step="0.1" />
        </div>
      </div>
    `;
  } else if (type === "rl") {
    rlcHint.textContent =
      "Series RL circuit excited by a DC step. Computes time constant, current growth and inductor voltage.";
    rlcInputs.innerHTML = `
      <div class="field-row">
        <div class="field">
          <label for="rl-vs">Step Voltage V<sub>s</sub> (V)</label>
          <input type="number" id="rl-vs" value="12" step="0.1" />
        </div>
        <div class="field">
          <label for="rl-r">Resistance R (Ω)</label>
          <input type="number" id="rl-r" value="100" step="1" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="rl-l">Inductance L (mH)</label>
          <input type="number" id="rl-l" value="10" step="0.1" />
        </div>
        <div class="field">
          <label for="rl-t">Observation Time t (ms)</label>
          <input type="number" id="rl-t" value="5" step="0.1" />
        </div>
      </div>
    `;
  } else if (type === "lc") {
    rlcHint.textContent =
      "Ideal LC resonant circuit. Computes resonant frequency and angular frequency.";
    rlcInputs.innerHTML = `
      <div class="field-row">
        <div class="field">
          <label for="lc-l">Inductance L (mH)</label>
          <input type="number" id="lc-l" value="10" step="0.1" />
        </div>
        <div class="field">
          <label for="lc-c">Capacitance C (nF)</label>
          <input type="number" id="lc-c" value="1" step="0.1" />
        </div>
      </div>
    `;
  }
}

rlcTypeSelect.addEventListener("change", updateRlcInputs);
updateRlcInputs();

function solveRLC() {
  const type = rlcTypeSelect.value;
  if (type === "rc") {
    const Vs = parseFloat(document.getElementById("rc-vs").value);
    const f = parseFloat(document.getElementById("rc-f").value);
    const Rk = parseFloat(document.getElementById("rc-r").value);
    const Cn = parseFloat(document.getElementById("rc-c").value);

    if ([Vs, f, Rk, Cn].some((v) => isNaN(v) || v <= 0)) {
      rlcResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">Please enter positive values for Vs, f, R and C.</div>
        </div>`;
      return;
    }

    const R = Rk * 1e3;
    const C = Cn * 1e-9;
    const tau = R * C;
    const fc = 1 / (2 * Math.PI * tau);
    const w = 2 * Math.PI * f;
    const mag = 1 / Math.sqrt(1 + (w * tau) ** 2);
    const Vout = Vs * mag;

    let comment = "";
    if (f < fc / 5) {
      comment =
        "The test frequency is much lower than the cutoff, so the capacitor is almost open for AC and the output follows the input with little attenuation.";
    } else if (f > fc * 5) {
      comment =
        "The test frequency is much higher than the cutoff, so the capacitor effectively shorts AC to ground and the output is strongly attenuated.";
    } else {
      comment =
        "The test frequency lies around the cutoff region, so the output amplitude is roughly 0.7 times the input (about −3 dB), and the phase shift is significant.";
    }

    rlcResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">RC Low-Pass Numerical Results</div>
        <div class="result-content">
          <strong>R:</strong> ${fmt(Rk, 3)} kΩ<br>
          <strong>C:</strong> ${fmt(Cn, 3)} nF<br>
          <strong>Time constant τ:</strong> ${fmt(tau * 1e3, 3)} ms<br>
          <strong>Cutoff frequency f<sub>c</sub>:</strong> ${fmt(fc, 2)} Hz<br>
          <strong>Test frequency f:</strong> ${fmt(f, 2)} Hz<br>
          <strong>Gain |H(jω)|:</strong> ${fmt(mag, 3)}<br>
          <strong>Output amplitude V<sub>out</sub>:</strong> ${fmt(
            Vout,
            3
          )} V (peak)
        </div>
      </div>
      <div class="result-block">
        <div class="result-heading">AI-Style Interpretation</div>
        <div class="result-content">
          ${comment}
        </div>
      </div>
    `;
  } else if (type === "rl") {
    const Vs = parseFloat(document.getElementById("rl-vs").value);
    const R = parseFloat(document.getElementById("rl-r").value);
    const Lm = parseFloat(document.getElementById("rl-l").value);
    const t_ms = parseFloat(document.getElementById("rl-t").value);

    if ([Vs, R, Lm, t_ms].some((v) => isNaN(v) || v <= 0)) {
      rlcResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">Please enter positive values for Vs, R, L and t.</div>
        </div>`;
      return;
    }

    const L = Lm * 1e-3;
    const t = t_ms * 1e-3;

    const tau = L / R;
    const I_final = Vs / R;
    const I_t = I_final * (1 - Math.exp(-t / tau));
    const V_L_t = Vs * Math.exp(-t / tau);

    let comment = "";
    if (t < 0.2 * tau) {
      comment =
        "The observation instant is very early compared to τ, so the inductor is strongly opposing the change in current. The current is still small and the inductor voltage is close to the supply.";
    } else if (t > 3 * tau) {
      comment =
        "The instant is many time constants after the step, so the current is almost at its steady-state value and the inductor voltage has nearly decayed to zero.";
    } else {
      comment =
        "The instant falls within the transient region. The current is rising and the inductor is partially opposing the change, so both resistor and inductor share the applied voltage.";
    }

    rlcResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">RL Step Response</div>
        <div class="result-content">
          <strong>R:</strong> ${fmt(R, 2)} Ω<br>
          <strong>L:</strong> ${fmt(Lm, 3)} mH<br>
          <strong>Time constant τ:</strong> ${fmt(tau * 1e3, 3)} ms<br>
          <strong>Final current I(∞):</strong> ${fmt(I_final, 3)} A<br>
          <strong>Observation time t:</strong> ${fmt(t_ms, 3)} ms<br>
          <strong>Current I(t):</strong> ${fmt(I_t, 3)} A<br>
          <strong>Inductor voltage V<sub>L</sub>(t):</strong> ${fmt(V_L_t, 3)} V
        </div>
      </div>
      <div class="result-block">
        <div class="result-heading">AI-Style Interpretation</div>
        <div class="result-content">
          ${comment}
        </div>
      </div>
    `;
  } else if (type === "lc") {
    const Lm = parseFloat(document.getElementById("lc-l").value);
    const Cn = parseFloat(document.getElementById("lc-c").value);

    if ([Lm, Cn].some((v) => isNaN(v) || v <= 0)) {
      rlcResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">Please enter positive values for L and C.</div>
        </div>`;
      return;
    }

    const L = Lm * 1e-3;
    const C = Cn * 1e-9;

    const w0 = 1 / Math.sqrt(L * C);
    const f0 = w0 / (2 * Math.PI);

    rlcResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">LC Resonant Circuit</div>
        <div class="result-content">
          <strong>L:</strong> ${fmt(Lm, 3)} mH<br>
          <strong>C:</strong> ${fmt(Cn, 3)} nF<br>
          <strong>Resonant angular frequency ω<sub>0</sub>:</strong> ${fmt(
            w0,
            2
          )} rad/s<br>
          <strong>Resonant frequency f<sub>0</sub>:</strong> ${fmt(f0, 2)} Hz
        </div>
      </div>
      <div class="result-block">
        <div class="result-heading">AI-Style Interpretation</div>
        <div class="result-content">
          At resonance, the reactive effects of L and C cancel each other, so the circuit behaves as if it were purely resistive (limited only by series resistance). Energy oscillates back and forth between the inductor&apos;s magnetic field and the capacitor&apos;s electric field.
        </div>
      </div>
    `;
  }
}

document.getElementById("btn-rlc-solve").addEventListener("click", solveRLC);

// ====== OPAMP SECTION ======
const opampModeSelect = document.getElementById("opampMode");
const opampResults = document.getElementById("opampResults");

function solveOpamp() {
  const mode = opampModeSelect.value;
  const Vin = parseFloat(document.getElementById("opampVin").value);
  const R1k = parseFloat(document.getElementById("opampR1").value);
  const R2k = parseFloat(document.getElementById("opampR2").value);

  if ([Vin, R1k, R2k].some((v) => isNaN(v) || v <= 0)) {
    opampResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">Input Error</div>
        <div class="result-content">
          Please enter positive values for input voltage and both resistances.
        </div>
      </div>`;
    return;
  }

  const R1 = R1k * 1e3;
  const R2 = R2k * 1e3;

  let gain, Vout, explanation;
  if (mode === "inverting") {
    gain = -R2 / R1;
    Vout = gain * Vin;
    explanation = `
      In an inverting amplifier, the closed-loop gain is given by:<br>
      <strong>A<sub>v</sub> = - R<sub>2</sub> / R<sub>1</sub></strong>.<br>
      Here, R<sub>1</sub> = ${fmt(R1k, 3)} kΩ and R<sub>2</sub> = ${fmt(
      R2k,
      3
    )} kΩ, so A<sub>v</sub> = ${fmt(gain, 2)}.<br>
      The negative sign indicates a 180° phase inversion between input and output.
    `;
  } else {
    gain = 1 + R2 / R1;
    Vout = gain * Vin;
    explanation = `
      In a non-inverting amplifier, the closed-loop gain is given by:<br>
      <strong>A<sub>v</sub> = 1 + (R<sub>2</sub> / R<sub>1</sub>)</strong>.<br>
      Here, R<sub>1</sub> = ${fmt(R1k, 3)} kΩ and R<sub>2</sub> = ${fmt(
      R2k,
      3
    )} kΩ, so A<sub>v</sub> = ${fmt(gain, 2)}.<br>
      The output is in phase with the input (no inversion).
    `;
  }

  opampResults.innerHTML = `
    <div class="result-block">
      <div class="result-heading">Op-Amp Numerical Results</div>
      <div class="result-content">
        <strong>Mode:</strong> ${
          mode === "inverting" ? "Inverting" : "Non-Inverting"
        }<br>
        <strong>Input voltage V<sub>in</sub>:</strong> ${fmt(Vin, 3)} V<br>
        <strong>Gain A<sub>v</sub>:</strong> ${fmt(gain, 2)}<br>
        <strong>Output voltage V<sub>out</sub> (ideal):</strong> ${fmt(
          Vout,
          3
        )} V
      </div>
    </div>
    <div class="result-block">
      <div class="result-heading">Explanation</div>
      <div class="result-content">
        ${explanation}
      </div>
    </div>
  `;
}

document
  .getElementById("btn-opamp-solve")
  .addEventListener("click", solveOpamp);

// ====== FILTERS SECTION ======
const filterTypeSelect = document.getElementById("filterType");
const filterHint = document.getElementById("filterHint");
const filterInputs = document.getElementById("filterInputs");
const filterResults = document.getElementById("filterResults");
const filterChartCtx = document.getElementById("filterChart").getContext("2d");

let filterChart = null;

function updateFilterInputs() {
  const type = filterTypeSelect.value;
  if (type === "lpf") {
    filterHint.textContent =
      "RC low-pass filter. It passes low frequencies and attenuates high frequencies.";
    filterInputs.innerHTML = `
      <div class="field-row">
        <div class="field">
          <label for="flp-r">R (kΩ)</label>
          <input type="number" id="flp-r" value="10" step="0.1" />
        </div>
        <div class="field">
          <label for="flp-c">C (nF)</label>
          <input type="number" id="flp-c" value="1" step="0.1" />
        </div>
      </div>
    `;
  } else if (type === "hpf") {
    filterHint.textContent =
      "RC high-pass filter. It passes high frequencies and blocks low frequencies.";
    filterInputs.innerHTML = `
      <div class="field-row">
        <div class="field">
          <label for="fhp-r">R (kΩ)</label>
          <input type="number" id="fhp-r" value="10" step="0.1" />
        </div>
        <div class="field">
          <label for="fhp-c">C (nF)</label>
          <input type="number" id="fhp-c" value="1" step="0.1" />
        </div>
      </div>
    `;
  } else if (type === "bpf") {
    filterHint.textContent =
      "Series RLC band-pass filter. It passes a band around the resonant frequency and attenuates frequencies away from it.";
    filterInputs.innerHTML = `
      <div class="field-row">
        <div class="field">
          <label for="fbp-r">R (Ω)</label>
          <input type="number" id="fbp-r" value="100" step="1" />
        </div>
        <div class="field">
          <label for="fbp-l">L (mH)</label>
          <input type="number" id="fbp-l" value="10" step="0.1" />
        </div>
      </div>
      <div class="field">
        <label for="fbp-c">C (nF)</label>
        <input type="number" id="fbp-c" value="1" step="0.1" />
      </div>
    `;
  }
}

filterTypeSelect.addEventListener("change", updateFilterInputs);
updateFilterInputs();

function drawFilterChart(freqs, mags, label) {
  if (filterChart) {
    filterChart.destroy();
  }
  filterChart = new Chart(filterChartCtx, {
    type: "line",
    data: {
      datasets: [
        {
          label,
          data: freqs.map((f, i) => ({ x: f, y: mags[i] })),
          borderWidth: 2,
          tension: 0.18,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Frequency (Hz)",
          },
          ticks: {
            maxTicksLimit: 7,
          },
        },
        y: {
          type: "linear",
          title: {
            display: true,
            text: "|H(jω)|",
          },
          min: 0,
        },
      },
      plugins: {
        legend: {
          labels: {
            font: { size: 10 },
          },
        },
      },
    },
  });
}

function analyzeFilter() {
  const type = filterTypeSelect.value;

  if (type === "lpf") {
    const Rk = parseFloat(document.getElementById("flp-r").value);
    const Cn = parseFloat(document.getElementById("flp-c").value);
    if ([Rk, Cn].some((v) => isNaN(v) || v <= 0)) {
      filterResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">
            Please enter positive values for R and C.
          </div>
        </div>`;
      return;
    }

    const R = Rk * 1e3;
    const C = Cn * 1e-9;
    const tau = R * C;
    const fc = 1 / (2 * Math.PI * tau);

    const fmin = fc / 20;
    const fmax = fc * 20;
    const freqs = [];
    const mags = [];
    for (let i = 0; i <= 80; i++) {
      const frac = i / 80;
      const f = fmin * Math.pow(fmax / fmin, frac);
      const w = 2 * Math.PI * f;
      const m = 1 / Math.sqrt(1 + (w * tau) ** 2);
      freqs.push(Number(f.toFixed(0)));
      mags.push(m);
    }

    drawFilterChart(freqs, mags, "Low-Pass |H(jω)|");

    filterResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">Low-Pass Filter</div>
        <div class="result-content">
          <strong>R:</strong> ${fmt(Rk, 3)} kΩ<br>
          <strong>C:</strong> ${fmt(Cn, 3)} nF<br>
          <strong>Time constant τ:</strong> ${fmt(tau * 1e3, 3)} ms<br>
          <strong>Cutoff frequency f<sub>c</sub>:</strong> ${fmt(
            fc,
            2
          )} Hz<br><br>
          At frequencies well below f<sub>c</sub>, the output is almost equal to the input.
          At frequencies well above f<sub>c</sub>, the output amplitude tends to zero.
        </div>
      </div>
    `;
  } else if (type === "hpf") {
    const Rk = parseFloat(document.getElementById("fhp-r").value);
    const Cn = parseFloat(document.getElementById("fhp-c").value);
    if ([Rk, Cn].some((v) => isNaN(v) || v <= 0)) {
      filterResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">
            Please enter positive values for R and C.
          </div>
        </div>`;
      return;
    }

    const R = Rk * 1e3;
    const C = Cn * 1e-9;
    const tau = R * C;
    const fc = 1 / (2 * Math.PI * tau);

    const fmin = fc / 20;
    const fmax = fc * 20;
    const freqs = [];
    const mags = [];
    for (let i = 0; i <= 80; i++) {
      const frac = i / 80;
      const f = fmin * Math.pow(fmax / fmin, frac);
      const w = 2 * Math.PI * f;
      const m = (w * tau) / Math.sqrt(1 + (w * tau) ** 2);
      freqs.push(Number(f.toFixed(0)));
      mags.push(m);
    }

    drawFilterChart(freqs, mags, "High-Pass |H(jω)|");

    filterResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">High-Pass Filter</div>
        <div class="result-content">
          <strong>R:</strong> ${fmt(Rk, 3)} kΩ<br>
          <strong>C:</strong> ${fmt(Cn, 3)} nF<br>
          <strong>Cutoff frequency f<sub>c</sub>:</strong> ${fmt(
            fc,
            2
          )} Hz<br><br>
          At frequencies well below f<sub>c</sub>, the capacitor blocks the signal and the output is nearly zero.
          At frequencies well above f<sub>c</sub>, the output approaches the input amplitude.
        </div>
      </div>
    `;
  } else if (type === "bpf") {
    const R = parseFloat(document.getElementById("fbp-r").value);
    const Lm = parseFloat(document.getElementById("fbp-l").value);
    const Cn = parseFloat(document.getElementById("fbp-c").value);

    if ([R, Lm, Cn].some((v) => isNaN(v) || v <= 0)) {
      filterResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">
            Please enter positive values for R, L and C.
          </div>
        </div>`;
      return;
    }

    const L = Lm * 1e-3;
    const C = Cn * 1e-9;

    const w0 = 1 / Math.sqrt(L * C);
    const f0 = w0 / (2 * Math.PI);
    const BW = R / (2 * Math.PI * L);
    const Q = (1 / R) * Math.sqrt(L / C);

    const fmin = f0 / 20;
    const fmax = f0 * 20;
    const freqs = [];
    const mags = [];

    for (let i = 0; i <= 80; i++) {
      const frac = i / 80;
      const f = fmin * Math.pow(fmax / fmin, frac);
      const w = 2 * Math.PI * f;
      const num = (w * L) / R;
      const den = Math.sqrt((1 - w * w * L * C) ** 2 + ((w * L) / R) ** 2);
      const m = num / den;
      freqs.push(Number(f.toFixed(0)));
      mags.push(m);
    }

    drawFilterChart(freqs, mags, "Band-Pass |H(jω)|");

    filterResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">Band-Pass Filter</div>
        <div class="result-content">
          <strong>R:</strong> ${fmt(R, 2)} Ω<br>
          <strong>L:</strong> ${fmt(Lm, 3)} mH<br>
          <strong>C:</strong> ${fmt(Cn, 3)} nF<br>
          <strong>Resonant frequency f<sub>0</sub>:</strong> ${fmt(
            f0,
            2
          )} Hz<br>
          <strong>Approximate bandwidth BW:</strong> ${fmt(BW, 2)} Hz<br>
          <strong>Approximate Q-factor:</strong> ${fmt(Q, 2)}<br><br>
          Around f<sub>0</sub>, the filter passes signals with relatively high gain.
          Far away from f<sub>0</sub>, the gain drops and the signal is attenuated.
        </div>
      </div>
    `;
  }
}

document
  .getElementById("btn-filter-solve")
  .addEventListener("click", analyzeFilter);

// ====== FILTER FREQUENCY CALCULATOR ======
function calculateFilterFrequencies() {
  const type = filterTypeSelect.value;

  if (type === "lpf") {
    const Rk = parseFloat(document.getElementById("flp-r").value);
    const Cn = parseFloat(document.getElementById("flp-c").value);

    if ([Rk, Cn].some((v) => isNaN(v) || v <= 0)) {
      filterResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">Enter valid R and C.</div>
        </div>`;
      return;
    }

    const R = Rk * 1e3;
    const C = Cn * 1e-9;

    const tau = R * C;
    const fc = 1 / (2 * Math.PI * R * C);

    filterResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">Low-Pass Frequency Calculator</div>
        <div class="result-content">
          <strong>Time Constant (τ):</strong> ${fmt(tau * 1000, 3)} ms <br>
          <strong>Cutoff Frequency (f<sub>c</sub>):</strong> ${fmt(fc, 3)} Hz
        </div>
      </div>
    `;
  } else if (type === "hpf") {
    const Rk = parseFloat(document.getElementById("fhp-r").value);
    const Cn = parseFloat(document.getElementById("fhp-c").value);

    if ([Rk, Cn].some((v) => isNaN(v) || v <= 0)) {
      filterResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">Enter valid R and C.</div>
        </div>`;
      return;
    }

    const R = Rk * 1e3;
    const C = Cn * 1e-9;

    const tau = R * C;
    const fc = 1 / (2 * Math.PI * R * C);

    filterResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">High-Pass Frequency Calculator</div>
        <div class="result-content">
          <strong>Time Constant (τ):</strong> ${fmt(tau * 1000, 3)} ms <br>
          <strong>Cutoff Frequency (f<sub>c</sub>):</strong> ${fmt(fc, 3)} Hz
        </div>
      </div>
    `;
  } else if (type === "bpf") {
    const R = parseFloat(document.getElementById("fbp-r").value);
    const Lm = parseFloat(document.getElementById("fbp-l").value);
    const Cn = parseFloat(document.getElementById("fbp-c").value);

    if ([R, Lm, Cn].some((v) => isNaN(v) || v <= 0)) {
      filterResults.innerHTML = `
        <div class="result-block">
          <div class="result-heading">Input Error</div>
          <div class="result-content">Enter valid R, L, C.</div>
        </div>`;
      return;
    }

    const L = Lm * 1e-3;
    const C = Cn * 1e-9;

    const w0 = 1 / Math.sqrt(L * C);
    const f0 = w0 / (2 * Math.PI);

    const BW = R / (2 * Math.PI * L);
    const Q = (1 / R) * Math.sqrt(L / C);

    const f1 = f0 - BW / 2;
    const f2 = f0 + BW / 2;

    filterResults.innerHTML = `
      <div class="result-block">
        <div class="result-heading">Band-Pass Filter Frequency Calculator</div>
        <div class="result-content">
          <strong>Resonant Frequency (f<sub>0</sub>):</strong> ${fmt(
            f0,
            3
          )} Hz <br>
          <strong>Bandwidth (BW):</strong> ${fmt(BW, 3)} Hz <br>
          <strong>Quality Factor (Q):</strong> ${fmt(Q, 3)} <br>
          <strong>Lower Cutoff (f<sub>1</sub>):</strong> ${fmt(f1, 3)} Hz <br>
          <strong>Upper Cutoff (f<sub>2</sub>):</strong> ${fmt(f2, 3)} Hz
        </div>
      </div>
    `;
  }
}

document
  .getElementById("btn-filter-frequency")
  .addEventListener("click", calculateFilterFrequencies);

// ====== DOWNLOAD GRAPH AS PNG ======
function downloadGraph() {
  if (!filterChart) {
    alert("Please analyze a filter first to generate a graph.");
    return;
  }

  const link = document.createElement("a");
  link.href = filterChart.toBase64Image("image/png", 1);
  link.download = "filter-response.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document
  .getElementById("btn-download-graph")
  .addEventListener("click", downloadGraph);
document
  .getElementById("btn-download-graph-bottom")
  .addEventListener("click", downloadGraph);

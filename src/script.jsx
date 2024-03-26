import { createRoot } from "react-dom/client";
import { StrictMode, useEffect, useReducer, useState } from "react";
import ini from "ini";

let nextClipboardId = 0;

function Dropzone({ step, handler }) {
  const [active, setActive] = useState(false);

  const handleDragEnter = (event) => {
    setActive(true);
  };

  const handleDragLeave = (event) => {
    setActive(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setActive(false);

    for (const file of event.dataTransfer.files) {
      handler(file);
    }
  };

  const handlePaste = (event) => {
    if (event.clipboardData.files.length > 0) {
      for (const file of event.clipboardData.files) {
        handler(file);
      }
    } else {
      const src = event.clipboardData.getData("text/plain");
      const file = new File([src], `clipboard-${nextClipboardId++}.ini`);
      handler(file);
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <div
      className={`dropzone ${active ? "active" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {step === 0 ? (
        <p>Drop or paste *.ini files to compare.</p>
      ) : (
        <p>
          Drop or paste <strong>another</strong> *.ini file to compare.
        </p>
      )}
    </div>
  );
}

function Diff({ diff }) {
  return (
    <ol className="diff">
      {Array.from(diff.entries()).map(([key, match]) => (
        <li key={key} className={`diff-row match-${match.result}`}>
          <span className="diff-col key">{key}</span>
          <span className="diff-col value value-a">{String(match.a)}</span>
          <span className="diff-col value value-b">{String(match.b)}</span>
        </li>
      ))}
    </ol>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>
        Source available on{" "}
        <a href="https://github.com/haggen/cfgcmp">GitHub</a>.
      </p>
    </footer>
  );
}

function getFlatConfig(config, prefix = "") {
  const result = {};

  for (const [key, value] of Object.entries(config)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      Object.assign(result, getFlatConfig(value, path));
    } else {
      result[path] = value;
    }
  }

  return result;
}

function compareValues(a, b) {
  if (a !== undefined && b === undefined) {
    return "a";
  }
  if (a === undefined && b !== undefined) {
    return "b";
  }
  return a === b ? "equal" : "different";
}

function getDiff(configs) {
  const keys = new Set([
    ...configs
      .map((config) => Object.keys(config.config))
      .flat()
      .sort(),
  ]);

  const diff = new Map();
  diff.totals = { differences: 0, a: 0, b: 0 };

  for (const key of keys) {
    const result = compareValues(
      configs[0].config[key],
      configs[1].config[key]
    );

    if (result !== "equal") {
      diff.totals.differences++;

      if (result === "a") {
        diff.totals.a++;
      } else if (result === "b") {
        diff.totals.b++;
      }
    }

    diff.set(key, {
      a: configs[0].config[key],
      b: configs[1].config[key],
      result,
    });
  }

  return diff;
}

function reducer(state, action) {
  switch (action.type) {
    case "configs/added":
      if (state.configs.length >= 2) {
        return state;
      }
      return { ...state, configs: [...state.configs, action.payload] };
    case "configs/reset":
      return { ...state, configs: [] };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, {
    configs: [],
  });

  const handleFile = (file) => {
    file.text().then((text) => {
      dispatch({
        type: "configs/added",
        payload: {
          file: file.name,
          config: getFlatConfig(ini.decode(text)),
        },
      });
    });
  };

  const restart = () => {
    dispatch({ type: "configs/reset" });
  };

  if (state.configs.length < 2) {
    return (
      <div className="layout">
        <Dropzone step={state.configs.length} handler={handleFile} />
        <Footer />
      </div>
    );
  }

  const diff = getDiff(state.configs);

  return (
    <div className="layout">
      <header className="toolbar">
        <div />

        <div
          className="flex"
          style={{ justifyContent: "space-between", paddingInline: "0.75rem" }}
        >
          <ul className="flex" style={{ gap: "0.75rem" }}>
            <li>
              Total: <strong>{diff.size}</strong>
            </li>
            <li>
              Difference: <strong>{diff.totals.differences}</strong>
            </li>
          </ul>

          <menu>
            <li>
              <button className="button" onClick={() => restart()}>
                Restart
              </button>
            </li>
          </menu>
        </div>

        <div
          className="flex"
          style={{ justifyContent: "space-between", paddingInline: "0.75rem" }}
        >
          <span>{state.configs[0].file}</span>
          <span style={{ color: "green" }}>+{diff.totals.a}</span>
        </div>
        <div
          className="flex"
          style={{ justifyContent: "space-between", paddingInline: "0.75rem" }}
        >
          <span>{state.configs[1].file}</span>
          <span style={{ color: "green" }}>+{diff.totals.b}</span>
        </div>
      </header>

      <Diff diff={diff} />

      <Footer />
    </div>
  );
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

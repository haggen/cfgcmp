import { createRoot } from "react-dom/client";
import { StrictMode, useEffect, useState } from "react";
import ini from "ini";

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
      const file = new File([src], "clipboard");
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
          <span className="diff-col value-a">{match.a}</span>
          <span className="diff-col value-b">{match.b}</span>
        </li>
      ))}
    </ol>
  );
}

function getFlattenedObject(source, prefix = "") {
  const result = {};

  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      Object.assign(result, getFlattenedObject(value, path));
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

function getDiffMap(contents) {
  const keys = new Set([
    ...contents
      .map((object) => Object.keys(object))
      .flat()
      .sort(),
  ]);

  const diff = new Map();

  for (const key of keys) {
    diff.set(key, {
      a: contents[0][key],
      b: contents[1][key],
      result: compareValues(contents[0][key], contents[1][key]),
    });
  }

  return diff;
}

function App() {
  const [contents, setContents] = useState([]);

  const handleFile = (file) => {
    file.text().then((text) => {
      setContents((contents) => {
        contents[contents.length % 2] = getFlattenedObject(ini.decode(text));
        return [...contents];
      });
    });
  };

  const restart = () => {
    setContents([]);
  };

  if (contents.length < 2) {
    return <Dropzone step={contents.length} handler={handleFile} />;
  }

  return (
    <div>
      <menu className="toolbar">
        <li>
          <button onClick={() => restart()}>Restart</button>
        </li>
      </menu>
      <Diff diff={getDiffMap(contents)} />
    </div>
  );
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

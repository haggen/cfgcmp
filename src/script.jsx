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
        <p>Drop or paste configuration files to compare.</p>
      ) : (
        <p>
          Drop or paste <strong>another</strong> configuration file to compare.
        </p>
      )}
    </div>
  );
}

function App() {
  const [contents, setContents] = useState([]);

  const handleFile = (file) => {
    file.text().then((text) => {
      setContents((contents) => {
        contents[contents.length % 2] = ini.decode(text);
        return [...contents];
      });
    });
  };

  const reset = () => {
    setContents([]);
  };

  if (contents.length < 2) {
    return <Dropzone step={contents.length} handler={handleFile} />;
  }

  return (
    <div>
      <menu className="toolbar">
        <li>
          <button onClick={() => reset()}>Reset</button>
        </li>
      </menu>
      <div className="diff">
        <pre>{JSON.stringify(contents[0], void 0, 2)}</pre>
        <pre>{JSON.stringify(contents[1], void 0, 2)}</pre>
      </div>
    </div>
  );
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

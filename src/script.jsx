import { createRoot } from "react-dom/client";
import { StrictMode, useEffect, useReducer, useState } from "react";

function Dropzone({ handler }) {
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
      <p>Drop or paste configuration files to compare.</p>
    </div>
  );
}

function App() {
  const handleFile = (file) => {
    console.log({ file });
  };

  return <Dropzone handler={handleFile} />;
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

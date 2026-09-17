import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [systemInfoError, setSystemInfoError] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotError, setScreenshotError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  async function loadItems() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      setItems(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function addItem(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      setName('');
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadSystemInfo() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/system-info`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      setSystemInfo(await res.json());
      setSystemInfoError(null);
    } catch (err) {
      setSystemInfoError(err.message);
    }
  }

  async function loadScreenshot() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/screenshot?url=https://example.com`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setScreenshot(data.screenshot);
      setScreenshotError(null);
    } catch (err) {
      setScreenshotError(err.message);
    }
  }

  async function convertPhotoToPdf(e) {
    e.preventDefault();
    if (!photoFile) return;
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      const res = await fetch(`${API_BASE_URL}/api/photo-to-pdf`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'photo.pdf';
      link.click();
      URL.revokeObjectURL(url);
      setPdfError(null);
    } catch (err) {
      setPdfError(err.message);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 480, margin: '40px auto' }}>
      <h1>Fullstack Test App</h1>
      <p>API base URL: {API_BASE_URL}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={addItem}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      <hr />
      <button onClick={loadSystemInfo}>Show system info</button>
      {systemInfoError && <p style={{ color: 'red' }}>Error: {systemInfoError}</p>}
      {systemInfo && <pre>{JSON.stringify(systemInfo, null, 2)}</pre>}
      <hr />
      <button onClick={loadScreenshot}>Take screenshot</button>
      {screenshotError && <p style={{ color: 'red' }}>Error: {screenshotError}</p>}
      {screenshot && <img src={screenshot} alt="screenshot" style={{ maxWidth: '100%' }} />}
      <hr />
      <form onSubmit={convertPhotoToPdf}>
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
        <button type="submit">Convert photo to PDF</button>
      </form>
      {pdfError && <p style={{ color: 'red' }}>Error: {pdfError}</p>}
    </div>
  );
}

export default App;

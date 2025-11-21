interface Settings {
  host?: string;
  port?: number;
  pollingEnabled?: boolean;
  pollingInterval?: number;
}

// Load current settings
async function loadSettings(): Promise<void> {
  const settings = await chrome.storage.sync.get([
    "host",
    "port",
    "pollingEnabled",
    "pollingInterval",
  ]) as Settings;

  (document.getElementById("host") as HTMLInputElement).value = settings.host || "127.0.0.1";
  (document.getElementById("port") as HTMLInputElement).value = String(settings.port || 9333);
  (document.getElementById("pollingInterval") as HTMLInputElement).value =
    String(settings.pollingInterval || 2000);
  (document.getElementById("pollingEnabled") as HTMLInputElement).checked =
    settings.pollingEnabled !== false;
}

// Save settings
async function saveSettings(): Promise<void> {
  const settings: Settings = {
    host: (document.getElementById("host") as HTMLInputElement).value.trim() || "127.0.0.1",
    port: parseInt((document.getElementById("port") as HTMLInputElement).value) || 9333,
    pollingInterval:
      parseInt((document.getElementById("pollingInterval") as HTMLInputElement).value) || 2000,
    pollingEnabled: (document.getElementById("pollingEnabled") as HTMLInputElement).checked,
  };

  await chrome.storage.sync.set(settings);

  // Show success message
  const status = document.getElementById("status") as HTMLElement;
  status.classList.add("success");
  setTimeout(() => {
    status.classList.remove("success");
  }, 2000);
}

// Event listeners
document.getElementById("save")!.addEventListener("click", saveSettings);

// Load settings on popup open
loadSettings();

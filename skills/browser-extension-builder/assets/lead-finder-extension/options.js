const exploriumInput = document.getElementById("explorium-key");
const hubspotInput = document.getElementById("hubspot-token");
const saveBtn = document.getElementById("save-btn");
const status = document.getElementById("save-status");

chrome.storage.local.get(["exploriumApiKey", "hubspotToken"], (result) => {
  if (result.exploriumApiKey) exploriumInput.value = result.exploriumApiKey;
  if (result.hubspotToken) hubspotInput.value = result.hubspotToken;
});

saveBtn.addEventListener("click", () => {
  chrome.storage.local.set(
    {
      exploriumApiKey: exploriumInput.value.trim(),
      hubspotToken: hubspotInput.value.trim(),
    },
    () => {
      status.textContent = "Saved.";
      setTimeout(() => (status.textContent = ""), 2000);
    }
  );
});

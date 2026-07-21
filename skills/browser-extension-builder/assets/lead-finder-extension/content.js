(() => {
  const ICON_URL = chrome.runtime.getURL("icons/icon32.png");
  const HUBSPOT_ICON = `<svg class="leadfinder-btn-icon" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="9.3" y1="9.3" x2="19" y2="19" stroke="#FF7A59" stroke-width="2.6" stroke-linecap="round"/>
    <line x1="29" y1="10.3" x2="29" y2="18" stroke="#FF7A59" stroke-width="2.6" stroke-linecap="round"/>
    <line x1="9.3" y1="26.7" x2="18" y2="21.5" stroke="#FF7A59" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="6.7" fill="none" stroke="#FF7A59" stroke-width="4.4"/>
    <circle cx="7" cy="7" r="3.4" fill="#FF7A59"/>
    <circle cx="29" cy="7" r="3.4" fill="#FF7A59"/>
    <circle cx="7" cy="29" r="3.4" fill="#FF7A59"/>
  </svg>`;

  let currentUrl = "";

  function getProfileName() {
    const h1 = document.querySelector("main h1, h1");
    return h1 ? h1.textContent.trim() : "";
  }

  function getHeadline() {
    const el = document.querySelector(
      "main .text-body-medium.break-words, main .text-body-medium"
    );
    return el ? el.textContent.trim() : "";
  }

  function getProfilePhoto() {
    const candidates = document.querySelectorAll("main img");
    for (const img of candidates) {
      const rect = img.getBoundingClientRect();
      if (rect.width >= 40 && rect.width <= 250 && rect.height >= 40) {
        return img.src;
      }
    }
    return "";
  }

  function waitForProfileHeader(callback, attemptsLeft = 15) {
    const name = getProfileName();
    if (name || attemptsLeft <= 0) {
      callback();
      return;
    }
    setTimeout(() => waitForProfileHeader(callback, attemptsLeft - 1), 400);
  }

  function splitName(fullName) {
    const parts = (fullName || "").trim().split(/\s+/);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function removePanel() {
    const existing = document.getElementById("leadfinder-panel");
    if (existing) existing.remove();
  }

  function showToast(message, type) {
    const existing = document.querySelector(".leadfinder-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = `leadfinder-toast leadfinder-toast-${type || "default"}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function renderPanel() {
    removePanel();

    const name = getProfileName();
    const headline = getHeadline();
    const photo = getProfilePhoto();

    const panel = document.createElement("div");
    panel.id = "leadfinder-panel";
    panel.innerHTML = `
      <div class="leadfinder-header">
        <img src="${ICON_URL}" alt="Lead Finder" />
        <div class="leadfinder-title">Lead Finder</div>
        <button class="leadfinder-close" title="Close">&times;</button>
      </div>
      <div class="leadfinder-body">
        <div class="leadfinder-profile-row">
          <img class="leadfinder-avatar" src="${photo || ICON_URL}" alt="" />
          <div>
            <p class="leadfinder-name">${escapeHtml(name) || "This profile"}</p>
            <p class="leadfinder-subtitle">${escapeHtml(headline)}</p>
          </div>
        </div>
        <div id="leadfinder-content-area"></div>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector(".leadfinder-close").addEventListener("click", removePanel);

    renderRevealState();
  }

  function renderRevealState() {
    const area = document.getElementById("leadfinder-content-area");
    if (!area) return;
    area.innerHTML = `
      <button id="leadfinder-reveal-btn" class="leadfinder-btn leadfinder-btn-primary">
        Reveal contact info
      </button>
    `;
    document
      .getElementById("leadfinder-reveal-btn")
      .addEventListener("click", handleReveal);
  }

  function renderLoadingState() {
    const area = document.getElementById("leadfinder-content-area");
    if (!area) return;
    area.innerHTML = `
      <button class="leadfinder-btn leadfinder-btn-primary" disabled>
        <span class="leadfinder-spinner"></span> Revealing...
      </button>
    `;
  }

  function renderErrorState(message) {
    const area = document.getElementById("leadfinder-content-area");
    if (!area) return;
    area.innerHTML = `
      <div class="leadfinder-error">${escapeHtml(message)}</div>
      <button id="leadfinder-retry-btn" class="leadfinder-btn leadfinder-btn-primary">Try again</button>
    `;
    document
      .getElementById("leadfinder-retry-btn")
      .addEventListener("click", handleReveal);
  }

  function renderResultState(contact) {
    const area = document.getElementById("leadfinder-content-area");
    if (!area) return;

    const fields = [];
    if (contact.email) {
      fields.push(
        `<div class="leadfinder-field"><span class="leadfinder-field-icon">&#9993;</span><span class="leadfinder-field-value">${escapeHtml(
          contact.email
        )}</span></div>`
      );
    }
    if (contact.phone) {
      fields.push(
        `<div class="leadfinder-field"><span class="leadfinder-field-icon">&#9742;</span><span class="leadfinder-field-value">${escapeHtml(
          contact.phone
        )}</span></div>`
      );
    }
    if (contact.jobTitle || contact.company) {
      const line = [contact.jobTitle, contact.company].filter(Boolean).join(" @ ");
      fields.push(
        `<div class="leadfinder-field"><span class="leadfinder-field-icon">&#128188;</span><span class="leadfinder-field-value">${escapeHtml(
          line
        )}</span></div>`
      );
    }
    if (contact.companyWebsite) {
      fields.push(
        `<div class="leadfinder-field"><span class="leadfinder-field-icon">&#127760;</span><span class="leadfinder-field-value">${escapeHtml(
          contact.companyWebsite
        )}</span></div>`
      );
    }
    if (contact.location) {
      fields.push(
        `<div class="leadfinder-field"><span class="leadfinder-field-icon">&#128205;</span><span class="leadfinder-field-value">${escapeHtml(
          contact.location
        )}</span></div>`
      );
    }

    const hasAny = contact.email || contact.phone;

    area.innerHTML = `
      ${
        hasAny
          ? `<div class="leadfinder-badge">&#10003; Verified by Explorium</div>`
          : `<div class="leadfinder-empty">No verified contact info found for this profile.</div>`
      }
      <div class="leadfinder-fields">${fields.join("")}</div>
      ${
        hasAny
          ? `
        <button id="leadfinder-email-btn" class="leadfinder-btn leadfinder-btn-primary">Draft email</button>
        <button id="leadfinder-hubspot-btn" class="leadfinder-btn leadfinder-btn-secondary">${HUBSPOT_ICON} Push to HubSpot</button>
      `
          : ""
      }
    `;

    if (hasAny) {
      document
        .getElementById("leadfinder-hubspot-btn")
        .addEventListener("click", () => renderMappingState(contact));
      document
        .getElementById("leadfinder-email-btn")
        .addEventListener("click", () => handleDraftEmail(contact));
    }
  }

  function renderMappingState(contact) {
    const area = document.getElementById("leadfinder-content-area");
    if (!area) return;

    const { firstName, lastName } = splitName(contact.fullName || getProfileName());

    const field = (id, label, value) => `
      <div class="leadfinder-mapping-field">
        <label for="${id}">${label}</label>
        <input id="${id}" type="text" value="${escapeHtml(value || "")}" />
      </div>
    `;

    area.innerHTML = `
      <p class="leadfinder-mapping-hint">Review the fields before pushing to HubSpot.</p>
      <div class="leadfinder-mapping-fields">
        ${field("leadfinder-map-firstname", "First name", firstName)}
        ${field("leadfinder-map-lastname", "Last name", lastName)}
        ${field("leadfinder-map-email", "Email", contact.email)}
        ${field("leadfinder-map-jobtitle", "Job title", contact.jobTitle)}
        ${field("leadfinder-map-company", "Company", contact.company)}
        ${field("leadfinder-map-phone", "Phone", contact.phone)}
      </div>
      <button id="leadfinder-confirm-push-btn" class="leadfinder-btn leadfinder-btn-primary">${HUBSPOT_ICON} Confirm &amp; push</button>
      <button id="leadfinder-cancel-push-btn" class="leadfinder-btn leadfinder-btn-secondary">Cancel</button>
    `;

    document
      .getElementById("leadfinder-confirm-push-btn")
      .addEventListener("click", () => {
        const fields = {
          firstName: document.getElementById("leadfinder-map-firstname").value.trim(),
          lastName: document.getElementById("leadfinder-map-lastname").value.trim(),
          email: document.getElementById("leadfinder-map-email").value.trim(),
          jobTitle: document.getElementById("leadfinder-map-jobtitle").value.trim(),
          company: document.getElementById("leadfinder-map-company").value.trim(),
          phone: document.getElementById("leadfinder-map-phone").value.trim(),
        };
        handlePushHubspot(fields, contact);
      });
    document
      .getElementById("leadfinder-cancel-push-btn")
      .addEventListener("click", () => renderResultState(contact));
  }

  function handleReveal() {
    renderLoadingState();
    const linkedinUrl = window.location.href.split("?")[0];
    const name = getProfileName();
    const headline = getHeadline();

    chrome.runtime.sendMessage(
      { type: "LEADFINDER_REVEAL", linkedinUrl, name, headline },
      (response) => {
        if (chrome.runtime.lastError) {
          renderErrorState(chrome.runtime.lastError.message);
          return;
        }
        if (!response || !response.ok) {
          renderErrorState(
            (response && response.error) || "Could not reach Explorium."
          );
          return;
        }
        renderResultState(response.contact);
      }
    );
  }

  function handlePushHubspot(fields, contact) {
    const btn = document.getElementById("leadfinder-confirm-push-btn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="leadfinder-spinner"></span> Pushing...`;
    }
    chrome.runtime.sendMessage(
      { type: "LEADFINDER_PUSH_HUBSPOT", fields },
      (response) => {
        if (chrome.runtime.lastError) {
          showToast(chrome.runtime.lastError.message, "error");
          renderResultState(contact);
          return;
        }
        if (!response || !response.ok) {
          showToast((response && response.error) || "HubSpot push failed.", "error");
          renderResultState(contact);
          return;
        }
        showToast("Contact synced to HubSpot", "success");
        renderResultState(contact);
      }
    );
  }

  function handleDraftEmail(contact) {
    const { firstName } = splitName(contact.fullName || getProfileName());
    const subject = `Quick question, ${firstName || "there"}`;
    const bodyLines = [
      `Hi ${firstName || "there"},`,
      "",
      contact.jobTitle && contact.company
        ? `Saw you're ${contact.jobTitle} at ${contact.company} — wanted to reach out.`
        : "Wanted to reach out.",
      "",
      "Best,",
    ];
    const body = bodyLines.join("\n");

    const url = new URL("https://mail.google.com/mail/");
    url.searchParams.set("view", "cm");
    url.searchParams.set("fs", "1");
    if (contact.email) url.searchParams.set("to", contact.email);
    url.searchParams.set("su", subject);
    url.searchParams.set("body", body);

    chrome.runtime.sendMessage({ type: "LEADFINDER_OPEN_TAB", url: url.toString() });
  }

  function maybeInject() {
    if (window.location.href === currentUrl) return;
    currentUrl = window.location.href;
    if (!/\/in\/[^/]+/.test(window.location.pathname)) {
      removePanel();
      return;
    }
    waitForProfileHeader(renderPanel);
  }

  const observer = new MutationObserver(() => maybeInject());
  observer.observe(document.body, { childList: true, subtree: true });
  maybeInject();
})();

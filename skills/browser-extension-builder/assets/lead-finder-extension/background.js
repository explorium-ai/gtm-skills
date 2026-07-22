const EXPLORIUM_BASE = "https://api.explorium.ai/v1";
const HUBSPOT_BASE = "https://api.hubapi.com";

function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

async function callExplorium(endpoint, payload, apiKey) {
  const res = await fetch(`${EXPLORIUM_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      api_key: apiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error(
        "Explorium rejected this API key (401). Double-check the key saved in Lead Finder's Options page — it's a separate key store from any other extension."
      );
    }
    throw new Error(`Explorium ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function revealContact({ linkedinUrl, name }) {
  const { exploriumApiKey } = await getStorage(["exploriumApiKey"]);
  if (!exploriumApiKey) {
    throw new Error("Set your Explorium API key in Lead Finder's Options page first.");
  }

  const matchRes = await callExplorium(
    "prospects/match",
    { prospects_to_match: [{ linkedin: linkedinUrl }] },
    exploriumApiKey
  );
  const prospectId = matchRes?.matched_prospects?.[0]?.prospect_id;
  if (!prospectId) {
    return { email: "", phone: "", jobTitle: "", company: "", companyWebsite: "", location: "" };
  }

  const [profileRes, contactRes] = await Promise.all([
    callExplorium(
      "prospects/profiles/bulk_enrich",
      { prospect_ids: [prospectId] },
      exploriumApiKey
    ),
    callExplorium(
      "prospects/contacts_information/bulk_enrich",
      { prospect_ids: [prospectId] },
      exploriumApiKey
    ),
  ]);

  const profile = profileRes?.data?.[0]?.data || {};
  const contactInfo = contactRes?.data?.[0]?.data || {};

  const email =
    contactInfo.professions_email ||
    (Array.isArray(contactInfo.emails) ? contactInfo.emails[0] : "") ||
    "";
  const phone =
    contactInfo.mobile_phone ||
    (Array.isArray(contactInfo.phone_numbers) ? contactInfo.phone_numbers[0] : "") ||
    "";
  const location = [profile.city, profile.country_name].filter(Boolean).join(", ");

  return {
    email,
    phone,
    jobTitle: profile.job_title || "",
    company: profile.company_name || "",
    companyWebsite: profile.company_website || "",
    location,
    fullName: name || profile.full_name || "",
  };
}

async function findHubspotContactByEmail(email, token) {
  const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
      ],
      limit: 1,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.results?.[0]?.id || null;
}

async function pushToHubspot(fields) {
  const { hubspotToken } = await getStorage(["hubspotToken"]);
  if (!hubspotToken) {
    throw new Error("Set your HubSpot private-app token in Lead Finder's Options page first.");
  }
  if (!fields.email) {
    throw new Error("This contact has no email to push to HubSpot.");
  }

  const properties = {
    email: fields.email,
    firstname: fields.firstName || "",
    lastname: fields.lastName || "",
    jobtitle: fields.jobTitle || "",
    company: fields.company || "",
    phone: fields.phone || "",
  };

  const existingId = await findHubspotContactByEmail(fields.email, hubspotToken);
  const url = existingId
    ? `${HUBSPOT_BASE}/crm/v3/objects/contacts/${existingId}`
    : `${HUBSPOT_BASE}/crm/v3/objects/contacts`;
  const method = existingId ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${hubspotToken}`,
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HubSpot ${method} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "LEADFINDER_REVEAL") {
    revealContact(message)
      .then((contact) => sendResponse({ ok: true, contact }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "LEADFINDER_PUSH_HUBSPOT") {
    pushToHubspot(message.fields)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "LEADFINDER_OPEN_TAB") {
    chrome.tabs.create({ url: message.url });
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

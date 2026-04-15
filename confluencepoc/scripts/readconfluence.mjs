import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read API key from file
const apiKeyPath = path.resolve(__dirname, '../keys/api.key');
const apiKey = (await fs.readFile(apiKeyPath, 'utf-8')).trim();

// Set your Confluence base URL here
const CONFLUENCE_BASE_URL = 'https://nhsd-confluence.digital.nhs.uk/rest/api/space';

// Prepare headers for authentication (Bearer token)
const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
};

// Persist cookies across paginated API requests.
const cookieJar = new Map();

function storeResponseCookies(response) {
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    for (const cookieString of setCookieHeaders) {
        const firstPart = cookieString.split(';')[0];
        const separatorIndex = firstPart.indexOf('=');
        if (separatorIndex > 0) {
            const name = firstPart.slice(0, separatorIndex).trim();
            const value = firstPart.slice(separatorIndex + 1).trim();
            cookieJar.set(name, value);
        }
    }
}

function buildCookieHeader() {
    if (cookieJar.size === 0) {
        return null;
    }
    return Array.from(cookieJar.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
}

async function fetchAllSpaces() {
    let spaces = [];
    let url = `${CONFLUENCE_BASE_URL}?limit=25`;
    while (url) {
        const requestHeaders = { ...headers };
        const cookieHeader = buildCookieHeader();
        if (cookieHeader) {
            requestHeaders.Cookie = cookieHeader;
        }

        const res = await fetch(url, { headers: requestHeaders });
        storeResponseCookies(res);

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (data.results) {
            spaces = spaces.concat(data.results);
        }
        url = data._links && data._links.next
            ? new URL(data._links.next, CONFLUENCE_BASE_URL).toString()
            : null;
    }
    return spaces;
}

(async () => {
    try {
        const spaces = await fetchAllSpaces();
        console.log(`Retrieved ${spaces.length} spaces.`);
        // Do something with the spaces array, e.g., print names:
        spaces.forEach(space => console.log(space.name, space.key));
    } catch (err) {
        console.error('Error:', err);
    }
})();
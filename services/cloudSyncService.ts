import type { Settings } from '../types';

const GITHUB_API_URL = 'https://api.github.com/gists/';
const SETTINGS_FILENAME = 'sms-receiver-settings.json';

const getHeaders = (token: string) => ({
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${token}`,
});

export const fetchSettingsFromGist = async (gistId: string, token: string): Promise<Settings> => {
    const response = await fetch(`${GITHUB_API_URL}${gistId}`, {
        headers: getHeaders(token),
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Gist not found. Please check the Gist ID.');
        }
        if (response.status === 401) {
            throw new Error('Unauthorized. Please check your GitHub token.');
        }
        throw new Error(`GitHub API returned status ${response.status}`);
    }

    const gistData = await response.json();

    const settingsFile = gistData.files[SETTINGS_FILENAME];
    if (!settingsFile) {
        throw new Error(`Could not find the required file '${SETTINGS_FILENAME}' in the Gist.`);
    }

    try {
        const settings = JSON.parse(settingsFile.content);
        // Basic validation
        if (typeof settings.title !== 'string' || !Array.isArray(settings.publicNumbers)) {
            throw new Error('Content of the Gist is not valid settings JSON.');
        }
        return settings;
    } catch (e) {
        throw new Error('Failed to parse settings from Gist content.');
    }
};

export const saveSettingsToGist = async (gistId: string, token: string, settings: Settings): Promise<void> => {
    const content = JSON.stringify(settings, null, 2);

    const payload = {
        files: {
            [SETTINGS_FILENAME]: {
                content: content,
            },
        },
    };

    const response = await fetch(`${GITHUB_API_URL}${gistId}`, {
        method: 'PATCH',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Gist not found. Please check the Gist ID.');
        }
        if (response.status === 401) {
            throw new Error('Unauthorized. Please check your GitHub token.');
        }
        throw new Error(`GitHub API returned status ${response.status}`);
    }

    // No need to parse response on success for PATCH
};
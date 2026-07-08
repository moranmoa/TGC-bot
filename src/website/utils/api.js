// מחלץ את הטוקן מהלוקאל סטורג'
const getToken = () => localStorage.getItem('discord_token');

// כותרות בסיס עם הטוקן ב-Authorization (במקום ב-URL, כדי שלא ידלוף להיסטוריה/לוגים)
const authHeaders = (extra = {}) => ({
    'Authorization': getToken() || '',
    ...extra,
});

export async function getGuildSettings(guildId) {
    const res = await fetch(`/api/guilds/${guildId}/settings`, { headers: authHeaders() });
    if (!res.ok) return {};
    return await res.json();
}

export async function saveGuildSettings(guildId, data) {
    const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function getGuildChannels(guildId) {
    const res = await fetch(`/api/guilds/${guildId}/channels`, { headers: authHeaders() });
    if (!res.ok) return [];
    return await res.json();
}

// -- הפונקציות החדשות לפעולות אקטיביות --

export async function getGuildMembers(guildId) {
    const cacheKey = `guild_members_${guildId}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        // Check if data is less than 1 hour old (3600000 ms)
        if (now - parsed.timestamp < 3600000) {
            return parsed.data;
        }
    }

    const res = await fetch(`/api/guilds/${guildId}/members`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();

    // Save to local storage with current timestamp
    localStorage.setItem(cacheKey, JSON.stringify({
        data: data,
        timestamp: Date.now()
    }));

    return data;
}

export async function kickMember(guildId, userId) {
    const res = await fetch(`/api/guilds/${guildId}/actions/kick`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Failed to kick user');
    return await res.json();
}

export async function createVoiceRoom(guildId, roomName) {
    const res = await fetch(`/api/guilds/${guildId}/actions/gen-room`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ roomName })
    });
    if (!res.ok) throw new Error('Failed to create voice room');
    return await res.json();
}
export async function getGenRooms(guildId) {
    const res = await fetch(`/api/guilds/${guildId}/gen-rooms`, { headers: authHeaders() });
    if (!res.ok) return [];
    return await res.json();
}

export async function deleteVoiceRoom(guildId, channelId) {
    const res = await fetch(`/api/guilds/${guildId}/actions/gen-room/${channelId}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete voice room');
    return await res.json();
}

export async function getAdminBotGuilds() {
    const res = await fetch(`/api/admin/bot-guilds`, { headers: authHeaders() });

    // טיפול במצב שבו למשתמש אין גישה למסך הזה
    if (res.status === 403) {
        throw new Error('FORBIDDEN');
    }

    if (!res.ok) throw new Error('Failed to fetch bot guilds');
    return await res.json();
}

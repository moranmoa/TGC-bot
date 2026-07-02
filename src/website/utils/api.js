// מחלץ את הטוקן מהלוקאל סטורג'
const getToken = () => localStorage.getItem('discord_token');

export async function getGuildSettings(guildId) {
    const res = await fetch(`/api/guilds/${guildId}/settings?token=${getToken()}`);
    if (!res.ok) return {};
    return await res.json();
}

export async function saveGuildSettings(guildId, data) {
    const res = await fetch(`/api/guilds/${guildId}/settings?token=${getToken()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function getGuildChannels(guildId) {
    const res = await fetch(`/api/guilds/${guildId}/channels?token=${getToken()}`);
    if (!res.ok) return [];
    return await res.json();
}

// -- הפונקציות החדשות לפעולות אקטיביות --

export async function getGuildMembers(guildId) {
    const res = await fetch(`/api/guilds/${guildId}/members?token=${getToken()}`);
    if (!res.ok) return [];
    return await res.json();
}

export async function kickMember(guildId, userId) {
    const res = await fetch(`/api/guilds/${guildId}/actions/kick?token=${getToken()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Failed to kick user');
    return await res.json();
}

export async function createVoiceRoom(guildId, roomName) {
    const res = await fetch(`/api/guilds/${guildId}/actions/gen-room?token=${getToken()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName })
    });
    if (!res.ok) throw new Error('Failed to create voice room');
    return await res.json();
}
export async function getGenRooms(guildId) {
    const res = await fetch(`/api/guilds/${guildId}/gen-rooms?token=${getToken()}`);
    if (!res.ok) return [];
    return await res.json();
}

export async function deleteVoiceRoom(guildId, channelId) {
    const res = await fetch(`/api/guilds/${guildId}/actions/gen-room/${channelId}?token=${getToken()}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete voice room');
    return await res.json();
}
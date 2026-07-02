// website/commands/spamprotection.js
import { getGuildSettings, getGuildChannels, saveGuildSettings } from '../utils/api.js';

export async function render(container, command, guildId) {
    // 1. נציג מצב טעינה
    container.innerHTML = `
        <div class="flex justify-center items-center h-full text-blue-500">
            <i class="fas fa-spinner fa-spin text-4xl"></i>
        </div>
    `;

    // 2. נמשוך במקביל את ההגדרות הקיימות ואת רשימת הערוצים של השרת
    const [settings, channels] = await Promise.all([
        getGuildSettings(guildId),
        getGuildChannels(guildId)
    ]);

    // אם אין הגדרות, ערך ברירת המחדל הוא false
    const isEnabled = settings.SpamProtection || false;
    const currentLogChannel = settings.SpamProtectionLogChannel || '';

    // נסנן רק ערוצי טקסט (type 0 בדרך כלל בדיסקורד) וניצור את רשימת ה-options
    const channelsOptions = channels
        .filter(c => c.type === 0) 
        .map(c => `<option value="${c.id}" ${c.id === currentLogChannel ? 'selected' : ''}># ${c.name}</option>`)
        .join('');

    // 3. נרנדר את התוכן למסך
    container.innerHTML = `
        <div class="max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl animate-fadeIn mx-auto mt-10">
            <div class="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        Spam Protection Settings
                        <i class="fas fa-shield-alt text-blue-500"></i>
                    </h2>
                    <p class="text-slate-400 text-sm mt-1">${command.description || 'Manage the server\'s spam protection system'}</p>
                </div>
            </div>

            <div class="space-y-6">
                <div class="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <div class="text-left">
                        <h4 class="font-semibold text-white">Command Status</h4>
                        <p class="text-xs text-slate-400">Enable or disable automatic spam filtering on the server</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="spam-toggle" class="sr-only peer" ${isEnabled ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div class="space-y-2 text-left">
                    <label class="block text-sm font-semibold text-slate-300">Log Channel</label>
                    <select id="spam-log-channel" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500 text-left font-mono">
                        <option value="">-- Do not log --</option>
                        ${channelsOptions}
                    </select>
                </div>

                <button id="save-spam-settings" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                    <i class="fas fa-save"></i>
                    Save and Update Server
                </button>
            </div>
        </div>
    `;

    // 4. נוסיף אירוע לכפתור השמירה
    document.getElementById('save-spam-settings').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        const enable = document.getElementById('spam-toggle').checked;
        const logChannelId = document.getElementById('spam-log-channel').value;
        
        await saveGuildSettings(guildId, {
            SpamProtection: enable,
            SpamProtectionLogChannel: logChannelId || null
        });

        btn.innerHTML = '<i class="fas fa-check"></i> Saved Successfully!';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
    });
}
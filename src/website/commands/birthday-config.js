import { getGuildSettings, getGuildChannels, saveGuildSettings } from '../utils/api.js';

export async function render(container, command, guildId) {
    container.innerHTML = `<div class="flex justify-center items-center h-full text-blue-500"><i class="fas fa-spinner fa-spin text-4xl"></i></div>`;

    const [settings, channels] = await Promise.all([
        getGuildSettings(guildId),
        getGuildChannels(guildId)
    ]);

    // שולף את ההגדרות של מערכת ימי ההולדת[cite: 1]
    const birthdaySettings = settings.birthdayToast || {};
    const isEnabled = birthdaySettings.enabled || false;
    const currentChannel = birthdaySettings.channel || '';

    const channelsOptions = channels
        .filter(c => c.type === 0) 
        .map(c => `<option value="${c.id}" ${c.id === currentChannel ? 'selected' : ''}># ${c.name}</option>`)
        .join('');

    container.innerHTML = `
        <div class="max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl animate-fadeIn mx-auto mt-10">
            <h2 class="text-2xl font-bold text-white mb-6"><i class="fas fa-birthday-cake text-pink-500 mr-2"></i> Birthday Configuration</h2>
            
            <div class="space-y-6">
                <div class="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <div>
                        <h4 class="font-semibold text-white">Enable System</h4>
                        <p class="text-xs text-slate-400">Turn birthday announcements on or off</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="bday-toggle" class="sr-only peer" ${isEnabled ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-semibold text-slate-300">Announcement Channel</label>
                    <select id="bday-channel" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-pink-500">
                        <option value="">-- Select Channel --</option>
                        ${channelsOptions}
                    </select>
                </div>

                <button id="save-bday" class="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2">
                    <i class="fas fa-save"></i> Save Settings
                </button>
            </div>
        </div>
    `;

    document.getElementById('save-bday').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        await saveGuildSettings(guildId, {
            birthdayToast: {
                enabled: document.getElementById('bday-toggle').checked,
                channel: document.getElementById('bday-channel').value,
                lastCheckedDate: birthdaySettings.lastCheckedDate || new Date().toLocaleDateString('en-GB')
            }
        });

        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-save"></i> Save Settings', 2000);
    });
}
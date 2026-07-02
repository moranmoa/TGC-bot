import { getGuildSettings, getGuildChannels, saveGuildSettings, getGuildMembers } from '../utils/api.js';

export async function render(container, command, guildId) {
    container.innerHTML = `<div class="flex justify-center items-center h-full text-blue-500"><i class="fas fa-spinner fa-spin text-4xl"></i></div>`;

    const [settings, channels, members] = await Promise.all([
        getGuildSettings(guildId),
        getGuildChannels(guildId),
        getGuildMembers(guildId)
    ]);

    // שולף את ההגדרות של מערכת ימי ההולדת[cite: 1]
    const birthdaySettings = settings.birthdayToast || {};
    const isEnabled = birthdaySettings.enabled || false;
    const currentChannel = birthdaySettings.channel || '';
    const bdayList = settings.aBirthDayList || [];

    const memberOptions = members
        .map(m => `<option value="${m.id}">${m.username || 'Unknown'}</option>`)
        .join('');

    // Sort by month and day of birthday (e.g., "26/11") to show upcoming birthdays first
    bdayList.sort((a, b) => {
        const [aD, aM] = a.birthday.split('/').map(Number);
        const [bD, bM] = b.birthday.split('/').map(Number);
        return (aM * 100 + aD) - (bM * 100 + bD);
    });

    const bdayListHtml = bdayList.map(item => {
        const username = item.username || 'Unknown';
        return `
            <div class="flex justify-between text-sm py-1 border-b border-slate-800 last:border-none">
                <span class="text-white">${username} (${item.birthday})</span>
                        <span class="text-xs text-gray-500">ID: ${item.id ? item.id : 'N/A'}</span>
            </div>
        `;
    }).join('');

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

                <div class="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <label class="block text-sm font-semibold text-slate-300">Add / Edit User Birthday</label>
                    <div class="flex gap-2 items-center">
                        <select id="add-user-selector" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-pink-500">
                            <option value="">-- Select User --</option>
                            ${memberOptions}
                        </select>
                        <input type="number" id="add-user-day" placeholder="Day (1-31)" class="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-pink-500">
                        <input type="number" id="add-user-month" placeholder="Month (1-12)" class="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-pink-500">
                        <button id="add-user-save" class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl transition flex items-center justify-center">
                            <i class="fas fa-save"></i>
                        </button>
                    </div>
                </div>

                <button id="save-bday" class="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2">
                    <i class="fas fa-save"></i> Save Settings
                </button>

                <div class="mt-6 pt-6 border-t border-slate-700/50">
                    <h3 class="text-lg font-semibold text-white mb-4"><i class="fas fa-list text-pink-500 mr-2"></i>Birthdays List</h3>
                    <div class="max-h-60 overflow-y-auto space-y-1">
                        ${bdayListHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('add-user-save').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const userId = document.getElementById('add-user-selector').value;
        const day = prompt("Enter Day (1-31)");
        const month = prompt("Enter Month (1-12)");

        if (!userId || !day || !month) {
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            setTimeout(() => btn.innerHTML = '<i class="fas fa-save"></i>', 2000);
            return;
        }

        const birthdayString = `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;
        const userData = {
            id: userId,
            username: document.getElementById('add-user-selector').options[document.getElementById('add-user-selector').selectedIndex].text,
            birthday: birthdayString,
            announcedThisYear: false
        };

        let currentList = [...bdayList];
        const index = currentList.findIndex(u => u.id === userId);
        
        if (index > -1) {
            currentList[index] = userData;
        } else {
            currentList.push(userData);
        }

        await saveGuildSettings(guildId, {
            birthdayToast: {
                ...birthdaySettings
            },
            aBirthDayList: currentList
        });

        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-save"></i>', 2000);
    });

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
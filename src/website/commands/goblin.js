import { getGuildSettings, saveGuildSettings } from '../utils/api.js';

export async function render(container, command, guildId) {
    container.innerHTML = `<div class="flex justify-center items-center h-full text-green-500"><i class="fas fa-spinner fa-spin text-4xl"></i></div>`;

    const settings = await getGuildSettings(guildId);
    const isEnabled = settings.GoblinEvent || false; // שולף את ההגדרה הקיימת[cite: 3]

    container.innerHTML = `
        <div class="max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl animate-fadeIn mx-auto mt-10">
            <h2 class="text-2xl font-bold text-white mb-6"><i class="fas fa-ghost text-green-500 mr-2"></i> Goblin Spawn Event</h2>
            
            <div class="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-6">
                <div>
                    <h4 class="font-semibold text-white">Event Status</h4>
                    <p class="text-xs text-slate-400">Enable or disable random goblin spawns</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="goblin-toggle" class="sr-only peer" ${isEnabled ? 'checked' : ''}>
                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

            <button id="save-goblin" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2">
                <i class="fas fa-save"></i> Save Event Status
            </button>
        </div>
    `;

    document.getElementById('save-goblin').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        await saveGuildSettings(guildId, {
            GoblinEvent: document.getElementById('goblin-toggle').checked
        });

        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-save"></i> Save Event Status', 2000);
    });
}
import { getGuildMembers, kickMember } from '../utils/api.js'; // נדרוש פונקציות חדשות

export async function render(container, command, guildId) {
    container.innerHTML = `<div class="flex justify-center items-center h-full text-red-500"><i class="fas fa-spinner fa-spin text-4xl"></i></div>`;

    let members = [];
    try {
        members = await getGuildMembers(guildId);
    } catch (e) {
        console.error("Could not fetch members");
    }

    // Sorted list of members for the autocomplete search

    container.innerHTML = `
        <div class="max-w-2xl border border-red-500/30 bg-red-950/20 rounded-2xl p-6 shadow-xl animate-fadeIn mx-auto mt-10">
            <h2 class="text-2xl font-bold text-red-400 mb-6"><i class="fas fa-user-times mr-2"></i> Kick Member</h2>
            
            <div class="space-y-4 mb-6">
                <div class="space-y-2 relative">
                    <label class="block text-sm font-semibold text-slate-300">Select User to Kick</label>
                    <input 
                        id="kick-user" 
                        type="text" 
                        placeholder="Type to search for a member..." 
                        class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-red-500"
                        autocomplete="off"
                    />
                    <div id="kick-user-results" class="absolute z-10 w-full hidden bg-slate-900 border border-slate-700 rounded-lg mt-1 overflow-hidden max-h-60 overflow-y-auto shadow-2xl"></div>
                </div>
            </div>

            <button id="execute-kick" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2">
                <i class="fas fa-gavel"></i> Kick Selected User
            </button>
            <div id="kick-status" class="mt-4 text-center text-sm hidden"></div>
        </div>
    `;

    const inputField = document.getElementById('kick-user');
    const resultsDiv = document.getElementById('kick-user-results');
    const sortedMembers = [...members].sort((a, b) => a.username.localeCompare(b.username));

    inputField.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            resultsDiv.innerHTML = '';
            resultsDiv.classList.add('hidden');
            return;
        }

        const filtered = sortedMembers.filter(m => m.username.toLowerCase().includes(query));
        
        if (filtered.length > 0) {
            resultsDiv.innerHTML = filtered
                .map(m => `<div class="p-2 hover:bg-red-900/40 cursor-pointer border-b border-slate-800 last:border-none" data-id="${m.id}">${m.username}</div>`)
                .join('');
            resultsDiv.classList.remove('hidden');
        } else {
            resultsDiv.classList.add('hidden');
        }
    });

    // Close results if clicking outside
    document.addEventListener('click', (e) => {
        if (!inputField.contains(e.target)) {
            resultsDiv.classList.add('hidden');
        }
    });

    // Select user from list
    resultsDiv.addEventListener('click', (e) => {
        const item = e.target.closest('div');
        if (item) {
            inputField.value = item.innerText; // Set visible name
            inputField.dataset.id = item.getAttribute('data-id'); // Store actual ID
            resultsDiv.classList.add('hidden');
        }
    });

    document.getElementById('execute-kick').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const userId = inputField.dataset.id || inputField.value; // Fallback to value if no specific ID was selected from list
        const statusDiv = document.getElementById('kick-status');
        
        if (!userId || userId === "") return alert('Select a user first');
        
        if (!confirm('Are you sure you want to kick this user?')) return;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kicking...';
        
        try {
            await kickMember(guildId, userId);
            statusDiv.innerHTML = `<span class="text-green-400"><i class="fas fa-check"></i> User kicked successfully.</span>`;
            statusDiv.classList.remove('hidden');
        } catch (err) {
            statusDiv.innerHTML = `<span class="text-red-400"><i class="fas fa-times"></i> Error kicking user. Check bot permissions.</span>`;
            statusDiv.classList.remove('hidden');
        }

        btn.innerHTML = '<i class="fas fa-gavel"></i> Kick Selected User';
    });
}
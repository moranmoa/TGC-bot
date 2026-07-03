import { getGuildMembers, kickMember } from '../utils/api.js';
import { createAutocompleteInput } from '../components/AutocompleteInput.js';

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
                <div id="kick-autocomplete" class="space-y-2 relative"></div>
            </div>

            <button id="execute-kick" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2">
                <i class="fas fa-gavel"></i> Kick Selected User
            </button>
            <div id="kick-status" class="mt-4 text-center text-sm hidden"></div>
        </div>
    `;

    const autocomplete = createAutocompleteInput(
        document.getElementById('kick-autocomplete'),
        { 
            id: 'kick-user', 
            placeholder: "Type to search for a member...", 
            label: 'Select User to Kick', 
            items: members 
        }
    );

    document.getElementById('execute-kick').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const userId = autocomplete.getSelectedId();
        const statusDiv = document.getElementById('kick-status');
        
        if (!userId || userId === "") return alert('Select a user first');
        
        if (!confirm('Are you sure you want to kick this user?')) return;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kicking...';
        
        try {
            await kickMember(guildId, userId);
            localStorage.removeItem(`guild_members_${guildId}`);
            statusDiv.innerHTML = `<span class="text-green-400"><i class="fas fa-check"></i> User kicked successfully.</span>`;
            statusDiv.classList.remove('hidden');
        } catch (err) {
            statusDiv.innerHTML = `<span class="text-red-400"><i class="fas fa-times"></i> Error kicking user. Check bot permissions.</span>`;
            statusDiv.classList.remove('hidden');
        }

        btn.innerHTML = '<i class="fas fa-gavel"></i> Kick Selected User';
    });
}
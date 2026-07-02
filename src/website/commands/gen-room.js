import { createVoiceRoom, getGenRooms, deleteVoiceRoom } from '../utils/api.js';

export async function render(container, command, guildId) {
    // שלד התצוגה המרכזי
    container.innerHTML = `
        <div class="max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl animate-fadeIn mx-auto mt-10">
            <h2 class="text-2xl font-bold text-white mb-6"><i class="fas fa-microphone text-purple-500 mr-2"></i> Voice Room Generator</h2>
            
            <!-- אזור יצירת חדר חדש -->
            <div class="space-y-4 mb-8 pb-8 border-b border-slate-700">
                <div class="space-y-2">
                    <label class="block text-sm font-semibold text-slate-300">Generator Room Name</label>
                    <input type="text" id="room-name" placeholder="e.g. ➕ Create Room" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-purple-500 text-left font-mono">
                    <p class="text-xs text-slate-400 mt-1">This will instantly create a new generator voice channel in your server.</p>
                </div>
                <button id="create-room" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2">
                    <i class="fas fa-plus-circle"></i> Create Generator Room
                </button>
                <div id="room-status" class="mt-4 text-center text-sm hidden"></div>
            </div>

            <!-- רשימת חדרים קיימים -->
            <div>
                <h3 class="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <i class="fas fa-list-ul text-slate-500"></i> Active Generator Rooms
                </h3>
                <div id="rooms-list" class="space-y-3">
                    <div class="text-center text-slate-500 py-4"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
                </div>
            </div>
        </div>
    `;

    // פונקציה פנימית לטעינה ורנדור של רשימת החדרים
    const loadRooms = async () => {
        const listContainer = document.getElementById('rooms-list');
        try {
            const rooms = await getGenRooms(guildId);
            
            if (rooms.length === 0) {
                listContainer.innerHTML = `<div class="text-center text-slate-500 text-sm py-6 bg-slate-900/50 rounded-xl border border-slate-700/50 border-dashed">No generator rooms configured yet.</div>`;
                return;
            }

            listContainer.innerHTML = rooms.map(room => `
                <div class="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 transition hover:border-slate-600 group">
                    <div class="flex items-center gap-3 truncate">
                        <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                            <i class="fas fa-volume-up text-purple-400"></i>
                        </div>
                        <span class="font-medium text-slate-200 truncate ${!room.exists ? 'line-through text-slate-500' : ''}">${room.name}</span>
                        ${!room.exists ? '<span class="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 ml-2">Deleted in Discord</span>' : ''}
                    </div>
                    <button data-id="${room.id}" class="delete-room-btn text-slate-400 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-red-400 flex items-center gap-2 text-sm">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            `).join('');

            // הוספת מאזינים לכפתורי המחיקה
            document.querySelectorAll('.delete-room-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (!confirm('Are you sure you want to delete this channel? It will be permanently removed from Discord.')) return;
                    
                    const channelId = e.currentTarget.getAttribute('data-id');
                    const originalHtml = e.currentTarget.innerHTML;
                    e.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    e.currentTarget.disabled = true;

                    try {
                        await deleteVoiceRoom(guildId, channelId);
                        await loadRooms(); // טוען מחדש את הרשימה אחרי מחיקה
                    } catch (err) {
                        alert('Error deleting room.');
                        e.currentTarget.innerHTML = originalHtml;
                        e.currentTarget.disabled = false;
                    }
                });
            });

        } catch (err) {
            listContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-4">Failed to load rooms.</div>`;
        }
    };

    // טוען את הרשימה מיד עם פתיחת המסך
    await loadRooms();

    // הלוגיקה של כפתור יצירת החדר
    document.getElementById('create-room').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const roomName = document.getElementById('room-name').value;
        const statusDiv = document.getElementById('room-status');
        
        if (!roomName) {
            alert('Please enter a room name');
            return;
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        btn.disabled = true;
        
        try {
            await createVoiceRoom(guildId, roomName);
            statusDiv.innerHTML = `<span class="text-green-400"><i class="fas fa-check-circle"></i> Room created successfully!</span>`;
            statusDiv.classList.remove('hidden');
            document.getElementById('room-name').value = '';
            
            // טוען מחדש את הרשימה כדי להציג את החדר החדש!
            await loadRooms();
        } catch (err) {
            statusDiv.innerHTML = `<span class="text-red-400"><i class="fas fa-times-circle"></i> Error creating room</span>`;
            statusDiv.classList.remove('hidden');
        }

        btn.innerHTML = '<i class="fas fa-plus-circle"></i> Create Generator Room';
        btn.disabled = false;
        
        setTimeout(() => { statusDiv.classList.add('hidden'); }, 3000);
    });
}
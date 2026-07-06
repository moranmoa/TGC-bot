import { getAdminBotGuilds } from '../utils/api.js';
export async function render(container, command, guildId) {
    // מציג ספינר טעינה בהתחלה
    container.innerHTML = `
        <div class="flex justify-center items-center h-full text-blue-500">
            <i class="fas fa-spinner fa-spin text-4xl"></i>
        </div>
    `;

    try {
        // מנסה למשוך את השרתים (כאן בעצם מתבצעת בדיקת ההרשאות)
        const guilds = await getAdminBotGuilds();
        
        // יצירת רשימה מעוצבת
        const guildsHtml = guilds.map(g => `
            <div class="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 transition">
                <div class="flex items-center">
                    ${g.icon 
                        ? `<img src="${g.icon}" alt="${g.name}" class="w-12 h-12 rounded-full mr-4 shadow-lg">` 
                        : `<div class="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center mr-4 font-bold shadow-lg">${g.name.charAt(0)}</div>`
                    }
                    <div>
                        <h3 class="text-lg font-bold text-white">${g.name}</h3>
                        <p class="text-sm text-slate-400"><i class="fas fa-id-badge mr-1"></i> ${g.id}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="bg-blue-900/50 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-700">
                        <i class="fas fa-users mr-1"></i> ${g.memberCount}
                    </span>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="max-w-4xl border border-blue-500/30 bg-slate-900 rounded-2xl p-6 shadow-2xl animate-fadeIn mx-auto mt-10">
                <div class="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                    <h2 class="text-2xl font-bold text-blue-400"><i class="fas fa-server mr-2"></i>Bot Servers</h2>
                    <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">Total: ${guilds.length}</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh] pr-2">
                    ${guildsHtml}
                </div>
            </div>
        `;

    } catch (error) {
        // אם השרת החזיר שגיאת 403, נציג מסך שגיאה יפה למשתמש שמסורב כניסה
        if (error.message === 'FORBIDDEN') {
            container.innerHTML = `
                <div class="max-w-2xl border border-red-500/50 bg-red-950/40 rounded-2xl p-10 text-center shadow-xl animate-fadeIn mx-auto mt-10">
                    <i class="fas fa-shield-alt text-6xl text-red-500 mb-6 drop-shadow-lg"></i>
                    <h2 class="text-3xl font-bold text-white mb-4">Access Denied</h2>
                    <p class="text-red-300 text-lg">This section is highly classified and restricted to Bot Developers only.</p>
                </div>
            `;
        } else {
            // שגיאה כללית אחרת (למשל השרת למטה)
            container.innerHTML = `
                <div class="text-center text-red-500 mt-10 bg-slate-800 p-6 rounded-xl inline-block">
                    <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>Failed to load guilds. Please check server logs.</p>
                </div>
            `;
            console.error("Error loading guild list:", error);
        }
    }
}
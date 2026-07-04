// export async function render(container, command, guildId) {
//     container.innerHTML = `
//         <div class="flex justify-center items-center h-full text-blue-500">
//             <i class="fas fa-spinner fa-spin text-4xl"></i>
//         </div>
//     `;

//     let guilds = [];
//     try {
//         debugger
//         const res = await fetch('/data/data_guilds.json');
//         if (res.ok) {
//             guilds = await res.json();
//         } else {
//             console.error("Could not fetch guilds from /data/data_guilds.json");
//         }
//     } catch (e) {
//         console.error("Error fetching data:", e);
//     }

//     container.innerHTML = `
//         <div class="max-w-2xl border border-blue-500/30 bg-blue-950/20 rounded-2xl p-6 shadow-xl animate-fadeIn mx-auto mt-10">
//             <h2 class="text-2xl font-bold text-blue-400 mb-6"><i class="fas fa-users mr-2"></i>Guilds List</h2>
//             <div class="grid grid-cols-1 gap-4">
//                 ${guilds.map(guild => `
//                     <button class="w-full p-4 bg-blue-900/40 border border-blue-800/50 rounded-xl text-left hover:bg-blue-800/60 transition duration-200">
//                         ${guild.name}
//                     </button>
//                 `).join('')}
//             </div>
//         </div>
//     `;
// }

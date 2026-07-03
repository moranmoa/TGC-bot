/**
 * A reusable Autocomplete Input component for select-and-search functionality.
 * @param {HTMLElement} container - The parent element where the autocomplete input will be rendered.
 * @param {Object} options - Configuration options.
 * @param {string} options.id - Unique ID for the input field and result container.
 * @param {string} options.placeholder - Placeholder text for the input.
 * @param {string} options.label - Label text for the selection.
 * @param {Array} options.items - The array of items to be used in the search (must have 'id' and 'name' or similar).
 */
export function createAutocompleteInput(container, { id, placeholder = "Type to search...", label, items = [] } = {}) {
    const inputId = id || `autocomplete-${Math.random().toString(36).substr(2, 9)}`;
    const resultsId = `${inputId}-results`;

    // Inject the HTML structure
    container.innerHTML = `
        <div class="space-y-2 relative">
            <label class="block text-sm font-semibold text-slate-300">${label || 'Select Item'}</label>
            <input 
                id="${inputId}" 
                type="text" 
                placeholder="${placeholder}" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 ${label ? 'focus:ring-blue-500' : 'focus:ring-white'}"
                autocomplete="off"
            />
            <div id="${resultsId}" class="absolute z-10 w-full hidden bg-slate-900 border border-slate-700 rounded-lg mt-1 overflow-hidden max-h-60 overflow-y-auto shadow-2xl"></div>
        </div>
    `;

    const inputField = document.getElementById(inputId);
    const resultsDiv = document.getElementById(resultsId);
    const sortedItems = [...items].sort((a, b) => String(a.name || a.username).localeCompare(String(b.name || b.username)));

    // Input interaction
    inputField.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            resultsDiv.innerHTML = '';
            resultsDiv.classList.add('hidden');
            return;
        }

        const filtered = sortedItems.filter(item => 
            String(item.name || item.username).toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            resultsDiv.innerHTML = filtered
                .map(item => `
                    <div class="p-2 hover:bg-white/10 cursor-pointer border-b border-slate-800 last:border-none" data-id="${item.id}">
                        ${item.name || item.username}
                    </div>
                `).join('');
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

    // Selection logic
    resultsDiv.addEventListener('click', (e) => {
        const item = e.target.closest('div');
        if (item) {
            inputField.value = item.innerText;
            inputField.dataset.id = item.getAttribute('data-id');
            resultsDiv.classList.add('hidden');
        }
    });

    // Return handles to the internal elements if needed for external logic (like button clicks)
    return {
        inputField,
        resultsDiv,
        getSelectedId: () => inputField.dataset.id || inputField.value
    };
}
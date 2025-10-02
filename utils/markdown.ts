// A simple but effective markdown-to-HTML parser
export const parseMarkdown = (text: string): string => {
    if (!text) return '';

    let processedText = text;

    // Process markdown line by line
    const lines = processedText.split('\n');
    let html = '';
    let inList = false;

    for (const line of lines) {
        // Headers
        if (line.startsWith('### ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h3 class="text-xl font-bold text-slate-800 dark:text-slate-200 mt-5 mb-2">${line.substring(4)}</h3>\n`;
            continue;
        }
        if (line.startsWith('## ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-6 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">${line.substring(3)}</h2>\n`;
            continue;
        }
        if (line.startsWith('# ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h1 class="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-8 mb-4">${line.substring(2)}</h1>\n`;
            continue;
        }

        // Unordered List
        if (line.startsWith('* ')) {
            if (!inList) {
                html += '<ul class="list-disc list-inside space-y-2 mb-4 text-slate-600 dark:text-slate-300">\n';
                inList = true;
            }
            html += `  <li>${line.substring(2)}</li>\n`;
            continue;
        }

        // Close list if it was open
        if (inList) {
            html += '</ul>\n';
            inList = false;
        }
        
        // Blockquotes
        if (line.startsWith('> ')) {
             html += `<blockquote class="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic my-4 text-slate-600 dark:text-slate-300">${line.substring(2)}</blockquote>\n`;
             continue;
        }
        
        // Pass through existing HTML tags without wrapping in <p>
        if (line.trim().match(/^<.*>$/)) {
            html += line + '\n';
            continue;
        }

        // Paragraph
        if (line.trim() !== '') {
            html += `<p class="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">${line}</p>\n`;
        }
    }
    
    if (inList) {
        html += '</ul>\n';
    }

    // Inline elements (run on the whole block)
    // Images: ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-4 rounded-lg shadow-md" style="max-width: 100%;" />');
    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-500 dark:text-teal-400 hover:underline">$1</a>');
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return html;
};
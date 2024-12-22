// Debounce function to limit how often a function can be called
export const debounce = (func, wait) => {
    let timeout = null;
    
    return (...args) => {
        if (timeout) {
            return;
        }

        func(...args);
        
        timeout = setTimeout(() => {
            timeout = null;
        }, wait);
    };
};

export default { debounce };

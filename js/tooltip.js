(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);

    document.querySelectorAll('[title]').forEach(el => {
        if (!el.dataset.tooltip) {
            el.dataset.tooltip = el.getAttribute('title');
            el.removeAttribute('title');
        }
    });

    let activeTarget = null;
    let hideTimer = null;

    function showTooltip(target) {
        clearTimeout(hideTimer);
        const text = target.dataset.tooltip;
        if (!text) return;
        tooltip.textContent = text;
        tooltip.classList.add('visible');
        positionTooltip(target);
        activeTarget = target;
    }

    function hideTooltip() {
        tooltip.classList.remove('visible');
        activeTarget = null;
    }

    function positionTooltip(target) {
        tooltip.style.transform = '';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';
        tooltip.style.maxWidth = '';

        const rect = target.getBoundingClientRect();
        const tw = tooltip.offsetWidth || 280;
        const th = tooltip.offsetHeight || 50;
        const margin = 8;
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        // Try position above first
        let top = rect.top + scrollY - th - margin;
        let left = rect.left + rect.width / 2 - tw / 2;
        let arrowPos = 'bottom';

        // Check if tooltip goes above viewport
        if (rect.top - th - margin < 0) {
            top = rect.bottom + scrollY + margin;
            arrowPos = 'top';
        }

        // Check horizontal boundaries
        const maxLeft = window.innerWidth - tw - 10;
        if (left > maxLeft) left = maxLeft;
        if (left < 10) left = 10;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.setAttribute('data-arrow', arrowPos);
    }

    // Setup tooltip event listeners for ALL elements with data-tooltip
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('mouseenter', (e) => {
            if (e.target.dataset.tooltip) {
                showTooltip(e.target);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target === activeTarget) {
                hideTimer = setTimeout(hideTooltip, 100);
            }
        }, true);

        document.addEventListener('click', (e) => {
            if (activeTarget && e.target !== activeTarget) {
                hideTooltip();
            }
        });
    });
})();
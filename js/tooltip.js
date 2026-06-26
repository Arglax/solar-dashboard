// ============================================================
// Tooltip System - Lightweight tooltip for info icons
// ============================================================

(() => {
    let activeTooltip = null;
    let hideTimer = null;

    /**
     * Create tooltip element
     */
    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'globalTooltip';
        tooltip.className = 'tooltip-popup';
        tooltip.setAttribute('role', 'tooltip');
        document.body.appendChild(tooltip);
        return tooltip;
    }

    /**
     * Get or create tooltip
     */
    function getTooltip() {
        return document.getElementById('globalTooltip') || createTooltip();
    }

    /**
     * Show tooltip with content
     */
    function showTooltip(target) {
        const text = target.dataset.tooltip;
        if (!text) return;

        clearTimeout(hideTimer);

        const tooltip = getTooltip();
        tooltip.textContent = text;
        tooltip.classList.add('visible');

        positionTooltip(target, tooltip);
        activeTooltip = target;
    }

    /**
     * Hide tooltip
     */
    function hideTooltip() {
        const tooltip = getTooltip();
        hideTimer = setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 100);
        activeTooltip = null;
    }

    /**
     * Position tooltip near target
     */
    function positionTooltip(target, tooltip) {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 280;
        const tooltipHeight = 50;
        const margin = 8;
        const padding = 10;

        // Calculate position
        let top = rect.top + window.scrollY - tooltipHeight - margin;
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Check if above viewport
        if (rect.top - tooltipHeight - margin < 0) {
            top = rect.bottom + window.scrollY + margin;
        }

        // Adjust horizontal bounds
        if (left < padding) {
            left = padding;
        } else if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    /**
     * Initialize tooltips
     */
    function init() {
        // Convert title attributes to data-tooltip
        document.querySelectorAll('[title]').forEach(el => {
            if (!el.dataset.tooltip) {
                el.dataset.tooltip = el.getAttribute('title');
                el.removeAttribute('title');
            }
        });

        // Setup event delegation
        document.addEventListener('mouseenter', (e) => {
            if (e.target.dataset.tooltip && e.target.classList.contains('info-icon')) {
                showTooltip(e.target);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target === activeTooltip) {
                hideTooltip();
            }
        }, true);

        document.addEventListener('click', (e) => {
            if (activeTooltip && e.target !== activeTooltip) {
                hideTooltip();
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for testing
    window.TooltipSystem = {
        showTooltip,
        hideTooltip
    };
})();

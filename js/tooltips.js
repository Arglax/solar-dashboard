(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);

    // Move native title into data-tooltip to avoid browser native tooltip
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
        // reset to measure
        tooltip.style.transform = '';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';
        tooltip.style.maxWidth = '';

        const rect = target.getBoundingClientRect();
        const tw = tooltip.offsetWidth || 240;
        const th = tooltip.offsetHeight || 48;
        const margin = 8;

        // default: above element, centered
        let top = rect.top - th - margin;
        let left = rect.left + rect.width / 2 - tw / 2;

        // if not enough space above, place below
        if (top < 8) {
            top = rect.bottom + margin;
            // move arrow visually handled by CSS (arrow is bottom by default)
        }

        // clamp horizontally
        left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));

        // mobile handling: center and use wider max width
        if (window.innerWidth <= 520) {
            tooltip.style.left = '50%';
            tooltip.style.top = (rect.bottom + margin) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.maxWidth = 'calc(100% - 32px)';
        } else {
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.style.transform = '';
        }
    }

    function attachEventsTo(el) {
        el.addEventListener('pointerenter', () => showTooltip(el));
        el.addEventListener('pointerleave', () => {
            hideTimer = setTimeout(hideTooltip, 80);
        });
        el.addEventListener('focus', () => showTooltip(el));
        el.addEventListener('blur', () => hideTooltip());

        // Touch: tap to toggle tooltip (does not block other interactions)
        el.addEventListener('touchstart', (e) => {
            // Prevent accidental double-activation on touch
            if (activeTarget === el) {
                hideTooltip();
            } else {
                showTooltip(el);
                const onDocTouch = (ev) => {
                    if (!el.contains(ev.target) && !tooltip.contains(ev.target)) {
                        hideTooltip();
                        document.removeEventListener('touchstart', onDocTouch, { capture: true });
                    }
                };
                document.addEventListener('touchstart', onDocTouch, { capture: true });
            }
        }, { passive: true });
    }

    // Attach to existing and future nodes with data-tooltip
    function init() {
        const nodes = document.querySelectorAll('[data-tooltip]');
        nodes.forEach(attachEventsTo);

        // observe DOM for dynamically added tooltip triggers
        const ob = new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.addedNodes && m.addedNodes.length) {
                    m.addedNodes.forEach(n => {
                        if (n.nodeType === 1) {
                            if (n.matches && n.matches('[data-tooltip]')) attachEventsTo(n);
                            n.querySelectorAll && n.querySelectorAll('[data-tooltip]').forEach(attachEventsTo);
                        }
                    });
                }
            }
        });
        ob.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('resize', () => {
        if (activeTarget) positionTooltip(activeTarget);
    });
    window.addEventListener('scroll', () => {
        if (activeTarget) positionTooltip(activeTarget);
    }, true);

    init();
})();
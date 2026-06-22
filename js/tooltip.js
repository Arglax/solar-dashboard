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

        // Clamp horizontally with padding
        if (left < 8) {
            left = 8;
        } else if (left + tw > window.innerWidth - 8) {
            left = window.innerWidth - tw - 8;
        }

        // Mobile: center and expand width
        if (window.innerWidth <= 520) {
            tooltip.style.left = '50%';
            tooltip.style.top = (rect.bottom + scrollY + margin) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.maxWidth = 'calc(100% - 32px)';
        } else {
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.style.transform = '';
        }

        tooltip.dataset.arrowPos = arrowPos;
    }

    function attachEventsTo(el) {
        el.addEventListener('pointerenter', () => showTooltip(el));
        el.addEventListener('pointerleave', () => {
            hideTimer = setTimeout(hideTooltip, 80);
        });
        el.addEventListener('focus', () => showTooltip(el));
        el.addEventListener('blur', () => hideTooltip());

        el.addEventListener('touchstart', (e) => {
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

    function init() {
        document.querySelectorAll('[data-tooltip]').forEach(attachEventsTo);

        const ob = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.addedNodes && m.addedNodes.length) {
                    m.addedNodes.forEach(n => {
                        if (n.nodeType === 1) {
                            if (n.matches && n.matches('[data-tooltip]')) attachEventsTo(n);
                            n.querySelectorAll && n.querySelectorAll('[data-tooltip]').forEach(attachEventsTo);
                        }
                    });
                }
            });
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
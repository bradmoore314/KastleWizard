import { useEffect, useRef } from 'react';

const FOCUSABLE_ELEMENTS_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A custom hook to trap focus within a container element (e.g., a modal).
 * @param isOpen - A boolean indicating if the container is currently open/active.
 * @returns A ref to be attached to the container element.
 */
export const useFocusTrap = <T extends HTMLElement>(isOpen: boolean) => {
    const ref = useRef<T>(null);
    const lastFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            lastFocusedElement.current = document.activeElement as HTMLElement;
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !ref.current) return;

        const focusableElements = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR));
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            // If no element inside the trap is focused, direct focus to the first element.
            if (!ref.current?.contains(document.activeElement as Node)) {
                // FIX: Cast element to HTMLElement to access focus method.
                (firstElement as HTMLElement).focus();
                e.preventDefault();
                return;
            }
            
            if (e.shiftKey) { // Shift+Tab
                if (document.activeElement === firstElement) {
                    // FIX: Cast element to HTMLElement to access focus method.
                    (lastElement as HTMLElement).focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    // FIX: Cast element to HTMLElement to access focus method.
                    (firstElement as HTMLElement).focus();
                    e.preventDefault();
                }
            }
        };

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        // FIX: Cast element to HTMLElement to access tagName property.
        const isTextInputElement = (firstElement as HTMLElement).tagName === 'INPUT' || (firstElement as HTMLElement).tagName === 'TEXTAREA';

        if (!isTouchDevice || !isTextInputElement) {
            // FIX: Cast element to HTMLElement to access focus method.
            (firstElement as HTMLElement).focus();
        }

        const currentRef = ref.current;
        currentRef.addEventListener('keydown', handleKeyDown);

        return () => {
            currentRef?.removeEventListener('keydown', handleKeyDown);
            // FIX: Cast element to HTMLElement to access focus method.
            (lastFocusedElement.current as HTMLElement)?.focus();
        };
    }, [isOpen]);

    return ref;
};